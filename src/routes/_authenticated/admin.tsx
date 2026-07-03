import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { LogOut, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { SandboxIframe, buildSrcDoc, type PreviewLang } from "@/components/preview-sandbox";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

type CssPreset = { id: string; name: string; css: string; keyframes: string };
type Component = {
  id: string;
  name: string;
  variants: {
    html_css?: { html?: string; css?: string };
    react_css?: { react?: string; css?: string };
    react_tailwind?: { react?: string };
  };
};

function AdminPage() {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-mono text-sm"><span className="text-primary">$</span> snippet-lab / admin</Link>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="size-4" />Sign out</Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="gifs">
          <TabsList>
            <TabsTrigger value="gifs">CSS Presets</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
          </TabsList>
          <TabsContent value="gifs" className="mt-6"><PresetManager /></TabsContent>
          <TabsContent value="components" className="mt-6"><ComponentManager /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------------- CSS Preset Manager ---------------- */

const DUMMY_IMG =
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=400&q=80";

function PresetManager() {
  const [items, setItems] = useState<CssPreset[]>([]);
  const [name, setName] = useState("");
  const [css, setCss] = useState("filter: hue-rotate(90deg) saturate(1.4);");
  const [keyframes, setKeyframes] = useState(
    "@keyframes fx {\n  0%   { transform: scale(1); filter: hue-rotate(0deg); }\n  50%  { transform: scale(1.05); filter: hue-rotate(180deg); }\n  100% { transform: scale(1); filter: hue-rotate(360deg); }\n}",
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error } = await supabase.from("css_presets").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setItems((data ?? []) as CssPreset[]);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!name.trim()) return toast.error("Name required");
    setSaving(true);
    const payload = { name: name.trim(), css, keyframes };
    const { error } = editing
      ? await supabase.from("css_presets").update(payload).eq("id", editing)
      : await supabase.from("css_presets").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setName(""); setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this preset?")) return;
    const { error } = await supabase.from("css_presets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  function edit(p: CssPreset) {
    setEditing(p.id); setName(p.name); setCss(p.css); setKeyframes(p.keyframes);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-medium">{editing ? "Edit preset" : "New preset"}</h2>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Neon Pulse" />
          </div>
          <div className="space-y-1.5">
            <Label>CSS (applied to the image)</Label>
            <Textarea className="font-mono text-xs min-h-32" value={css} onChange={(e) => setCss(e.target.value)} />
            <p className="text-xs text-muted-foreground">Use <code>animation: fx 2s infinite;</code> to reference your keyframes.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Keyframes (optional)</Label>
            <Textarea className="font-mono text-xs min-h-40" value={keyframes} onChange={(e) => setKeyframes(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {editing ? "Update" : "Save preset"}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={() => { setEditing(null); setName(""); }}>Cancel</Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-medium mb-3">Saved presets</h3>
          <div className="space-y-2">
            {items.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
            {items.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <button onClick={() => edit(p)} className="text-sm hover:text-primary">{p.name}</button>
                <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-medium mb-3">Live preview</h3>
        <PresetPreview css={css} keyframes={keyframes} imageUrl={DUMMY_IMG} />
      </div>
    </div>
  );
}

export function PresetPreview({
  css, keyframes, imageUrl,
}: { css: string; keyframes: string; imageUrl: string }) {
  const srcDoc = `<!doctype html><html><head><style>
html,body{margin:0;background:#0d0f14;display:flex;align-items:center;justify-content:center;height:100vh}
${keyframes}
.fx{max-width:80vw;max-height:80vh;${css}}
</style></head><body><img class="fx" src="${imageUrl}" crossorigin="anonymous" /></body></html>`;
  return (
    <div className="aspect-square w-full max-w-md mx-auto rounded-md overflow-hidden border border-border bg-[#0d0f14]">
      <SandboxIframe srcDoc={srcDoc} className="w-full h-full border-0" />
    </div>
  );
}

/* ---------------- Component Manager ---------------- */

function ComponentManager() {
  const [items, setItems] = useState<Component[]>([]);
  const [name, setName] = useState("");
  const [lang, setLang] = useState<PreviewLang>("html_css");
  const [html, setHtml] = useState("<button class=\"btn\">Click me</button>");
  const [css, setCss] = useState(".btn{padding:10px 20px;border-radius:8px;background:#4fd1c5;color:#0d0f14;border:0;cursor:pointer}");
  const [reactCode, setReactCode] = useState(
    "function App(){\n  return <button className=\"btn\" onClick={()=>alert('hi')}>Click me</button>;\n}",
  );
  const [tailwindCode, setTailwindCode] = useState(
    "function App(){\n  return <button className=\"px-5 py-2 rounded-lg bg-teal-400 text-slate-900 font-medium hover:bg-teal-300\">Click me</button>;\n}",
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error } = await supabase.from("components").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setItems((data ?? []) as Component[]);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!name.trim()) return toast.error("Name required");
    setSaving(true);
    const variants = {
      html_css: { html, css },
      react_css: { react: reactCode, css },
      react_tailwind: { react: tailwindCode },
    };
    const payload = { name: name.trim(), variants };
    const { error } = editing
      ? await supabase.from("components").update(payload).eq("id", editing)
      : await supabase.from("components").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    load();
  }

  function edit(c: Component) {
    setEditing(c.id); setName(c.name);
    setHtml(c.variants.html_css?.html ?? "");
    setCss(c.variants.html_css?.css ?? c.variants.react_css?.css ?? "");
    setReactCode(c.variants.react_css?.react ?? "");
    setTailwindCode(c.variants.react_tailwind?.react ?? "");
  }
  function reset() {
    setEditing(null); setName("");
  }
  async function remove(id: string) {
    if (!confirm("Delete this component?")) return;
    const { error } = await supabase.from("components").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  const variants = {
    html_css: { html, css },
    react_css: { react: reactCode, css },
    react_tailwind: { react: tailwindCode },
  };
  const srcDoc = buildSrcDoc(lang, variants);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-medium">{editing ? "Edit component" : "New component"}</h2>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Header" />
            </div>
            <div className="space-y-1.5">
              <Label>Preview language</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as PreviewLang)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="html_css">HTML / CSS</SelectItem>
                  <SelectItem value="react_css">React / CSS</SelectItem>
                  <SelectItem value="react_tailwind">React / Tailwind</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {lang === "html_css" && (
            <>
              <CodeArea label="HTML" value={html} onChange={setHtml} />
              <CodeArea label="CSS" value={css} onChange={setCss} />
            </>
          )}
          {lang === "react_css" && (
            <>
              <CodeArea label="React (must define App)" value={reactCode} onChange={setReactCode} />
              <CodeArea label="CSS" value={css} onChange={setCss} />
            </>
          )}
          {lang === "react_tailwind" && (
            <CodeArea label="React + Tailwind (must define App)" value={tailwindCode} onChange={setTailwindCode} />
          )}

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {editing ? "Update" : "Save component"}
            </Button>
            {editing && <Button variant="ghost" onClick={reset}>Cancel</Button>}
          </div>
          <p className="text-xs text-muted-foreground">
            Saving stores all 3 language variants — fill in the ones you want the client to use.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-medium mb-3">Saved components</h3>
          <div className="space-y-2">
            {items.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
            {items.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <button onClick={() => edit(c)} className="text-sm hover:text-primary">{c.name}</button>
                <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-medium mb-3">Preview <span className="text-xs text-muted-foreground">({lang})</span></h3>
        <div className="aspect-video w-full rounded-md overflow-hidden border border-border">
          <SandboxIframe srcDoc={srcDoc} className="w-full h-full border-0" />
        </div>
      </div>
    </div>
  );
}

function CodeArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea className="font-mono text-xs min-h-40" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}