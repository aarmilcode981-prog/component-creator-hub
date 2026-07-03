import { createFileRoute, Link } from "@tanstack/react-router";
import { Wand2, Blocks, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-mono text-sm tracking-tight">
            <span className="text-primary">$</span> snippet-lab
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/gif" className="text-muted-foreground hover:text-foreground">GIF Maker</Link>
            <Link to="/components" className="text-muted-foreground hover:text-foreground">Components</Link>
            {user ? (
              <Link to="/admin" className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
                <ShieldCheck className="size-3.5" /> Admin
              </Link>
            ) : (
              <Link to="/auth" className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">// personal toolkit</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            CSS effects,<br />
            <span className="text-muted-foreground">shipped as GIFs.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            Author reusable CSS animations and UI components once. Reuse them anywhere — as downloadable GIFs or copy-paste code.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <FeatureCard
            to="/gif"
            icon={<Wand2 className="size-5" />}
            title="GIF Maker"
            desc="Upload an image, pick a saved CSS preset, download it as an animated .gif."
          />
          <FeatureCard
            to="/components"
            icon={<Blocks className="size-5" />}
            title="Component Library"
            desc="Browse saved components. Toggle language, live preview, copy code."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group relative rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 text-primary p-2">{icon}</div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
      <ArrowRight className="absolute top-6 right-6 size-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}
