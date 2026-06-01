ALTER TABLE public.hackathons
  ADD COLUMN hidden_start_pages text[] NOT NULL DEFAULT '{}';
