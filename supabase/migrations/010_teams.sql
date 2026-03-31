-- ===========================================
-- 010: Teams & team requests
-- Separate teams from projects. Teams own projects.
-- ===========================================

-- Teams table
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  leader_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.teams disable row level security;

create trigger set_updated_at before update on public.teams
  for each row execute function public.handle_updated_at();

-- Team join requests
create table public.team_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, team_id)
);

alter table public.team_requests disable row level security;

-- Add team_id and is_solo to profiles
alter table public.profiles add column if not exists team_id uuid references public.teams(id) on delete set null;
alter table public.profiles add column if not exists is_solo boolean not null default false;

-- Indexes
create index if not exists idx_profiles_team_id on public.profiles(team_id);
create index if not exists idx_teams_leader_id on public.teams(leader_id);
create index if not exists idx_team_requests_user_id on public.team_requests(user_id);
create index if not exists idx_team_requests_team_id on public.team_requests(team_id);
