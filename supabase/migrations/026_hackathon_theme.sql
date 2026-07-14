-- Per-hackathon visual theme preset: 'garage' (default Garage OS) or 'poster' (light poster skin)
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'garage';
ALTER TABLE public.hackathons DROP CONSTRAINT IF EXISTS hackathons_theme_check;
ALTER TABLE public.hackathons ADD CONSTRAINT hackathons_theme_check
  CHECK (theme IN ('garage', 'poster'));
