-- ============================================================
-- 020: Editable per-hackathon content
-- Adds rules_content JSONB and normalized FAQ/ideas/prompts tables.
-- ============================================================

ALTER TABLE public.hackathons ADD COLUMN rules_content jsonb;

CREATE TABLE public.hackathon_faq_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id  uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  slug          text NOT NULL,
  title         text NOT NULL,
  icon          text NOT NULL CHECK (icon <> ''),
  display_order int NOT NULL DEFAULT 0,
  UNIQUE (hackathon_id, slug)
);
CREATE INDEX idx_hackathon_faq_sections_hackathon_id ON public.hackathon_faq_sections(hackathon_id);

CREATE TABLE public.hackathon_faq_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    uuid NOT NULL REFERENCES public.hackathon_faq_sections(id) ON DELETE CASCADE,
  question      text NOT NULL,
  answer        text NOT NULL,
  display_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_hackathon_faq_items_section_id ON public.hackathon_faq_items(section_id);

CREATE TABLE public.hackathon_project_ideas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id  uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text NOT NULL,
  tags          text[] NOT NULL DEFAULT '{}',
  display_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_hackathon_project_ideas_hackathon_id ON public.hackathon_project_ideas(hackathon_id);

CREATE TABLE public.hackathon_prompts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id  uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  number        int NOT NULL,
  title         text NOT NULL,
  description   text NOT NULL,
  prompt        text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  UNIQUE (hackathon_id, number)
);
CREATE INDEX idx_hackathon_prompts_hackathon_id ON public.hackathon_prompts(hackathon_id);
