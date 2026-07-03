
CREATE TABLE public.css_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  css TEXT NOT NULL DEFAULT '',
  keyframes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.css_presets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.css_presets TO authenticated;
GRANT ALL ON public.css_presets TO service_role;
ALTER TABLE public.css_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read css_presets" ON public.css_presets FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert css_presets" ON public.css_presets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update css_presets" ON public.css_presets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete css_presets" ON public.css_presets FOR DELETE TO authenticated USING (true);

CREATE TABLE public.components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  variants JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.components TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.components TO authenticated;
GRANT ALL ON public.components TO service_role;
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read components" ON public.components FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert components" ON public.components FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update components" ON public.components FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete components" ON public.components FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_css_presets_updated BEFORE UPDATE ON public.css_presets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_components_updated BEFORE UPDATE ON public.components
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
