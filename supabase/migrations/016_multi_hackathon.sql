-- ===========================================
-- 016: Multi-hackathon support
-- Adds hackathons as a top-level entity.
-- Migrates existing single-hackathon data.
-- ===========================================

-- ===========================================
-- 1. CREATE hackathons TABLE
-- ===========================================

CREATE TABLE public.hackathons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  hackathon_date timestamptz,
  submission_deadline timestamptz,
  submission_open boolean DEFAULT false,
  voting_open boolean DEFAULT false,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'voting', 'finished')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.hackathons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================
-- 2. CREATE hackathon_categories TABLE
-- ===========================================

CREATE TABLE public.hackathon_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  slug text NOT NULL,
  label text NOT NULL,
  display_order int DEFAULT 0,
  UNIQUE(hackathon_id, slug)
);

-- ===========================================
-- 3. CREATE hackathon_participants TABLE
-- ===========================================

CREATE TABLE public.hackathon_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'participant' CHECK (role IN ('participant', 'admin')),
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  is_solo boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(hackathon_id, user_id)
);

CREATE INDEX idx_hackathon_participants_user_id ON public.hackathon_participants(user_id);
CREATE INDEX idx_hackathon_participants_hackathon_id ON public.hackathon_participants(hackathon_id);

-- ===========================================
-- 4. CREATE registration_attempts TABLE
-- ===========================================

CREATE TABLE public.registration_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_registration_attempts_ip_created ON public.registration_attempts(ip_address, created_at);

-- ===========================================
-- 5. ADD hackathon_id TO projects, teams, votes
-- ===========================================

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS hackathon_id uuid REFERENCES public.hackathons(id) ON DELETE SET NULL;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS hackathon_id uuid REFERENCES public.hackathons(id) ON DELETE SET NULL;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS hackathon_id uuid REFERENCES public.hackathons(id) ON DELETE SET NULL;

-- ===========================================
-- 6. MIGRATE EXISTING DATA
-- ===========================================

-- 6a. Create hackathon #1 from existing app_settings data
INSERT INTO public.hackathons (
  name,
  slug,
  description,
  hackathon_date,
  submission_deadline,
  submission_open,
  voting_open,
  status
)
SELECT
  'AI Hackathon #1',
  'ai-hackathon-1',
  '',
  hackathon_date,
  submission_deadline,
  COALESCE(submission_open, false),
  COALESCE(voting_open, false),
  'finished'
FROM public.app_settings
WHERE id = 1;

-- Fallback: if app_settings is empty, insert with defaults
INSERT INTO public.hackathons (name, slug, description, status)
SELECT 'AI Hackathon #1', 'ai-hackathon-1', '', 'finished'
WHERE NOT EXISTS (SELECT 1 FROM public.hackathons WHERE slug = 'ai-hackathon-1');

-- 6b. Create 3 hackathon_categories for hackathon #1
INSERT INTO public.hackathon_categories (hackathon_id, slug, label, display_order)
SELECT
  h.id,
  cat.slug,
  cat.label,
  cat.display_order
FROM public.hackathons h,
  (VALUES
    ('concept_to_reality', 'Concept to Reality', 1),
    ('creativity',         'Creativity',         2),
    ('usefulness',         'Usefulness',         3)
  ) AS cat(slug, label, display_order)
WHERE h.slug = 'ai-hackathon-1';

-- 6c. Set hackathon_id on all existing projects
UPDATE public.projects
SET hackathon_id = (SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1')
WHERE hackathon_id IS NULL;

-- 6d. Set hackathon_id on all existing teams
UPDATE public.teams
SET hackathon_id = (SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1')
WHERE hackathon_id IS NULL;

-- 6e. Set hackathon_id on all existing votes
UPDATE public.votes
SET hackathon_id = (SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1')
WHERE hackathon_id IS NULL;

-- 6f. Create hackathon_participants from profiles that have team_id, project_id, or is_solo=true
INSERT INTO public.hackathon_participants (hackathon_id, user_id, role, team_id, project_id, is_solo)
SELECT
  (SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1'),
  p.id,
  p.role,
  p.team_id,
  p.project_id,
  p.is_solo
FROM public.profiles p
WHERE p.team_id IS NOT NULL
   OR p.project_id IS NOT NULL
   OR p.is_solo = true
ON CONFLICT (hackathon_id, user_id) DO NOTHING;

-- ===========================================
-- 7. MAKE hackathon_id NOT NULL AFTER BACKFILL
-- ===========================================

ALTER TABLE public.projects ALTER COLUMN hackathon_id SET NOT NULL;
ALTER TABLE public.teams ALTER COLUMN hackathon_id SET NOT NULL;
ALTER TABLE public.votes ALTER COLUMN hackathon_id SET NOT NULL;

-- ===========================================
-- 8. UPDATE votes UNIQUE CONSTRAINT
-- ===========================================

-- Drop old unique constraint (voter_id, category)
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_voter_id_category_key;

-- Add new unique constraint (voter_id, hackathon_id, category)
ALTER TABLE public.votes ADD CONSTRAINT votes_voter_id_hackathon_id_category_key
  UNIQUE (voter_id, hackathon_id, category);

-- ===========================================
-- 9. REMOVE CHECK CONSTRAINT ON votes.category
-- ===========================================

-- Drop existing category check constraint (may have been re-added in migration 012)
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_category_check;

-- ===========================================
-- 10. ADD INDEXES ON hackathon_id COLUMNS
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_projects_hackathon_id ON public.projects(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_teams_hackathon_id ON public.teams(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_votes_hackathon_id ON public.votes(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_categories_hackathon_id ON public.hackathon_categories(hackathon_id);
