-- ============================================================
-- 024: Per-hackathon custom guide steps + guide-images bucket
-- ============================================================

CREATE TABLE public.hackathon_guide_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id  uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  category      text NOT NULL CHECK (category IN ('fundamenty', 'ai-tools', 'weryfikacja')),
  order_index   integer NOT NULL DEFAULT 0,
  title         text NOT NULL,
  content_md    text NOT NULL DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_hackathon_guide_steps_hackathon_id
  ON public.hackathon_guide_steps(hackathon_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('guide-images', 'guide-images', true)
ON CONFLICT (id) DO NOTHING;
