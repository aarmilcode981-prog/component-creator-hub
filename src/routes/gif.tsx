import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Loader2, Upload } from "lucide-react";

export const Route = createFileRoute("/gif")({
  component: GifClient,
});

type Preset = { id: string; name: string; css: string; keyframes: string };

function GifClient() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetId, setPresetId] = useState<string>("");
  const [imgUrl, setImgUrl] = useState<string>("");
  const [duration, setDuration] = useState(2000);
  const [fps, setFps] = useState(15);
  const [busy, setBusy] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    supabase.from("css_presets").select("*").order("name").then(({ data, error }) => {
      if (error) return toast.error(error.message);
      setPresets((data ?? []) as Preset[]);
      if (data && data[0]) setPresetId((data[0] as Preset).id);
    });
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  const preset = presets.find((p) => p.id === presetId);
  const srcDoc = preset
    ? `<!doctype html><html><head><style>
html,body{margin:0;background:#0d0f14;display:flex;align-items:center;justify-content:center;height:100vh;overflow:hidden}
${preset.keyframes}
.fx{max-width:100%;max-height:100%;${preset.css}}
</style></head><body>${imgUrl ? `<img class="fx" src="${imgUrl}" />` : `<p style="color:#8a8f9a;font-family:sans-serif">Upload an image to preview</p>`}</body></html>`
    : "";

  async function exportGif() {
    if (!imgUrl) return toast.error("Upload an image first");
    if (!preset) return toast.error("Pick a preset");
    setBusy(true);
    let stage: HTMLDivElement | null = null;
    let styleEl: HTMLStyleElement | null = null;
    try {
      // dynamic imports (browser-only)
      const { toCanvas } = await import("html-to-image");
      const GIF = (await import("gif.js")).default;

      // Build a real DOM stage in the main document so CSS animations
      // actually tick between frame captures (html2canvas + iframes is unreliable).
      const uid = `gifx_${Math.random().toString(36).slice(2, 9)}`;
      styleEl = document.createElement("style");
      // Scope the preset's keyframes + rules to our stage so nothing leaks.
      styleEl.textContent = `
        #${uid}{position:fixed;left:-99999px;top:0;width:512px;height:512px;
          background:#0d0f14;display:flex;align-items:center;justify-content:center;overflow:hidden;z-index:-1}
        #${uid} .fx{max-width:100%;max-height:100%;${preset.css}}
        ${preset.keyframes}
      `;
      document.head.appendChild(styleEl);

      stage = document.createElement("div");
      stage.id = uid;
      const img = document.createElement("img");
      img.className = "fx";
      img.crossOrigin = "anonymous";
      img.src = imgUrl;
      stage.appendChild(img);
      document.body.appendChild(stage);

      // Wait for the image to load so the first frame isn't blank.
      await new Promise<void>((res, rej) => {
        if (img.complete && img.naturalWidth > 0) return res();
        img.onload = () => res();
        img.onerror = () => rej(new Error("Failed to load image"));
      });

      const rect = stage.getBoundingClientRect();
      const w = Math.max(64, Math.round(rect.width));
      const h = Math.max(64, Math.round(rect.height));

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: w,
        height: h,
        workerScript: "/gif.worker.js",
      });

      const frameCount = Math.max(1, Math.round((duration / 1000) * fps));
      const delay = Math.round(1000 / fps);
      const animatedElements = [img, ...Array.from(stage.querySelectorAll<HTMLElement>("*"))];

      const waitForPaint = () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

      for (let i = 0; i < frameCount; i++) {
        const elapsed = i * delay;
        animatedElements.forEach((el) => {
          // Freeze the live CSS animation at the exact timestamp for this GIF frame.
          // Without this, DOM-to-canvas cloning restarts animations at frame 0 each capture.
          el.style.animationDelay = `-${elapsed}ms`;
          el.style.animationFillMode = "both";
          el.style.animationPlayState = "paused";
        });
        stage.getBoundingClientRect();
        // eslint-disable-next-line no-await-in-loop
        await waitForPaint();
        // eslint-disable-next-line no-await-in-loop
        const canvas = await toCanvas(stage, {
          backgroundColor: "#0d0f14",
          width: w,
          height: h,
          cacheBust: true,
        });
        gif.addFrame(canvas, { delay, copy: true });
      }

      gif.on("finished", (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${preset.name.replace(/\s+/g, "-").toLowerCase()}.gif`;
        a.click();
        URL.revokeObjectURL(url);
        stage?.remove();
        styleEl?.remove();
        setBusy(false);
        toast.success("GIF downloaded");
      });
      gif.render();
    } catch (err) {
      stage?.remove();
      styleEl?.remove();
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-mono text-sm"><span className="text-primary">$</span> snippet-lab / gif</Link>
          <Link to="/components" className="text-sm text-muted-foreground hover:text-foreground">Components →</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold">GIF Maker</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload an image, apply a saved CSS preset, download as .gif.</p>
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            <label className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground cursor-pointer hover:border-primary/60 hover:text-foreground">
              <Upload className="size-4" />
              {imgUrl ? "Change image" : "Upload image"}
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
          </div>

          <div className="space-y-2">
            <Label>CSS preset</Label>
            <Select value={presetId} onValueChange={setPresetId}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {presets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {presets.length === 0 && (
              <p className="text-xs text-muted-foreground">No presets yet. Ask the admin to create one.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duration (ms)</Label>
              <Input type="number" min={200} step={100} value={duration} onChange={(e) => setDuration(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>FPS</Label>
              <Input type="number" min={5} max={30} value={fps} onChange={(e) => setFps(+e.target.value)} />
            </div>
          </div>

          <Button onClick={exportGif} disabled={busy || !imgUrl || !preset} className="w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {busy ? "Rendering…" : "Download GIF"}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="aspect-square w-full rounded-md overflow-hidden border border-border bg-[#0d0f14]">
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              sandbox="allow-same-origin"
              className="w-full h-full border-0"
              title="gif-preview"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Preview uses your image + the selected preset. Export captures {Math.round((duration / 1000) * fps)} frames.
          </p>
        </div>
      </div>
    </div>
  );
}