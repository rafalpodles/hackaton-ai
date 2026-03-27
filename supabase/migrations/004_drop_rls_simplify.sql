-- ===========================================
-- 004: Drop RLS, simplify permissions model
-- All authorization handled in server actions via service_role key
-- ===========================================

-- =========== DROP ALL RLS POLICIES ===========

-- profiles
drop policy if exists "Anyone can read profiles" on public.profiles;
drop policy if exists "User can update own profile" on public.profiles;

-- projects
drop policy if exists "Anyone can read submitted projects" on public.projects;
drop policy if exists "Anyone can create a project" on public.projects;
drop policy if exists "Team members can update unsubmitted project" on public.projects;
drop policy if exists "Admin can delete projects" on public.projects;

-- votes
drop policy if exists "Participants can vote during voting phase" on public.votes;
drop policy if exists "Users can read own votes" on public.votes;
drop policy if exists "Everyone can read votes in results phase" on public.votes;

-- app_settings policies (table may not exist after migration 003)
do $$ begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'app_settings') then
    drop policy if exists "Anyone can read app_settings" on public.app_settings;
    drop policy if exists "Admin can update app_settings" on public.app_settings;
  end if;
end $$;

-- storage
drop policy if exists "Authenticated users can read videos" on storage.objects;
drop policy if exists "Team members can upload videos" on storage.objects;
drop policy if exists "Authenticated users can read presentations" on storage.objects;
drop policy if exists "Team members can upload presentations" on storage.objects;
drop policy if exists "Authenticated users can read thumbnails" on storage.objects;
drop policy if exists "Team members can upload thumbnails" on storage.objects;

-- =========== DISABLE RLS ===========

alter table public.profiles disable row level security;
alter table public.projects disable row level security;
alter table public.votes disable row level security;

-- =========== DROP RPC ===========

drop function if exists get_vote_results();

-- =========== RECREATE APP_SETTINGS ===========
-- Two phases: 'submission' (default) and 'voting' (admin enables)
-- Results are always admin-only, no phase needed

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  voting_open boolean not null default false,
  updated_at timestamptz default now()
);

-- Only insert if table was dropped by migration 003
insert into public.app_settings (id, voting_open)
values (1, false)
on conflict (id) do nothing;

-- If table existed from migration 001 with old schema, migrate it
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'app_settings' and column_name = 'current_phase'
  ) then
    alter table public.app_settings drop column current_phase;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'app_settings' and column_name = 'voting_open'
  ) then
    alter table public.app_settings add column voting_open boolean not null default false;
  end if;
end $$;

alter table public.app_settings disable row level security;

-- Ensure updated_at trigger exists for app_settings
drop trigger if exists set_updated_at on public.app_settings;
create trigger set_updated_at before update on public.app_settings
  for each row execute function public.handle_updated_at();

-- =========== ADD MISSING INDEXES ===========

create index if not exists idx_profiles_project_id on public.profiles(project_id);
create index if not exists idx_votes_voter_id on public.votes(voter_id);
create index if not exists idx_votes_project_id on public.votes(project_id);
create index if not exists idx_votes_category on public.votes(category);

-- =========== MAKE STORAGE BUCKETS PUBLIC ===========
-- Files served through the app (auth checked in server actions)

update storage.buckets set public = true where id in ('videos', 'presentations', 'thumbnails');
