-- Relax projects.description length limit (280 -> 5000) to match the submission form
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_description_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_description_check
  CHECK (char_length(description) <= 5000);
