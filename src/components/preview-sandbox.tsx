export type PreviewLang = "html_css" | "react_css" | "react_tailwind";

type Variants = {
  html_css?: { html?: string; css?: string };
  react_css?: { react?: string; css?: string };
  react_tailwind?: { react?: string };
};

/** Builds the srcDoc for a sandboxed iframe preview of a component. */
// eslint-disable-next-line react-refresh/only-export-components
export function buildSrcDoc(lang: PreviewLang, variants: Variants): string {
  const base = `<!doctype html><html><head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:16px;background:#0d0f14;color:#e6e7ea;font-family:system-ui,sans-serif}</style>`;

  if (lang === "html_css") {
    const v = variants.html_css ?? {};
    return `${base}<style>${v.css ?? ""}</style></head><body>${v.html ?? ""}</body></html>`;
  }
  if (lang === "react_css") {
    const v = variants.react_css ?? {};
    return reactDoc(v.react ?? "", v.css ?? "", false);
  }
  const v = variants.react_tailwind ?? {};
  return reactDoc(v.react ?? "", "", true);
}

function reactDoc(reactCode: string, css: string, tailwind: boolean) {
  const twScript = tailwind ? `<script src="https://cdn.tailwindcss.com"></script>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"/>
${twScript}
<style>html,body{margin:0;padding:16px;background:${tailwind ? "#0d0f14" : "#0d0f14"};color:#e6e7ea;font-family:system-ui,sans-serif}${css}</style>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head><body><div id="root"></div>
<script type="text/babel" data-presets="react">
try {
  ${reactCode}
  const RootEl =
    typeof App !== "undefined" ? App :
    typeof Component !== "undefined" ? Component :
    typeof Default !== "undefined" ? Default :
    (() => React.createElement("pre", {style:{color:"#f88"}}, "Export a component named App"));
  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(RootEl));
} catch (e) {
  document.getElementById("root").innerHTML =
    '<pre style="color:#f88;white-space:pre-wrap">'+ String(e && e.stack || e) +'</pre>';
}
</script></body></html>`;
}

export function SandboxIframe({ srcDoc, className }: { srcDoc: string; className?: string }) {
  return (
    <iframe
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className={className ?? "w-full h-full border-0 bg-[#0d0f14] rounded-md"}
      title="preview"
    />
  );
}
