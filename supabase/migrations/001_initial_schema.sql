-- ===========================================
-- TABLES
-- ===========================================

create table public.app_settings (
  id int primary key default 1,
  current_phase text not null default 'submission'
    check (current_phase in ('submission', 'browsing', 'voting', 'results')),
  updated_at timestamptz default now()
);

insert into public.app_settings (id, current_phase) values (1, 'submission');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null check (char_length(description) <= 280),
  idea_origin text not null default '',
  journey text not null default '',
  tech_stack text[] default '{}',
  video_url text,
  video_duration int check (video_duration is null or video_duration <= 60),
  pdf_url text,
  thumbnail_url text,
  is_submitted boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  project_id uuid references public.projects(id) on delete set null,
  role text not null default 'participant'
    check (role in ('participant', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null
    check (category in ('best_overall', 'best_demo_ux', 'most_creative')),
  created_at timestamptz default now(),
  unique(voter_id, category)
);

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- UPDATED_AT TRIGGER
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.app_settings
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.votes enable row level security;

create policy "Anyone can read app_settings" on public.app_settings for select using (true);
create policy "Admin can update app_settings" on public.app_settings for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Anyone can read profiles" on public.profiles for select using (true);
create policy "User can update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Anyone can read submitted projects" on public.projects for select using (
  is_submitted = true
  or exists (select 1 from public.profiles where id = auth.uid() and project_id = projects.id)
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Anyone can create a project" on public.projects for insert with check (auth.uid() is not null);
create policy "Team members can update unsubmitted project" on public.projects for update using (
  (is_submitted = false and exists (select 1 from public.profiles where id = auth.uid() and project_id = projects.id))
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin can delete projects" on public.projects for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Participants can vote during voting phase" on public.votes for insert with check (
  auth.uid() = voter_id
  and exists (select 1 from public.app_settings where current_phase = 'voting')
  and not exists (select 1 from public.profiles where id = auth.uid() and project_id = votes.project_id)
);
create policy "Users can read own votes" on public.votes for select using (voter_id = auth.uid());
create policy "Everyone can read votes in results phase" on public.votes for select using (
  exists (select 1 from public.app_settings where current_phase = 'results')
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('videos', 'videos', false);
insert into storage.buckets (id, name, public) values ('presentations', 'presentations', false);
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', false);

create policy "Authenticated users can read videos" on storage.objects for select using (bucket_id = 'videos' and auth.uid() is not null);
create policy "Team members can upload videos" on storage.objects for insert with check (
  bucket_id = 'videos' and auth.uid() is not null
  and exists (
    select 1 from public.profiles p join public.projects proj on p.project_id = proj.id
    where p.id = auth.uid() and proj.is_submitted = false and (storage.foldername(name))[1] = proj.id::text
  )
);
create policy "Authenticated users can read presentations" on storage.objects for select using (bucket_id = 'presentations' and auth.uid() is not null);
create policy "Team members can upload presentations" on storage.objects for insert with check (
  bucket_id = 'presentations' and auth.uid() is not null
  and exists (
    select 1 from public.profiles p join public.projects proj on p.project_id = proj.id
    where p.id = auth.uid() and proj.is_submitted = false and (storage.foldername(name))[1] = proj.id::text
  )
);
create policy "Authenticated users can read thumbnails" on storage.objects for select using (bucket_id = 'thumbnails' and auth.uid() is not null);
create policy "Team members can upload thumbnails" on storage.objects for insert with check (
  bucket_id = 'thumbnails' and auth.uid() is not null
  and exists (
    select 1 from public.profiles p join public.projects proj on p.project_id = proj.id
    where p.id = auth.uid() and proj.is_submitted = false and (storage.foldername(name))[1] = proj.id::text
  )
);
