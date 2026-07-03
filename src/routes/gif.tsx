import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
  const [busy, setBusy] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    supabase
      .from("css_presets")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
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
  const previewWidth = Number.isFinite(width) && width > 0 ? width : 1;
  const previewHeight = Number.isFinite(height) && height > 0 ? height : 1;
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
    if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
      return toast.error("Enter a valid GIF width and height");
    }
    setBusy(true);
    let stage: HTMLDivElement | null = null;
    let styleEl: HTMLStyleElement | null = null;
    try {
      const GIF = (await import("gif.js")).default;

      // Render frames by drawing the source image directly to a 2D canvas,
      // applying the computed CSS transform/opacity/filter from a hidden
      // "probe" element at each timestamp. This avoids DOM->SVG cloning
      // (html-to-image / html2canvas) which is unreliable with paused
      // animations and modern color functions.
      const W = width;
      const H = height;
      const uid = `gifx_${Math.random().toString(36).slice(2, 9)}`;
      styleEl = document.createElement("style");
      styleEl.textContent = `
        #${uid}{position:fixed;left:-99999px;top:0;width:${W}px;height:${H}px;
          display:flex;align-items:center;justify-content:center;overflow:hidden;z-index:-1;pointer-events:none}
        #${uid} .fx{max-width:100%;max-height:100%;${preset.css}}
        ${preset.keyframes}
      `;
      document.head.appendChild(styleEl);

      stage = document.createElement("div");
      stage.id = uid;
      const probe = document.createElement("img");
      probe.className = "fx";
      probe.src = imgUrl;
      stage.appendChild(probe);
      document.body.appendChild(stage);

      // Load a separate source Image for drawImage.
      const src = new Image();
      src.src = imgUrl;
      await new Promise<void>((res, rej) => {
        const done = () => {
          if (src.complete && probe.complete && src.naturalWidth > 0) res();
        };
        if (src.complete && probe.complete && src.naturalWidth > 0) return res();
        src.onload = done;
        probe.onload = done;
        src.onerror = () => rej(new Error("Failed to load image"));
        probe.onerror = () => rej(new Error("Failed to load image"));
      });

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: W,
        height: H,
        background: "#0d0f14",
        workerScript: "/gif.worker.js",
      });

      const frameCount = Math.max(1, Math.round((duration / 1000) * fps));
      const delay = Math.round(1000 / fps);

      const waitForPaint = () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

      // Rendered box of the probe image (unaffected by transform).
      probe.style.animationPlayState = "paused";
      probe.style.animationDelay = "0ms";
      probe.style.animationFillMode = "both";
      await waitForPaint();
      const pRect = probe.getBoundingClientRect();
      const sRect = stage.getBoundingClientRect();
      const cx = pRect.left + pRect.width / 2 - sRect.left;
      const cy = pRect.top + pRect.height / 2 - sRect.top;
      const iw = pRect.width || src.naturalWidth;
      const ih = pRect.height || src.naturalHeight;

      for (let i = 0; i < frameCount; i++) {
        const elapsed = i * delay;
        probe.style.animationDelay = `-${elapsed}ms`;
        // Force reflow so computed style reflects the new delay.
        void probe.offsetWidth;
        await waitForPaint();

        const cs = getComputedStyle(probe);
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#0d0f14";
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        // Move to the image center, apply transform matrix around center.
        ctx.translate(cx, cy);
        if (cs.transform && cs.transform !== "none") {
          try {
            const m = new DOMMatrix(cs.transform);
            ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
          } catch {
            /* ignore */
          }
        }
        const op = parseFloat(cs.opacity);
        if (!Number.isNaN(op)) ctx.globalAlpha = op;
        if (cs.filter && cs.filter !== "none") {
          // Canvas ctx.filter supports the same syntax as CSS filter.
          try {
            ctx.filter = cs.filter;
          } catch {
            /* ignore */
          }
        }
        ctx.drawImage(src, -iw / 2, -ih / 2, iw, ih);
        ctx.restore();

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
          <Link to="/" className="font-mono text-sm">
            <span className="text-primary">$</span> snippet-lab / gif
          </Link>
          <Link to="/components" className="text-sm text-muted-foreground hover:text-foreground">
            Components →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold">GIF Maker</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload an image, apply a saved CSS preset, download as .gif.
            </p>
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
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {presets.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No presets yet. Ask the admin to create one.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gif-width">Width (px)</Label>
              <Input
                id="gif-width"
                type="number"
                min={1}
                step={1}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gif-height">Height (px)</Label>
              <Input
                id="gif-height"
                type="number"
                min={1}
                step={1}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duration (ms)</Label>
              <Input
                type="number"
                min={200}
                step={100}
                value={duration}
                onChange={(e) => setDuration(+e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>FPS</Label>
              <Input
                type="number"
                min={5}
                max={30}
                value={fps}
                onChange={(e) => setFps(+e.target.value)}
              />
            </div>
          </div>

          <Button onClick={exportGif} disabled={busy || !imgUrl || !preset} className="w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {busy ? "Rendering…" : "Download GIF"}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex min-h-64 w-full items-center justify-center overflow-auto rounded-md bg-muted/30 p-4">
            <div
              className="shrink-0 overflow-hidden border border-border bg-[#0d0f14]"
              style={{
                width: `${previewWidth}px`,
                height: `${previewHeight}px`,
              }}
            >
              <iframe
                ref={iframeRef}
                srcDoc={srcDoc}
                sandbox="allow-same-origin"
                className="h-full w-full border-0"
                title="gif-preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
   
  );
}
