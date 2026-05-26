ALTER TABLE public.hackathons
  ADD COLUMN api_key_default_limit_usd numeric NOT NULL DEFAULT 5
  CHECK (api_key_default_limit_usd > 0);
