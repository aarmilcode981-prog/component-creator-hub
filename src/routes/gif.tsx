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
    try {
      // dynamic imports (browser-only)
      const html2canvas = (await import("html2canvas")).default;
      const GIF = (await import("gif.js")).default;

      const iframe = iframeRef.current;
      if (!iframe?.contentDocument) throw new Error("Preview not ready");
      const target = iframe.contentDocument.querySelector<HTMLElement>(".fx");
      if (!target) throw new Error("Image not found in preview");

      const rect = target.getBoundingClientRect();
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

      for (let i = 0; i < frameCount; i++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delay));
        // eslint-disable-next-line no-await-in-loop
        const canvas = await html2canvas(target, {
          backgroundColor: "#0d0f14",
          useCORS: true,
          logging: false,
          width: w,
          height: h,
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
        setBusy(false);
        toast.success("GIF downloaded");
      });
      gif.render();
    } catch (err) {
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