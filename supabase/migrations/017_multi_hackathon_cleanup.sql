-- Drop per-hackathon columns from profiles (now in hackathon_participants)
-- CASCADE drops dependent storage policies
ALTER TABLE public.profiles DROP COLUMN IF EXISTS project_id CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS team_id CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_solo;

-- Drop app_settings (replaced by hackathons table)
DROP TABLE IF EXISTS public.app_settings;
