-- Add optional app_url field to projects for linking to deployed application
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS app_url text;
