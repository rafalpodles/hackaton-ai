-- Add hackathon event date to app_settings
alter table public.app_settings add column if not exists hackathon_date timestamptz;
