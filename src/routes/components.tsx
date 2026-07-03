import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Copy, Search } from "lucide-react";
import { SandboxIframe, buildSrcDoc, type PreviewLang } from "@/components/preview-sandbox";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/components")({
  component: ComponentsClient,
});

type Component = {
  id: string;
  name: string;
  variants: {
    html_css?: { html?: string; css?: string };
    react_css?: { react?: string; css?: string };
    react_tailwind?: { react?: string };
  };
};

const LANG_LABELS: Record<PreviewLang, string> = {
  html_css: "HTML / CSS",
  react_css: "React / CSS",
  react_tailwind: "React / Tailwind",
};

function ComponentsClient() {
  const [items, setItems] = useState<Component[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lang, setLang] = useState<PreviewLang>("html_css");
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.from("components").select("*").order("name").then(({ data, error }) => {
      if (error) return toast.error(error.message);
      const list = (data ?? []) as Component[];
      setItems(list);
      if (list[0]) setSelectedId(list[0].id);
    });
  }, []);

  const selected = items.find((c) => c.id === selectedId);
  const filtered = useMemo(
    () => items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  const codeText = useMemo(() => {
    if (!selected) return "";
    const v = selected.variants;
    if (lang === "html_css") {
      return `<!-- HTML -->\n${v.html_css?.html ?? ""}\n\n/* CSS */\n${v.html_css?.css ?? ""}`;
    }
    if (lang === "react_css") {
      return `// React\n${v.react_css?.react ?? ""}\n\n/* CSS */\n${v.react_css?.css ?? ""}`;
    }
    return `// React + Tailwind\n${v.react_tailwind?.react ?? ""}`;
  }, [selected, lang]);

  const srcDoc = selected ? buildSrcDoc(lang, selected.variants) : "";

  async function copy() {
    await navigator.clipboard.writeText(codeText);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-mono text-sm"><span className="text-primary">$</span> snippet-lab / components</Link>
          <Link to="/gif" className="text-sm text-muted-foreground hover:text-foreground">GIF Maker →</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl h-[calc(100vh-3.5rem)] grid grid-cols-[260px_1fr]">
        <aside className="border-r border-border bg-sidebar overflow-y-auto">
          <div className="p-4 sticky top-0 bg-sidebar border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <nav className="p-2">
            {filtered.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No components yet.</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                  selectedId === c.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </nav>
        </aside>

        <main className="overflow-y-auto p-6 space-y-4">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Select a component to preview.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h1 className="text-xl font-semibold">{selected.name}</h1>
                <Select value={lang} onValueChange={(v) => setLang(v as PreviewLang)}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(LANG_LABELS) as PreviewLang[]).map((k) => (
                      <SelectItem key={k} value={k}>{LANG_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative rounded-xl border border-border bg-card overflow-hidden">
                <div className="aspect-video w-full bg-[#0d0f14]">
                  <SandboxIframe srcDoc={srcDoc} className="w-full h-full border-0" />
                </div>
                <button
                  onClick={copy}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-background/80 backdrop-blur border border-border px-2.5 py-1.5 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy code"}
                </button>
              </div>

              <pre className="rounded-xl border border-border bg-card p-4 text-xs font-mono overflow-auto max-h-[420px] whitespace-pre-wrap">
                <code>{codeText || "// no code for this language"}</code>
              </pre>
            </>
          )}
        </main>
      </div>
    </div>
  );
}