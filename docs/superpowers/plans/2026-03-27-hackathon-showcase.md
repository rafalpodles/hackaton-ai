# Spyrosoft AI Hackathon Showcase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app where hackathon participants submit 60s screen recordings, browse projects in a TikTok-style feed, and vote in 3 categories.

**Architecture:** Next.js 15 App Router with Supabase for auth (magic links), storage (videos/PDFs), and Postgres. Left sidebar layout with dark "Neon-Glass" theme. Server Actions for mutations, client-side direct uploads to Supabase Storage.

**Tech Stack:** Next.js 15, React 19, Supabase (@supabase/ssr + @supabase/supabase-js), Tailwind CSS 4, TypeScript, exceljs

**Design reference:** `designs/neon_syndicate/DESIGN.md` + mockups in `designs/desktop_*/`

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    → Root layout (fonts, theme, metadata)
│   ├── (auth)/
│   │   ├── login/page.tsx            → Magic link login form
│   │   └── auth/
│   │       ├── callback/route.ts     → Exchange code for session
│   │       └── confirm/page.tsx      → "Check your email" screen
│   ├── (main)/
│   │   ├── layout.tsx                → Sidebar layout (AppShell)
│   │   ├── page.tsx                  → Landing page (project grid)
│   │   ├── feed/page.tsx             → TikTok-style video feed
│   │   ├── vote/page.tsx             → Voting screen
│   │   ├── results/page.tsx          → Leaderboard
│   │   ├── my-project/page.tsx       → Submission form / preview
│   │   └── onboarding/page.tsx       → Create or join project
│   └── (admin)/
│       ├── layout.tsx                → Admin layout (extends sidebar)
│       ├── admin/page.tsx            → Dashboard + phase switcher
│       └── admin/results/page.tsx    → Results + Excel export
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx               → Left sidebar nav
│   │   └── phase-gate.tsx            → Renders children only in correct phase
│   ├── projects/
│   │   ├── project-grid.tsx          → Responsive card grid
│   │   ├── project-card.tsx          → Single project tile
│   │   └── project-detail-modal.tsx  → Full project info modal
│   ├── feed/
│   │   ├── video-feed.tsx            → Scroll-snap container
│   │   └── video-feed-item.tsx       → Single video + info overlay
│   ├── voting/
│   │   ├── voting-board.tsx          → 3 category columns
│   │   ├── voting-category.tsx       → Single category with selectable tiles
│   │   └── vote-submit-bar.tsx       → Sticky bottom submit
│   ├── submission/
│   │   ├── submission-stepper.tsx    → Gradient bar stepper
│   │   ├── submission-form.tsx       → Questions + uploads
│   │   ├── file-upload-zone.tsx      → Drag & drop upload
│   │   └── join-project-list.tsx     → List of projects to join
│   ├── admin/
│   │   ├── stats-cards.tsx           → Dashboard stat cards
│   │   ├── phase-switcher.tsx        → Phase pill buttons
│   │   ├── projects-table.tsx        → Admin project table
│   │   └── results-leaderboard.tsx   → Category rankings
│   └── ui/
│       ├── video-player.tsx          → HTML5 video wrapper
│       ├── confirm-dialog.tsx        → Reusable confirm modal
│       ├── gradient-button.tsx       → Neon gradient CTA button
│       └── glass-card.tsx            → Glassmorphism card wrapper
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 → Browser client (createBrowserClient)
│   │   ├── server.ts                 → Server client (createServerClient)
│   │   └── middleware.ts             → Session refresh logic
│   ├── actions/
│   │   ├── auth.ts                   → sendMagicLink, signOut
│   │   ├── projects.ts              → createProject, joinProject, updateProject, submitProject
│   │   ├── voting.ts                → castVotes, getResults
│   │   └── admin.ts                 → setPhase, deleteProject, editProject, exportResults
│   ├── types.ts                      → TypeScript types (Profile, Project, Vote, Phase)
│   └── utils.ts                      → Shared utilities
├── middleware.ts                      → Next.js middleware (auth + routing)
supabase/
├── migrations/
│   └── 001_initial_schema.sql        → Tables, RLS, storage buckets
├── seed.sql                          → Admin user + test data
└── config.toml                       → Supabase local dev config
scripts/
└── invite-users.ts                   → Batch magic link sender
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local.example`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/rpo/Documents/Projects/ai-hackaton
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr exceljs
npm install -D supabase
```

- [ ] **Step 3: Create .env.local.example**

Create `.env.local.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

- [ ] **Step 4: Add Google Fonts (Space Grotesk + Manrope) to root layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Spyrosoft AI Hackathon",
  description: "Showcase and vote on hackathon projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${manrope.variable} font-manrope bg-[#0e0e13] text-[#f8f5fd] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Set up Tailwind theme with Neon-Glass design tokens**

Replace `src/app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-surface: #0e0e13;
  --color-surface-low: #131318;
  --color-surface-high: #1f1f26;
  --color-surface-bright: #2c2b33;
  --color-primary: #4646CC;
  --color-primary-dim: #a4a5ff;
  --color-secondary: #FF4D29;
  --color-secondary-dim: #ff7255;
  --color-on-surface: #f8f5fd;
  --color-on-surface-muted: #9896a3;
  --color-outline: rgba(166, 165, 255, 0.15);

  --font-space-grotesk: var(--font-space-grotesk);
  --font-manrope: var(--font-manrope);
}

body {
  font-family: var(--font-manrope), sans-serif;
}

h1, h2, h3, h4, h5, h6, .font-display {
  font-family: var(--font-space-grotesk), sans-serif;
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts at localhost:3000, dark background visible.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and Neon-Glass theme"
```

---

## Task 2: Supabase Setup & Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`, `supabase/seed.sql`, `src/lib/types.ts`

- [ ] **Step 1: Initialize Supabase locally**

```bash
npx supabase init
```

- [ ] **Step 2: Create migration file with full schema**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- ===========================================
-- TABLES
-- ===========================================

create table public.app_settings (
  id int primary key default 1,
  current_phase text not null default 'submission'
    check (current_phase in ('submission', 'browsing', 'voting', 'results')),
  updated_at timestamptz default now()
);

-- Singleton: only one row
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

-- ===========================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ===========================================

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

-- ===========================================
-- UPDATED_AT TRIGGER
-- ===========================================

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

-- ===========================================
-- RLS POLICIES
-- ===========================================

alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.votes enable row level security;

-- app_settings: everyone reads, only admin updates
create policy "Anyone can read app_settings"
  on public.app_settings for select using (true);

create policy "Admin can update app_settings"
  on public.app_settings for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- profiles: everyone reads, user updates own
create policy "Anyone can read profiles"
  on public.profiles for select using (true);

create policy "User can update own profile"
  on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid());

-- projects: everyone reads submitted, team edits unsubmitted, anyone creates
create policy "Anyone can read submitted projects"
  on public.projects for select using (
    is_submitted = true
    or exists (select 1 from public.profiles where id = auth.uid() and project_id = projects.id)
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Anyone can create a project"
  on public.projects for insert with check (auth.uid() is not null);

create policy "Team members can update unsubmitted project"
  on public.projects for update using (
    (
      is_submitted = false
      and exists (select 1 from public.profiles where id = auth.uid() and project_id = projects.id)
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin can delete projects"
  on public.projects for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- votes: insert during voting phase only, not own project
create policy "Participants can vote during voting phase"
  on public.votes for insert with check (
    auth.uid() = voter_id
    and exists (select 1 from public.app_settings where current_phase = 'voting')
    and not exists (
      select 1 from public.profiles
      where id = auth.uid() and project_id = votes.project_id
    )
  );

create policy "Users can read own votes"
  on public.votes for select using (voter_id = auth.uid());

create policy "Everyone can read votes in results phase"
  on public.votes for select using (
    exists (select 1 from public.app_settings where current_phase = 'results')
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ===========================================
-- STORAGE BUCKETS
-- ===========================================

insert into storage.buckets (id, name, public) values ('videos', 'videos', false);
insert into storage.buckets (id, name, public) values ('presentations', 'presentations', false);
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', false);

-- Storage policies: authenticated users can read, team members upload to their project folder
create policy "Authenticated users can read videos"
  on storage.objects for select using (
    bucket_id = 'videos' and auth.uid() is not null
  );

create policy "Team members can upload videos"
  on storage.objects for insert with check (
    bucket_id = 'videos'
    and auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      join public.projects proj on p.project_id = proj.id
      where p.id = auth.uid()
        and proj.is_submitted = false
        and (storage.foldername(name))[1] = proj.id::text
    )
  );

create policy "Authenticated users can read presentations"
  on storage.objects for select using (
    bucket_id = 'presentations' and auth.uid() is not null
  );

create policy "Team members can upload presentations"
  on storage.objects for insert with check (
    bucket_id = 'presentations'
    and auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      join public.projects proj on p.project_id = proj.id
      where p.id = auth.uid()
        and proj.is_submitted = false
        and (storage.foldername(name))[1] = proj.id::text
    )
  );

create policy "Authenticated users can read thumbnails"
  on storage.objects for select using (
    bucket_id = 'thumbnails' and auth.uid() is not null
  );

create policy "Team members can upload thumbnails"
  on storage.objects for insert with check (
    bucket_id = 'thumbnails'
    and auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      join public.projects proj on p.project_id = proj.id
      where p.id = auth.uid()
        and proj.is_submitted = false
        and (storage.foldername(name))[1] = proj.id::text
    )
  );
```

- [ ] **Step 3: Create TypeScript types**

Create `src/lib/types.ts`:
```ts
export type Phase = "submission" | "browsing" | "voting" | "results";

export type Role = "participant" | "admin";

export type VoteCategory = "best_overall" | "best_demo_ux" | "most_creative";

export interface AppSettings {
  id: number;
  current_phase: Phase;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  project_id: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  idea_origin: string;
  journey: string;
  tech_stack: string[];
  video_url: string | null;
  video_duration: number | null;
  pdf_url: string | null;
  thumbnail_url: string | null;
  is_submitted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithTeam extends Project {
  team: Pick<Profile, "id" | "display_name" | "avatar_url">[];
}

export interface Vote {
  id: string;
  voter_id: string;
  project_id: string;
  category: VoteCategory;
  created_at: string;
}

export interface VoteResult {
  project_id: string;
  project_name: string;
  team_members: string[];
  category: VoteCategory;
  vote_count: number;
}
```

- [ ] **Step 4: Create seed data**

Create `supabase/seed.sql`:
```sql
-- This runs after migrations. Admin user must be created via Supabase dashboard or invite script.
-- This seed creates test projects for local development.

-- Note: In production, profiles are auto-created by the on_auth_user_created trigger.
-- For local dev, create test users via Supabase dashboard and they'll get profiles automatically.
```

- [ ] **Step 5: Commit**

```bash
git add supabase/ src/lib/types.ts
git commit -m "feat: add Supabase schema, RLS policies, storage buckets, and TypeScript types"
```

---

## Task 3: Supabase Client Utilities

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`

- [ ] **Step 1: Create browser client**

Create `src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server client**

Create `src/lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components — middleware will refresh
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create middleware session helper**

Create `src/lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require auth
  const publicPaths = ["/login", "/auth/callback", "/auth/confirm"];
  const isPublicPath = publicPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If logged in, check if user has a project (skip for onboarding + admin)
  if (user && !isPublicPath) {
    const skipOnboardingCheck = ["/onboarding", "/admin"].some((p) =>
      request.nextUrl.pathname.startsWith(p)
    );

    if (!skipOnboardingCheck) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("project_id, role")
        .eq("id", user.id)
        .single();

      // Redirect to onboarding if no project (unless admin)
      if (profile && !profile.project_id && profile.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }
  }

  // Logged in user trying to access login → redirect home
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 4: Create Next.js middleware**

Create `src/middleware.ts`:
```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts
git commit -m "feat: add Supabase client utilities and auth middleware"
```

---

## Task 4: Auth Pages (Login + Callback + Confirm)

**Files:**
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/auth/callback/route.ts`, `src/app/(auth)/auth/confirm/page.tsx`, `src/components/ui/gradient-button.tsx`, `src/components/ui/glass-card.tsx`

- [ ] **Step 1: Create shared UI components**

Create `src/components/ui/gradient-button.tsx`:
```tsx
import { ButtonHTMLAttributes } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
}

export function GradientButton({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: GradientButtonProps) {
  const base = "font-space-grotesk font-bold text-sm tracking-wide uppercase transition-all duration-200 rounded-md px-6 py-3 cursor-pointer";
  const width = fullWidth ? "w-full" : "";
  const variants = {
    primary: `bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_0_20px_rgba(70,70,204,0.4)] disabled:opacity-50 disabled:cursor-not-allowed`,
    ghost: `bg-transparent border border-outline text-primary-dim hover:border-primary-dim`,
  };

  return (
    <button
      className={`${base} ${width} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

Create `src/components/ui/glass-card.tsx`:
```tsx
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`bg-surface-high/40 backdrop-blur-[20px] border border-outline rounded-xl p-8 ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create login page**

Create `src/app/(auth)/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(`/auth/confirm?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      <GlassCard className="relative z-10 w-full max-w-md text-center">
        <div className="text-4xl mb-4">⚡</div>
        <h1 className="font-space-grotesk text-2xl font-bold mb-1">
          <span className="text-primary-dim">SPYROSOFT AI</span>{" "}
          <span className="text-secondary">HACKATHON</span>
        </h1>
        <h2 className="font-space-grotesk text-3xl font-bold mt-4 mb-2">
          Welcome, hacker!
        </h2>
        <p className="text-on-surface-muted mb-8">
          Enter your email to access the showcase
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-left text-xs uppercase tracking-wider text-primary-dim mb-2 font-space-grotesk">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full bg-black border-b-2 border-secondary px-4 py-3 text-on-surface placeholder:text-on-surface-muted/50 focus:outline-none focus:border-primary-dim transition-colors"
            />
          </div>

          {error && (
            <p className="text-secondary text-sm">{error}</p>
          )}

          <GradientButton type="submit" fullWidth disabled={loading}>
            {loading ? "Sending..." : "Send Magic Link ⚡"}
          </GradientButton>
        </form>

        <p className="text-on-surface-muted text-sm mt-6">
          Check your inbox for the login link — <em>no password needed.</em>
        </p>
      </GlassCard>

      <p className="absolute bottom-6 text-on-surface-muted/40 text-xs">
        Spyrosoft
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create auth callback route**

Create `src/app/(auth)/auth/callback/route.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = new URL("/", request.url);

  if (code) {
    const supabaseResponse = NextResponse.redirect(redirectTo);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
    return supabaseResponse;
  }

  redirectTo.pathname = "/login";
  return NextResponse.redirect(redirectTo);
}
```

- [ ] **Step 4: Create confirm page**

Create `src/app/(auth)/auth/confirm/page.tsx`:
```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import Link from "next/link";

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      <GlassCard className="relative z-10 w-full max-w-md text-center">
        <div className="text-5xl mb-6">📧</div>
        <h1 className="font-space-grotesk text-3xl font-bold mb-3">
          Check your email!
        </h1>
        <p className="text-on-surface-muted mb-2">
          We sent a magic link to{" "}
          <span className="text-primary-dim font-medium">{email}</span>
        </p>
        <div className="bg-surface-low rounded-lg p-4 my-6">
          <p className="text-sm text-on-surface-muted">
            Click the link in your email to log in.
            <br />
            It expires in <span className="text-secondary font-bold">15</span>{" "}
            minutes.
          </p>
        </div>

        <a href="mailto:" className="block mb-4">
          <GradientButton fullWidth>Open Mail App 📬</GradientButton>
        </a>

        <div className="space-y-2 text-sm">
          <p className="text-on-surface-muted">
            Didn&apos;t get it?{" "}
            <Link href="/login" className="text-primary-dim hover:underline">
              Send again
            </Link>
          </p>
          <Link
            href="/login"
            className="text-on-surface-muted hover:text-primary-dim"
          >
            Use a different email
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/ src/components/ui/
git commit -m "feat: add magic link login, callback, and confirmation pages"
```

---

## Task 5: App Shell (Sidebar Layout)

**Files:**
- Create: `src/app/(main)/layout.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/phase-gate.tsx`, `src/lib/utils.ts`

- [ ] **Step 1: Create utility for getting current user + phase**

Create `src/lib/utils.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import type { Profile, AppSettings } from "@/lib/types";

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();

  return data!;
}
```

- [ ] **Step 2: Create sidebar component**

Create `src/components/layout/sidebar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile, Phase } from "@/lib/types";

interface SidebarProps {
  user: Profile;
  currentPhase: Phase;
}

const navItems = [
  { href: "/", label: "Projects", icon: "◇" },
  { href: "/feed", label: "Live Feed", icon: "▶" },
  { href: "/vote", label: "Voting", icon: "★", phase: "voting" as Phase },
  { href: "/my-project", label: "Submit", icon: "↑" },
];

const adminItems = [
  { href: "/admin", label: "Dashboard", icon: "◉" },
  { href: "/admin/results", label: "Results", icon: "☰" },
];

export function Sidebar({ user, currentPhase }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 bg-surface-low/80 backdrop-blur-[20px] border-r border-outline flex flex-col z-40">
      {/* User identity */}
      <div className="p-4 border-b border-outline">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary-dim font-bold text-sm">
            {user.display_name[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-space-grotesk text-sm font-bold truncate">
              {user.display_name}
            </p>
            <p className="text-xs text-on-surface-muted truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const visible =
            !item.phase ||
            item.phase === currentPhase ||
            currentPhase === "results";
          if (!visible) return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-primary/15 text-primary-dim border-l-2 border-primary-dim"
                  : "text-on-surface-muted hover:text-on-surface hover:bg-surface-high/50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-space-grotesk tracking-wide uppercase text-xs font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}

        {user.role === "admin" && (
          <>
            <div className="h-px bg-outline my-3" />
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-secondary/15 text-secondary-dim border-l-2 border-secondary"
                    : "text-on-surface-muted hover:text-on-surface hover:bg-surface-high/50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-space-grotesk tracking-wide uppercase text-xs font-medium">
                  {item.label}
                </span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Vote Now CTA */}
      {currentPhase === "voting" && (
        <div className="p-3">
          <Link
            href="/vote"
            className="block w-full text-center bg-gradient-to-r from-primary to-secondary text-white font-space-grotesk font-bold text-xs uppercase tracking-wider py-3 rounded-lg hover:shadow-[0_0_20px_rgba(70,70,204,0.4)] transition-shadow"
          >
            Vote Now
          </Link>
        </div>
      )}

      {/* Logout */}
      <div className="p-3 border-t border-outline">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-on-surface-muted hover:text-on-surface hover:bg-surface-high/50 w-full transition-colors cursor-pointer"
        >
          <span>↩</span>
          <span className="font-space-grotesk tracking-wide uppercase text-xs font-medium">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create PhaseGate component**

Create `src/components/layout/phase-gate.tsx`:
```tsx
import type { Phase } from "@/lib/types";

interface PhaseGateProps {
  currentPhase: Phase;
  allowedPhases: Phase[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PhaseGate({
  currentPhase,
  allowedPhases,
  children,
  fallback,
}: PhaseGateProps) {
  if (!allowedPhases.includes(currentPhase)) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="font-space-grotesk text-2xl font-bold text-on-surface-muted mb-2">
              Not available yet
            </p>
            <p className="text-on-surface-muted/60 text-sm">
              This section opens during the{" "}
              <span className="text-primary-dim">{allowedPhases.join(" or ")}</span>{" "}
              phase.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Create main layout with sidebar**

Create `src/app/(main)/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser, getAppSettings } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getAppSettings(),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar user={user} currentPhase={settings.current_phase} />
      <main className="ml-60 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Create placeholder landing page**

Replace `src/app/(main)/page.tsx`:
```tsx
import { getAppSettings } from "@/lib/utils";

export default async function HomePage() {
  const settings = await getAppSettings();

  return (
    <div>
      <h1 className="font-space-grotesk text-5xl font-bold mb-2">
        <span className="text-primary-dim">SPYROSOFT AI</span>{" "}
        <span className="text-secondary">HACKATHON</span>
      </h1>
      <p className="text-on-surface-muted mb-8">
        Current phase: <span className="text-primary-dim">{settings.current_phase}</span>
      </p>
      <p className="text-on-surface-muted">Project grid coming soon...</p>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(main\)/ src/components/layout/ src/lib/utils.ts
git commit -m "feat: add sidebar layout, phase gate, and app shell"
```

---

## Task 6: Onboarding (Create / Join Project)

**Files:**
- Create: `src/app/(main)/onboarding/page.tsx`, `src/lib/actions/projects.ts`, `src/components/submission/join-project-list.tsx`

- [ ] **Step 1: Create project server actions**

Create `src/lib/actions/projects.ts`:
```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name, description: "", idea_origin: "", journey: "" })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("profiles")
    .update({ project_id: project.id })
    .eq("id", user.id);

  revalidatePath("/");
  redirect("/my-project");
}

export async function joinProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ project_id: projectId })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/my-project");
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    idea_origin?: string;
    journey?: string;
    tech_stack?: string[];
    video_url?: string;
    video_duration?: number;
    pdf_url?: string;
    thumbnail_url?: string;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update(data)
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  revalidatePath("/my-project");
}

export async function submitProject(projectId: string) {
  const supabase = await createClient();

  // Validate project has required fields
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");
  if (!project.name || !project.description) {
    throw new Error("Project name and description are required");
  }
  if (!project.video_url) {
    throw new Error("Video is required before submission");
  }

  const { error } = await supabase
    .from("projects")
    .update({ is_submitted: true })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/my-project");
}

export async function leaveProject() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ project_id: null })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/onboarding");
}
```

- [ ] **Step 2: Create JoinProjectList component**

Create `src/components/submission/join-project-list.tsx`:
```tsx
"use client";

import { useState } from "react";
import { joinProject } from "@/lib/actions/projects";
import type { ProjectWithTeam } from "@/lib/types";

interface JoinProjectListProps {
  projects: ProjectWithTeam[];
}

export function JoinProjectList({ projects }: JoinProjectListProps) {
  const [joining, setJoining] = useState<string | null>(null);

  async function handleJoin(projectId: string) {
    setJoining(projectId);
    try {
      await joinProject(projectId);
    } catch {
      setJoining(null);
    }
  }

  if (projects.length === 0) {
    return (
      <p className="text-on-surface-muted text-sm text-center py-8">
        No projects created yet. Be the first!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center justify-between bg-surface-high rounded-lg p-4 border border-outline hover:border-primary/30 transition-colors"
        >
          <div>
            <p className="font-space-grotesk font-bold">{project.name}</p>
            <p className="text-on-surface-muted text-sm">
              {project.team.map((m) => m.display_name).join(", ")}
            </p>
          </div>
          <button
            onClick={() => handleJoin(project.id)}
            disabled={joining !== null}
            className="text-primary-dim text-sm font-space-grotesk uppercase tracking-wider hover:text-secondary transition-colors disabled:opacity-50 cursor-pointer"
          >
            {joining === project.id ? "Joining..." : "Join →"}
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create onboarding page**

Create `src/app/(main)/onboarding/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import { createProject } from "@/lib/actions/projects";
import { JoinProjectList } from "@/components/submission/join-project-list";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import type { ProjectWithTeam } from "@/lib/types";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.project_id) redirect("/my-project");

  const supabase = await createClient();

  // Fetch existing projects with team members
  const { data: projects } = await supabase
    .from("projects")
    .select("*, team:profiles(id, display_name, avatar_url)")
    .eq("is_submitted", false)
    .order("created_at", { ascending: false });

  async function handleCreateProject(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    if (!name?.trim()) return;
    await createProject(name.trim());
  }

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <h1 className="font-space-grotesk text-4xl font-bold mb-2">
        Get Started
      </h1>
      <p className="text-on-surface-muted mb-10">
        Create a new project or join an existing team.
      </p>

      {/* Create project */}
      <GlassCard className="mb-8">
        <h2 className="font-space-grotesk text-xl font-bold mb-4">
          Create New Project
        </h2>
        <form action={handleCreateProject} className="flex gap-3">
          <input
            name="name"
            type="text"
            placeholder="Project name..."
            required
            className="flex-1 bg-black border-b-2 border-secondary px-4 py-3 text-on-surface placeholder:text-on-surface-muted/50 focus:outline-none focus:border-primary-dim transition-colors"
          />
          <GradientButton type="submit">Create</GradientButton>
        </form>
      </GlassCard>

      {/* Join existing */}
      <GlassCard>
        <h2 className="font-space-grotesk text-xl font-bold mb-4">
          Join Existing Project
        </h2>
        <JoinProjectList projects={(projects as ProjectWithTeam[]) || []} />
      </GlassCard>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/onboarding/ src/lib/actions/projects.ts src/components/submission/
git commit -m "feat: add onboarding page with create/join project flow"
```

---

## Task 7: Submission Form

**Files:**
- Create: `src/app/(main)/my-project/page.tsx`, `src/components/submission/submission-form.tsx`, `src/components/submission/file-upload-zone.tsx`, `src/components/submission/submission-stepper.tsx`

- [ ] **Step 1: Create file upload zone**

Create `src/components/submission/file-upload-zone.tsx`:
```tsx
"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FileUploadZoneProps {
  bucket: string;
  projectId: string;
  path: string;
  accept: string;
  label: string;
  hint: string;
  maxSizeMb?: number;
  maxDurationSec?: number;
  currentUrl?: string | null;
  onUploadComplete: (url: string, duration?: number) => void;
}

export function FileUploadZone({
  bucket,
  projectId,
  path,
  accept,
  label,
  hint,
  maxSizeMb = 50,
  maxDurationSec,
  currentUrl,
  onUploadComplete,
}: FileUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const supabase = createClient();

  const validateVideo = useCallback(
    (file: File): Promise<number> => {
      return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          if (maxDurationSec && video.duration > maxDurationSec) {
            reject(
              new Error(
                `Video is ${Math.ceil(video.duration)}s — max is ${maxDurationSec}s`
              )
            );
          } else {
            resolve(Math.ceil(video.duration));
          }
        };
        video.onerror = () => reject(new Error("Cannot read video file"));
        video.src = URL.createObjectURL(file);
      });
    },
    [maxDurationSec]
  );

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    setProgress(0);

    // Size check
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File too large (max ${maxSizeMb}MB)`);
      setUploading(false);
      return;
    }

    // Duration check for videos
    let duration: number | undefined;
    if (maxDurationSec && file.type.startsWith("video/")) {
      try {
        duration = await validateVideo(file);
      } catch (e) {
        setError((e as Error).message);
        setUploading(false);
        return;
      }
    }

    const filePath = `${projectId}/${path}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    setProgress(100);
    setUploading(false);
    onUploadComplete(publicUrl, duration);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-outline rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer relative"
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={uploading}
      />
      <div className="text-3xl mb-2">{bucket === "videos" ? "🎬" : bucket === "presentations" ? "📄" : "🖼"}</div>
      <p className="font-space-grotesk text-sm font-bold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-on-surface-muted text-xs">{hint}</p>

      {currentUrl && !uploading && (
        <p className="text-primary-dim text-xs mt-2">Uploaded ✓</p>
      )}

      {uploading && (
        <div className="mt-3">
          <div className="w-full bg-surface-high rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-on-surface-muted mt-1">Uploading...</p>
        </div>
      )}

      {error && <p className="text-secondary text-xs mt-2">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Create submission stepper**

Create `src/components/submission/submission-stepper.tsx`:
```tsx
interface SubmissionStepperProps {
  currentStep: number;
  totalSteps: number;
}

export function SubmissionStepper({
  currentStep,
  totalSteps,
}: SubmissionStepperProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all ${
            i < currentStep
              ? "bg-gradient-to-r from-primary to-secondary"
              : i === currentStep
                ? "bg-secondary shadow-[0_0_8px_rgba(255,77,41,0.5)]"
                : "bg-surface-high"
          }`}
        />
      ))}
      <span className="text-xs text-on-surface-muted font-space-grotesk ml-2">
        STEP {String(currentStep + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create submission form**

Create `src/components/submission/submission-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { updateProject, submitProject } from "@/lib/actions/projects";
import { SubmissionStepper } from "./submission-stepper";
import { FileUploadZone } from "./file-upload-zone";
import { GradientButton } from "@/components/ui/gradient-button";
import type { Project } from "@/lib/types";

interface SubmissionFormProps {
  project: Project;
}

export function SubmissionForm({ project }: SubmissionFormProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    idea_origin: project.idea_origin,
    journey: project.journey,
    tech_stack: project.tech_stack,
    video_url: project.video_url,
    video_duration: project.video_duration,
    pdf_url: project.pdf_url,
    thumbnail_url: project.thumbnail_url,
  });
  const [techInput, setTechInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function save(data: Partial<typeof form>) {
    setSaving(true);
    const updated = { ...form, ...data };
    setForm(updated);
    await updateProject(project.id, updated);
    setSaving(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitProject(project.id);
    } catch (e) {
      alert((e as Error).message);
      setSubmitting(false);
    }
  }

  function addTechTag() {
    if (!techInput.trim()) return;
    const updated = [...form.tech_stack, techInput.trim()];
    setTechInput("");
    save({ tech_stack: updated });
  }

  function removeTechTag(index: number) {
    const updated = form.tech_stack.filter((_, i) => i !== index);
    save({ tech_stack: updated });
  }

  // Step 0: Basic Info (name)
  // Step 1: Details (questions)
  // Step 2: Uploads (video, pdf, thumbnail)
  // Step 3: Review & Submit

  return (
    <div>
      <SubmissionStepper currentStep={step} totalSteps={4} />

      {step === 0 && (
        <div className="space-y-6">
          <h2 className="font-space-grotesk text-2xl font-bold">
            Project Basics
          </h2>
          <div>
            <label className="block text-xs uppercase tracking-wider text-primary-dim mb-2 font-space-grotesk">
              Project Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={() => save({ name: form.name })}
              className="w-full bg-black border-b-2 border-secondary px-4 py-3 text-on-surface focus:outline-none focus:border-primary-dim transition-colors"
            />
          </div>
          <GradientButton onClick={() => setStep(1)} disabled={!form.name.trim()}>
            Next →
          </GradientButton>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="font-space-grotesk text-2xl font-bold">
            Deep Dive
          </h2>

          <div>
            <label className="block text-xs uppercase tracking-wider text-primary-dim mb-2 font-space-grotesk">
              What does your project do?
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value.slice(0, 280) })
              }
              onBlur={() => save({ description: form.description })}
              placeholder="Describe the core utility and problem solved..."
              rows={3}
              className="w-full bg-black border-b-2 border-secondary px-4 py-3 text-on-surface placeholder:text-on-surface-muted/50 focus:outline-none focus:border-primary-dim transition-colors resize-none"
            />
            <p className="text-xs text-on-surface-muted text-right">
              {form.description.length}/280
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-primary-dim mb-2 font-space-grotesk">
              How did you get the idea?
            </label>
            <textarea
              value={form.idea_origin}
              onChange={(e) =>
                setForm({ ...form, idea_origin: e.target.value })
              }
              onBlur={() => save({ idea_origin: form.idea_origin })}
              placeholder="Tell us about the 'Eureka' moment..."
              rows={3}
              className="w-full bg-black border-b-2 border-secondary px-4 py-3 text-on-surface placeholder:text-on-surface-muted/50 focus:outline-none focus:border-primary-dim transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-primary-dim mb-2 font-space-grotesk">
              What was your journey?
            </label>
            <textarea
              value={form.journey}
              onChange={(e) => setForm({ ...form, journey: e.target.value })}
              onBlur={() => save({ journey: form.journey })}
              placeholder="Challenges, pivots, and breakthroughs..."
              rows={3}
              className="w-full bg-black border-b-2 border-secondary px-4 py-3 text-on-surface placeholder:text-on-surface-muted/50 focus:outline-none focus:border-primary-dim transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-primary-dim mb-2 font-space-grotesk">
              Tech stack used
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tech_stack.map((tag, i) => (
                <span
                  key={i}
                  className="bg-primary/15 text-primary-dim text-xs px-3 py-1 rounded font-space-grotesk flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => removeTechTag(i)} className="hover:text-secondary cursor-pointer">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTechTag())}
                placeholder="Add tech..."
                className="flex-1 bg-black border-b-2 border-outline px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-dim transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <GradientButton variant="ghost" onClick={() => setStep(0)}>
              ← Back
            </GradientButton>
            <GradientButton onClick={() => setStep(2)}>
              Next →
            </GradientButton>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="font-space-grotesk text-2xl font-bold">
            Proof of Build
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <FileUploadZone
                bucket="videos"
                projectId={project.id}
                path="demo.mp4"
                accept="video/mp4,video/webm"
                label="Upload Demo Video"
                hint="Max 60 seconds, ≤50MB"
                maxSizeMb={50}
                maxDurationSec={60}
                currentUrl={form.video_url}
                onUploadComplete={(url, duration) =>
                  save({ video_url: url, video_duration: duration })
                }
              />

              <FileUploadZone
                bucket="thumbnails"
                projectId={project.id}
                path="thumb.jpg"
                accept="image/jpeg,image/png,image/webp"
                label="Upload Thumbnail"
                hint="Screenshot for project card"
                maxSizeMb={5}
                currentUrl={form.thumbnail_url}
                onUploadComplete={(url) => save({ thumbnail_url: url })}
              />
            </div>

            <FileUploadZone
              bucket="presentations"
              projectId={project.id}
              path="presentation.pdf"
              accept="application/pdf"
              label="Technical White Paper"
              hint="PDF, optional"
              maxSizeMb={20}
              currentUrl={form.pdf_url}
              onUploadComplete={(url) => save({ pdf_url: url })}
            />
          </div>

          <div className="flex gap-3">
            <GradientButton variant="ghost" onClick={() => setStep(1)}>
              ← Back
            </GradientButton>
            <GradientButton onClick={() => setStep(3)}>
              Review →
            </GradientButton>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="font-space-grotesk text-2xl font-bold">
            Review & Submit
          </h2>

          <div className="bg-surface-low rounded-xl p-6 space-y-4">
            <div>
              <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk">Project Name</p>
              <p className="text-lg font-bold">{form.name}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk">Description</p>
              <p className="text-sm">{form.description || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk">Idea Origin</p>
              <p className="text-sm">{form.idea_origin || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk">Journey</p>
              <p className="text-sm">{form.journey || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk">Tech Stack</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {form.tech_stack.map((t, i) => (
                  <span key={i} className="bg-primary/15 text-primary-dim text-xs px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <p className="text-xs text-on-surface-muted">Video</p>
                <p className={`text-sm ${form.video_url ? "text-primary-dim" : "text-secondary"}`}>
                  {form.video_url ? "✓ Uploaded" : "✗ Missing"}
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-muted">Thumbnail</p>
                <p className="text-sm">{form.thumbnail_url ? "✓ Uploaded" : "— Optional"}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-muted">PDF</p>
                <p className="text-sm">{form.pdf_url ? "✓ Uploaded" : "— Optional"}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-high/60 rounded-lg p-4 border border-secondary/30">
            <p className="text-secondary text-sm font-space-grotesk">
              ⚠ By submitting, you agree to the Syndicate Protocol.
              <br />
              <span className="text-on-surface-muted">
                You cannot edit after submission.
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <GradientButton variant="ghost" onClick={() => setStep(2)}>
              ← Back
            </GradientButton>
            <GradientButton
              onClick={handleSubmit}
              disabled={submitting || !form.video_url}
            >
              {submitting ? "Submitting..." : "Submit Project ⚡"}
            </GradientButton>
          </div>
        </div>
      )}

      {saving && (
        <p className="text-xs text-on-surface-muted mt-4">Auto-saving...</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create my-project page**

Create `src/app/(main)/my-project/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import { SubmissionForm } from "@/components/submission/submission-form";
import type { Project, Profile } from "@/lib/types";

export default async function MyProjectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.project_id) redirect("/onboarding");

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", user.project_id)
    .single();

  if (!project) redirect("/onboarding");

  const { data: team } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("project_id", project.id);

  // If already submitted, show read-only view
  if (project.is_submitted) {
    return (
      <div className="max-w-3xl">
        <h1 className="font-space-grotesk text-4xl font-bold mb-2">
          {project.name}
        </h1>
        <div className="inline-block bg-primary/15 text-primary-dim text-xs px-3 py-1 rounded font-space-grotesk uppercase tracking-wider mb-6">
          Submitted ✓
        </div>
        <p className="text-on-surface-muted">
          Your project has been submitted. You can browse other projects and
          vote when voting opens.
        </p>
        {/* Team */}
        <div className="mt-6">
          <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk mb-2">
            Team
          </p>
          <div className="flex gap-2">
            {team?.map((m: Pick<Profile, "id" | "display_name" | "avatar_url">) => (
              <span
                key={m.id}
                className="bg-surface-high text-sm px-3 py-1 rounded"
              >
                {m.display_name}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-space-grotesk text-4xl font-bold mb-2">
        Project Submission
      </h1>
      <p className="text-on-surface-muted mb-8">
        Document your build, showcase your journey, and submit.
      </p>
      <SubmissionForm project={project as Project} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/my-project/ src/components/submission/
git commit -m "feat: add project submission form with stepper, uploads, and review"
```

---

## Task 8: Project Grid (Landing Page)

**Files:**
- Create: `src/components/projects/project-grid.tsx`, `src/components/projects/project-card.tsx`, `src/components/projects/project-detail-modal.tsx`, `src/components/ui/video-player.tsx`
- Modify: `src/app/(main)/page.tsx`

- [ ] **Step 1: Create video player**

Create `src/components/ui/video-player.tsx`:
```tsx
"use client";

import { useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  className?: string;
}

export function VideoPlayer({
  src,
  autoPlay = false,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  }

  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        playsInline
        className="w-full rounded-lg bg-black"
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-secondary/90 flex items-center justify-center shadow-[0_0_30px_rgba(255,77,41,0.4)]">
            <span className="text-white text-2xl ml-1">▶</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create project card**

Create `src/components/projects/project-card.tsx`:
```tsx
import type { ProjectWithTeam } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectWithTeam;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left bg-surface-low rounded-xl overflow-hidden border border-outline hover:border-primary/30 transition-all hover:shadow-[0_0_40px_rgba(70,70,204,0.1)] group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-surface-high relative overflow-hidden">
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-muted/30 text-4xl">
            ◇
          </div>
        )}
        {/* Tech tag */}
        {project.tech_stack[0] && (
          <span className="absolute top-2 left-2 bg-primary/80 text-white text-[10px] px-2 py-0.5 rounded font-space-grotesk uppercase">
            {project.tech_stack[0]}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-space-grotesk font-bold text-sm mb-1 truncate">
          {project.name}
        </h3>
        <p className="text-on-surface-muted text-xs line-clamp-2 mb-3">
          {project.description}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary-dim font-bold">
            {project.team[0]?.display_name[0]?.toUpperCase()}
          </div>
          <span className="text-on-surface-muted text-xs">
            {project.team.map((m) => m.display_name).join(", ")}
          </span>
          <span className="text-on-surface-muted/40 ml-auto">→</span>
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Create project detail modal**

Create `src/components/projects/project-detail-modal.tsx`:
```tsx
"use client";

import { useState } from "react";
import { VideoPlayer } from "@/components/ui/video-player";
import type { ProjectWithTeam } from "@/lib/types";

interface ProjectDetailModalProps {
  project: ProjectWithTeam;
  onClose: () => void;
}

export function ProjectDetailModal({
  project,
  onClose,
}: ProjectDetailModalProps) {
  const [tab, setTab] = useState<"about" | "presentation">("about");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-low rounded-xl border border-outline max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-muted hover:text-on-surface z-10 cursor-pointer text-xl"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left: Video */}
          <div className="p-6">
            {project.video_url ? (
              <VideoPlayer src={project.video_url} />
            ) : (
              <div className="aspect-video bg-surface-high rounded-lg flex items-center justify-center text-on-surface-muted">
                No video uploaded
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="p-6 lg:border-l border-outline">
            {/* Tech tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {project.tech_stack.map((tag, i) => (
                <span
                  key={i}
                  className="bg-primary/15 text-primary-dim text-[10px] px-2 py-0.5 rounded font-space-grotesk uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h2 className="font-space-grotesk text-2xl font-bold mb-2">
              {project.name}
            </h2>

            {/* Team */}
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk">
                Team:
              </p>
              {project.team.map((m) => (
                <span key={m.id} className="text-sm text-primary-dim">
                  {m.display_name}
                </span>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-outline mb-4">
              <button
                onClick={() => setTab("about")}
                className={`pb-2 text-xs uppercase tracking-wider font-space-grotesk transition-colors cursor-pointer ${
                  tab === "about"
                    ? "text-primary-dim border-b-2 border-primary-dim"
                    : "text-on-surface-muted"
                }`}
              >
                About
              </button>
              <button
                onClick={() => setTab("presentation")}
                className={`pb-2 text-xs uppercase tracking-wider font-space-grotesk transition-colors cursor-pointer ${
                  tab === "presentation"
                    ? "text-primary-dim border-b-2 border-primary-dim"
                    : "text-on-surface-muted"
                }`}
              >
                Presentation
              </button>
            </div>

            {tab === "about" && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk mb-1">
                    What does it do?
                  </p>
                  <p className="text-sm">{project.description}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk mb-1">
                    The Journey
                  </p>
                  <p className="text-sm">{project.journey || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk mb-1">
                    The Idea
                  </p>
                  <p className="text-sm">{project.idea_origin || "—"}</p>
                </div>
              </div>
            )}

            {tab === "presentation" && (
              <div>
                {project.pdf_url ? (
                  <a
                    href={project.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-surface-high px-4 py-3 rounded-lg text-primary-dim hover:bg-primary/15 transition-colors"
                  >
                    📄 Download Presentation
                  </a>
                ) : (
                  <p className="text-on-surface-muted text-sm">
                    No presentation uploaded.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create project grid**

Create `src/components/projects/project-grid.tsx`:
```tsx
"use client";

import { useState } from "react";
import { ProjectCard } from "./project-card";
import { ProjectDetailModal } from "./project-detail-modal";
import type { ProjectWithTeam } from "@/lib/types";

interface ProjectGridProps {
  projects: ProjectWithTeam[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [selectedProject, setSelectedProject] =
    useState<ProjectWithTeam | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => setSelectedProject(project)}
          />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-20">
          <p className="text-on-surface-muted text-lg">
            No projects submitted yet.
          </p>
        </div>
      )}

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 5: Update landing page**

Replace `src/app/(main)/page.tsx`:
```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/utils";
import { ProjectGrid } from "@/components/projects/project-grid";
import { GradientButton } from "@/components/ui/gradient-button";
import type { ProjectWithTeam } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const settings = await getAppSettings();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, team:profiles(id, display_name, avatar_url)")
    .eq("is_submitted", true)
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-space-grotesk text-5xl font-bold mb-2">
            <span className="text-primary-dim">SPYROSOFT AI</span>{" "}
            <span className="text-secondary">HACKATHON</span>
          </h1>
          <p className="text-on-surface-muted">
            Witness the convergence of neural networks and creative engineering.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/feed">
            <GradientButton>Watch All Demos ⊙</GradientButton>
          </Link>
        </div>
      </div>

      <ProjectGrid projects={(projects as ProjectWithTeam[]) || []} />

      {/* Page counter */}
      <div className="mt-8 text-center">
        <p className="text-on-surface-muted/40 text-xs font-space-grotesk">
          {projects?.length || 0} / {projects?.length || 0} projects
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/projects/ src/components/ui/video-player.tsx src/app/\(main\)/page.tsx
git commit -m "feat: add project grid, detail modal, and landing page"
```

---

## Task 9: TikTok-style Video Feed

**Files:**
- Create: `src/app/(main)/feed/page.tsx`, `src/components/feed/video-feed.tsx`, `src/components/feed/video-feed-item.tsx`

- [ ] **Step 1: Create video feed item**

Create `src/components/feed/video-feed-item.tsx`:
```tsx
"use client";

import { useEffect, useRef } from "react";
import type { ProjectWithTeam } from "@/lib/types";

interface VideoFeedItemProps {
  project: ProjectWithTeam;
  index: number;
  total: number;
  onViewDetails: () => void;
}

export function VideoFeedItem({
  project,
  index,
  total,
  onViewDetails,
}: VideoFeedItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen snap-start flex flex-col items-center justify-center px-8 relative"
    >
      {/* Counter */}
      <div className="absolute top-6 right-8 text-on-surface-muted font-space-grotesk text-sm">
        {index + 1} / {total}
      </div>

      {/* Video */}
      <div className="w-full max-w-4xl">
        {project.video_url ? (
          <video
            ref={videoRef}
            src={project.video_url}
            playsInline
            preload={index < 2 ? "auto" : "metadata"}
            className="w-full rounded-xl bg-black"
            controls
          />
        ) : (
          <div className="aspect-video bg-surface-high rounded-xl flex items-center justify-center text-on-surface-muted">
            No video
          </div>
        )}
      </div>

      {/* Project info */}
      <div className="w-full max-w-4xl mt-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-primary-dim uppercase tracking-wider font-space-grotesk mb-1">
            Project #{String(index + 1).padStart(2, "0")}
          </p>
          <h2 className="font-space-grotesk text-2xl font-bold">
            {project.name}
          </h2>
          <p className="text-on-surface-muted text-sm mt-1 max-w-xl">
            {project.description}
          </p>
          <p className="text-on-surface-muted/60 text-xs mt-2">
            by{" "}
            <span className="text-primary-dim">
              {project.team.map((m) => m.display_name).join(" & ")}
            </span>
          </p>
        </div>
        <button
          onClick={onViewDetails}
          className="text-primary-dim text-xs font-space-grotesk uppercase tracking-wider hover:text-secondary transition-colors whitespace-nowrap cursor-pointer"
        >
          View Full Project Details →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create video feed container**

Create `src/components/feed/video-feed.tsx`:
```tsx
"use client";

import { useState } from "react";
import { VideoFeedItem } from "./video-feed-item";
import { ProjectDetailModal } from "@/components/projects/project-detail-modal";
import { GradientButton } from "@/components/ui/gradient-button";
import Link from "next/link";
import type { ProjectWithTeam } from "@/lib/types";

interface VideoFeedProps {
  projects: ProjectWithTeam[];
}

export function VideoFeed({ projects }: VideoFeedProps) {
  const [selectedProject, setSelectedProject] =
    useState<ProjectWithTeam | null>(null);

  return (
    <>
      <div className="h-screen overflow-y-scroll snap-y snap-mandatory">
        {projects.map((project, i) => (
          <VideoFeedItem
            key={project.id}
            project={project}
            index={i}
            total={projects.length}
            onViewDetails={() => setSelectedProject(project)}
          />
        ))}

        {/* End CTA */}
        <div className="h-screen snap-start flex flex-col items-center justify-center">
          <p className="font-space-grotesk text-3xl font-bold mb-4">
            That&apos;s all!
          </p>
          <p className="text-on-surface-muted mb-8">
            You&apos;ve seen all {projects.length} projects.
          </p>
          <Link href="/vote">
            <GradientButton>Go Vote →</GradientButton>
          </Link>
        </div>
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Create feed page**

Create `src/app/(main)/feed/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { VideoFeed } from "@/components/feed/video-feed";
import type { ProjectWithTeam } from "@/lib/types";
import Link from "next/link";

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, team:profiles(id, display_name, avatar_url)")
    .eq("is_submitted", true)
    .order("created_at", { ascending: true });

  if (!projects?.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="font-space-grotesk text-2xl font-bold text-on-surface-muted mb-2">
            No demos yet
          </p>
          <p className="text-on-surface-muted/60 text-sm">
            Projects will appear here after submission.
          </p>
          <Link href="/" className="text-primary-dim text-sm mt-4 inline-block hover:underline">
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-8">
      <div className="fixed top-4 left-64 z-30">
        <Link
          href="/"
          className="text-on-surface-muted hover:text-on-surface text-sm font-space-grotesk"
        >
          ✕ Close Feed
        </Link>
      </div>
      <VideoFeed projects={projects as ProjectWithTeam[]} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/feed/ src/components/feed/
git commit -m "feat: add TikTok-style video feed with scroll-snap and autoplay"
```

---

## Task 10: Voting Screen

**Files:**
- Create: `src/app/(main)/vote/page.tsx`, `src/components/voting/voting-board.tsx`, `src/components/voting/voting-category.tsx`, `src/components/voting/vote-submit-bar.tsx`, `src/lib/actions/voting.ts`

- [ ] **Step 1: Create voting server actions**

Create `src/lib/actions/voting.ts`:
```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { VoteCategory, VoteResult } from "@/lib/types";

export async function castVotes(
  votes: { category: VoteCategory; project_id: string }[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check phase
  const { data: settings } = await supabase
    .from("app_settings")
    .select("current_phase")
    .eq("id", 1)
    .single();

  if (settings?.current_phase !== "voting") {
    throw new Error("Voting is not open");
  }

  // Check not voting for own project
  const { data: profile } = await supabase
    .from("profiles")
    .select("project_id")
    .eq("id", user.id)
    .single();

  for (const vote of votes) {
    if (vote.project_id === profile?.project_id) {
      throw new Error("Cannot vote for your own project");
    }
  }

  // Check not already voted
  const { data: existingVotes } = await supabase
    .from("votes")
    .select("id")
    .eq("voter_id", user.id);

  if (existingVotes && existingVotes.length > 0) {
    throw new Error("You have already voted");
  }

  // Insert all votes
  const { error } = await supabase.from("votes").insert(
    votes.map((v) => ({
      voter_id: user.id,
      project_id: v.project_id,
      category: v.category,
    }))
  );

  if (error) throw new Error(error.message);

  revalidatePath("/vote");
  revalidatePath("/admin");
}

export async function getResults(): Promise<VoteResult[]> {
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_vote_results");

  return (data as VoteResult[]) || [];
}
```

- [ ] **Step 2: Create voting category component**

Create `src/components/voting/voting-category.tsx`:
```tsx
"use client";

import type { ProjectWithTeam, VoteCategory } from "@/lib/types";

interface VotingCategoryProps {
  category: VoteCategory;
  label: string;
  icon: string;
  projects: ProjectWithTeam[];
  selectedProjectId: string | null;
  ownProjectId: string | null;
  onSelect: (projectId: string) => void;
}

export function VotingCategory({
  label,
  icon,
  projects,
  selectedProjectId,
  ownProjectId,
  onSelect,
}: VotingCategoryProps) {
  return (
    <div className="bg-surface-low rounded-xl border border-outline p-4">
      <h3 className="font-space-grotesk text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="text-secondary">{icon}</span>
        {label}
      </h3>

      <div className="space-y-2">
        {projects.map((project) => {
          const isOwn = project.id === ownProjectId;
          const isSelected = project.id === selectedProjectId;

          return (
            <button
              key={project.id}
              onClick={() => !isOwn && onSelect(project.id)}
              disabled={isOwn}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all cursor-pointer ${
                isOwn
                  ? "opacity-40 cursor-not-allowed bg-surface-high/30"
                  : isSelected
                    ? "bg-primary/15 border border-primary shadow-[0_0_15px_rgba(70,70,204,0.3)]"
                    : "bg-surface-high/50 border border-transparent hover:border-outline"
              }`}
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg bg-surface-high overflow-hidden flex-shrink-0">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-muted/30 text-xs">
                    ◇
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-space-grotesk text-sm font-bold truncate">
                  {project.name}
                </p>
                <p className="text-on-surface-muted text-xs truncate">
                  {project.description}
                </p>
              </div>

              {/* Checkmark */}
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}

              {isOwn && (
                <span className="text-[10px] text-on-surface-muted font-space-grotesk uppercase">
                  Your project
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create vote submit bar**

Create `src/components/voting/vote-submit-bar.tsx`:
```tsx
"use client";

import { GradientButton } from "@/components/ui/gradient-button";
import type { VoteCategory } from "@/lib/types";

interface VoteSubmitBarProps {
  selections: Record<VoteCategory, string | null>;
  onSubmit: () => void;
  submitting: boolean;
}

const CATEGORIES: VoteCategory[] = [
  "best_overall",
  "best_demo_ux",
  "most_creative",
];

export function VoteSubmitBar({
  selections,
  onSubmit,
  submitting,
}: VoteSubmitBarProps) {
  const filledCount = CATEGORIES.filter((c) => selections[c]).length;
  const allFilled = filledCount === 3;

  return (
    <div className="fixed bottom-0 left-60 right-0 bg-surface-low/90 backdrop-blur-[20px] border-t border-outline px-8 py-4 flex items-center justify-between z-30">
      <div className="flex items-center gap-4">
        <span className="font-space-grotesk text-sm">
          <span className="text-on-surface font-bold">Selections Made</span>
        </span>
        <span className="font-space-grotesk text-2xl font-bold">
          {String(filledCount).padStart(2, "0")} / 03
        </span>
        {allFilled && (
          <span className="text-xs text-primary-dim font-space-grotesk uppercase tracking-wider animate-pulse">
            ● Ready to transmit
          </span>
        )}
      </div>

      <GradientButton onClick={onSubmit} disabled={!allFilled || submitting}>
        {submitting ? "Submitting..." : "Submit Votes ▶"}
      </GradientButton>
    </div>
  );
}
```

- [ ] **Step 4: Create voting board**

Create `src/components/voting/voting-board.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VotingCategory } from "./voting-category";
import { VoteSubmitBar } from "./vote-submit-bar";
import { castVotes } from "@/lib/actions/voting";
import type { ProjectWithTeam, VoteCategory as VoteCategoryType } from "@/lib/types";

interface VotingBoardProps {
  projects: ProjectWithTeam[];
  ownProjectId: string | null;
  hasVoted: boolean;
}

const CATEGORIES: {
  key: VoteCategoryType;
  label: string;
  icon: string;
}[] = [
  { key: "best_overall", label: "Best Overall", icon: "◆" },
  { key: "best_demo_ux", label: "Best Demo/UX", icon: "◇" },
  { key: "most_creative", label: "Most Creative", icon: "✦" },
];

export function VotingBoard({
  projects,
  ownProjectId,
  hasVoted,
}: VotingBoardProps) {
  const [selections, setSelections] = useState<
    Record<VoteCategoryType, string | null>
  >({
    best_overall: null,
    best_demo_ux: null,
    most_creative: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const votes = Object.entries(selections)
        .filter(([, projectId]) => projectId !== null)
        .map(([category, project_id]) => ({
          category: category as VoteCategoryType,
          project_id: project_id!,
        }));

      await castVotes(votes);
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
      setSubmitting(false);
    }
  }

  if (hasVoted) {
    return (
      <div className="text-center py-20">
        <p className="font-space-grotesk text-3xl font-bold mb-2">
          Votes Submitted ✓
        </p>
        <p className="text-on-surface-muted">
          Thanks for voting! Results will be revealed soon.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => (
          <VotingCategory
            key={cat.key}
            category={cat.key}
            label={cat.label}
            icon={cat.icon}
            projects={projects}
            selectedProjectId={selections[cat.key]}
            ownProjectId={ownProjectId}
            onSelect={(id) =>
              setSelections((prev) => ({ ...prev, [cat.key]: id }))
            }
          />
        ))}
      </div>

      <VoteSubmitBar
        selections={selections}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
```

- [ ] **Step 5: Create vote page**

Create `src/app/(main)/vote/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getAppSettings } from "@/lib/utils";
import { PhaseGate } from "@/components/layout/phase-gate";
import { VotingBoard } from "@/components/voting/voting-board";
import type { ProjectWithTeam } from "@/lib/types";

export default async function VotePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const settings = await getAppSettings();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, team:profiles(id, display_name, avatar_url)")
    .eq("is_submitted", true)
    .order("created_at", { ascending: true });

  const { data: existingVotes } = await supabase
    .from("votes")
    .select("id")
    .eq("voter_id", user.id);

  const hasVoted = (existingVotes?.length ?? 0) > 0;

  return (
    <div>
      <h1 className="font-space-grotesk text-4xl font-bold mb-2">
        Vote for your favorites
      </h1>
      <p className="text-on-surface-muted mb-8">
        Cast your final ballot. One vote per category.{" "}
        <span className="text-secondary">You can only vote once.</span>
      </p>

      <PhaseGate
        currentPhase={settings.current_phase}
        allowedPhases={["voting", "results"]}
      >
        <VotingBoard
          projects={(projects as ProjectWithTeam[]) || []}
          ownProjectId={user.project_id}
          hasVoted={hasVoted}
        />
      </PhaseGate>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(main\)/vote/ src/components/voting/ src/lib/actions/voting.ts
git commit -m "feat: add voting screen with 3 categories and atomic vote submission"
```

---

## Task 11: Results Page

**Files:**
- Create: `src/app/(main)/results/page.tsx`

- [ ] **Step 1: Create Supabase RPC for vote results**

Add to `supabase/migrations/001_initial_schema.sql` (or create `002_vote_results.sql`):

Create `supabase/migrations/002_vote_results_rpc.sql`:
```sql
create or replace function get_vote_results()
returns table (
  project_id uuid,
  project_name text,
  team_members text[],
  category text,
  vote_count bigint
) as $$
begin
  return query
    select
      p.id as project_id,
      p.name as project_name,
      array_agg(distinct pr.display_name) as team_members,
      v.category,
      count(v.id) as vote_count
    from votes v
    join projects p on p.id = v.project_id
    join profiles pr on pr.project_id = p.id
    group by p.id, p.name, v.category
    order by v.category, count(v.id) desc;
end;
$$ language plpgsql security definer;
```

- [ ] **Step 2: Create results page**

Create `src/app/(main)/results/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/utils";
import { PhaseGate } from "@/components/layout/phase-gate";
import type { VoteCategory, VoteResult } from "@/lib/types";

const CATEGORY_LABELS: Record<VoteCategory, { label: string; icon: string }> = {
  best_overall: { label: "Best Overall", icon: "🏆" },
  best_demo_ux: { label: "Best Demo / UX", icon: "🎨" },
  most_creative: { label: "Most Creative", icon: "🧠" },
};

export default async function ResultsPage() {
  const settings = await getAppSettings();
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_vote_results");
  const results = (data as VoteResult[]) || [];

  const grouped = results.reduce(
    (acc, r) => {
      if (!acc[r.category]) acc[r.category] = [];
      acc[r.category].push(r);
      return acc;
    },
    {} as Record<string, VoteResult[]>
  );

  return (
    <div>
      <h1 className="font-space-grotesk text-4xl font-bold mb-2">Results</h1>
      <p className="text-on-surface-muted mb-8">
        The votes are in. Here are the winners.
      </p>

      <PhaseGate currentPhase={settings.current_phase} allowedPhases={["results"]}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(CATEGORY_LABELS) as VoteCategory[]).map((category) => {
            const categoryResults = grouped[category] || [];
            const meta = CATEGORY_LABELS[category];

            return (
              <div key={category} className="bg-surface-low rounded-xl border border-outline p-6">
                <h2 className="font-space-grotesk text-lg font-bold mb-4 flex items-center gap-2">
                  <span>{meta.icon}</span>
                  {meta.label}
                </h2>
                <div className="space-y-3">
                  {categoryResults.map((r, i) => (
                    <div
                      key={r.project_id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        i === 0
                          ? "bg-gradient-to-r from-primary/15 to-secondary/10 border border-primary/30"
                          : "bg-surface-high/50"
                      }`}
                    >
                      <span className="font-space-grotesk text-lg font-bold text-on-surface-muted w-6">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-space-grotesk text-sm font-bold">
                          {r.project_name}
                        </p>
                        <p className="text-on-surface-muted text-xs">
                          {r.team_members.join(", ")}
                        </p>
                      </div>
                      <span className="font-space-grotesk text-lg font-bold text-primary-dim">
                        {r.vote_count}
                      </span>
                    </div>
                  ))}
                  {categoryResults.length === 0 && (
                    <p className="text-on-surface-muted text-sm text-center py-4">
                      No votes yet
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PhaseGate>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_vote_results_rpc.sql src/app/\(main\)/results/
git commit -m "feat: add results leaderboard page with vote aggregation"
```

---

## Task 12: Admin Panel

**Files:**
- Create: `src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/page.tsx`, `src/app/(admin)/admin/results/page.tsx`, `src/lib/actions/admin.ts`, `src/components/admin/stats-cards.tsx`, `src/components/admin/phase-switcher.tsx`, `src/components/admin/projects-table.tsx`, `src/components/ui/confirm-dialog.tsx`

- [ ] **Step 1: Create admin server actions**

Create `src/lib/actions/admin.ts`:
```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Phase } from "@/lib/types";
import ExcelJS from "exceljs";

export async function setPhase(phase: Phase) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_settings")
    .update({ current_phase: phase })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  // Delete files from storage
  for (const bucket of ["videos", "presentations", "thumbnails"]) {
    const { data: files } = await supabase.storage
      .from(bucket)
      .list(projectId);
    if (files?.length) {
      await supabase.storage
        .from(bucket)
        .remove(files.map((f) => `${projectId}/${f.name}`));
    }
  }

  // Unlink profiles
  await supabase
    .from("profiles")
    .update({ project_id: null })
    .eq("project_id", projectId);

  // Delete project (cascades to votes)
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function exportResults(): Promise<string> {
  const supabase = await createClient();

  // Get results
  const { data: results } = await supabase.rpc("get_vote_results");

  // Get all votes
  const { data: allVotes } = await supabase
    .from("votes")
    .select("*, voter:profiles!voter_id(email), project:projects!project_id(name)")
    .order("category");

  // Get all projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*, team:profiles(display_name, email)")
    .eq("is_submitted", true);

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Results
  const resultsSheet = workbook.addWorksheet("Results");
  resultsSheet.columns = [
    { header: "Category", key: "category", width: 20 },
    { header: "Rank", key: "rank", width: 8 },
    { header: "Project", key: "project_name", width: 30 },
    { header: "Team", key: "team_members", width: 30 },
    { header: "Votes", key: "vote_count", width: 10 },
  ];

  let currentCategory = "";
  let rank = 0;
  (results || []).forEach((r: { category: string; project_name: string; team_members: string[]; vote_count: number }) => {
    if (r.category !== currentCategory) {
      currentCategory = r.category;
      rank = 1;
    } else {
      rank++;
    }
    resultsSheet.addRow({
      category: r.category,
      rank,
      project_name: r.project_name,
      team_members: r.team_members.join(", "),
      vote_count: r.vote_count,
    });
  });

  // Sheet 2: All Votes
  const votesSheet = workbook.addWorksheet("All Votes");
  votesSheet.columns = [
    { header: "Voter Email", key: "voter_email", width: 30 },
    { header: "Category", key: "category", width: 20 },
    { header: "Project", key: "project_name", width: 30 },
  ];

  (allVotes || []).forEach((v: { voter: { email: string }; category: string; project: { name: string } }) => {
    votesSheet.addRow({
      voter_email: v.voter?.email,
      category: v.category,
      project_name: v.project?.name,
    });
  });

  // Sheet 3: Projects
  const projectsSheet = workbook.addWorksheet("Projects");
  projectsSheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Description", key: "description", width: 50 },
    { header: "Tech Stack", key: "tech_stack", width: 30 },
    { header: "Team", key: "team", width: 30 },
    { header: "Submitted", key: "created_at", width: 20 },
  ];

  (projects || []).forEach((p: { name: string; description: string; tech_stack: string[]; team: { display_name: string }[]; created_at: string }) => {
    projectsSheet.addRow({
      name: p.name,
      description: p.description,
      tech_stack: p.tech_stack.join(", "),
      team: p.team.map((m: { display_name: string }) => m.display_name).join(", "),
      created_at: p.created_at,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}
```

- [ ] **Step 2: Create confirm dialog**

Create `src/components/ui/confirm-dialog.tsx`:
```tsx
"use client";

import { GradientButton } from "./gradient-button";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface-low rounded-xl border border-outline p-6 max-w-md w-full">
        <h3 className="font-space-grotesk text-lg font-bold mb-2">{title}</h3>
        <p className="text-on-surface-muted text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <GradientButton variant="ghost" onClick={onCancel}>
            Cancel
          </GradientButton>
          <GradientButton onClick={onConfirm}>{confirmLabel}</GradientButton>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create stats cards**

Create `src/components/admin/stats-cards.tsx`:
```tsx
interface Stat {
  label: string;
  value: string | number;
  change?: string;
}

interface StatsCardsProps {
  stats: Stat[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface-low rounded-xl border border-outline p-4"
        >
          <p className="text-xs text-on-surface-muted uppercase tracking-wider font-space-grotesk mb-1">
            {stat.label}
          </p>
          <p className="font-space-grotesk text-3xl font-bold">{stat.value}</p>
          {stat.change && (
            <p className="text-xs text-primary-dim mt-1">{stat.change}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create phase switcher**

Create `src/components/admin/phase-switcher.tsx`:
```tsx
"use client";

import { useState } from "react";
import { setPhase } from "@/lib/actions/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Phase } from "@/lib/types";

interface PhaseSwitcherProps {
  currentPhase: Phase;
}

const PHASES: { key: Phase; label: string }[] = [
  { key: "submission", label: "Submission" },
  { key: "browsing", label: "Browsing" },
  { key: "voting", label: "Voting" },
  { key: "results", label: "Results" },
];

export function PhaseSwitcher({ currentPhase }: PhaseSwitcherProps) {
  const [confirming, setConfirming] = useState<Phase | null>(null);
  const currentIndex = PHASES.findIndex((p) => p.key === currentPhase);

  async function handleConfirm() {
    if (!confirming) return;
    await setPhase(confirming);
    setConfirming(null);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {PHASES.map((phase, i) => {
          const isActive = phase.key === currentPhase;
          const isPast = i < currentIndex;
          const isNext = i === currentIndex + 1;

          return (
            <button
              key={phase.key}
              onClick={() => isNext && setConfirming(phase.key)}
              disabled={!isNext}
              className={`px-4 py-2 rounded-lg font-space-grotesk text-xs uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-gradient-to-r from-primary to-secondary text-white"
                  : isPast
                    ? "bg-primary/15 text-primary-dim"
                    : isNext
                      ? "bg-surface-high text-on-surface border border-outline hover:border-primary cursor-pointer"
                      : "bg-surface-high/30 text-on-surface-muted/40"
              } ${!isNext ? "cursor-default" : ""}`}
            >
              {phase.label}
            </button>
          );
        })}
      </div>

      {confirming && (
        <ConfirmDialog
          title={`Switch to ${PHASES.find((p) => p.key === confirming)?.label}?`}
          message="This action cannot be undone. The phase will change immediately for all users."
          confirmLabel="Switch Phase"
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 5: Create projects table**

Create `src/components/admin/projects-table.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/lib/actions/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ProjectWithTeam } from "@/lib/types";

interface ProjectsTableProps {
  projects: ProjectWithTeam[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    if (!deleting) return;
    await deleteProject(deleting);
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <div className="bg-surface-low rounded-xl border border-outline overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline">
              <th className="text-left text-xs uppercase tracking-wider text-on-surface-muted font-space-grotesk p-4">
                Project Title
              </th>
              <th className="text-left text-xs uppercase tracking-wider text-on-surface-muted font-space-grotesk p-4">
                Status
              </th>
              <th className="text-left text-xs uppercase tracking-wider text-on-surface-muted font-space-grotesk p-4">
                Team
              </th>
              <th className="text-right text-xs uppercase tracking-wider text-on-surface-muted font-space-grotesk p-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-outline/50 hover:bg-surface-high/30">
                <td className="p-4">
                  <p className="font-space-grotesk font-bold text-sm">
                    {project.name}
                  </p>
                </td>
                <td className="p-4">
                  <span
                    className={`text-xs font-space-grotesk uppercase px-2 py-0.5 rounded ${
                      project.is_submitted
                        ? "bg-primary/15 text-primary-dim"
                        : "bg-secondary/15 text-secondary"
                    }`}
                  >
                    {project.is_submitted ? "Submitted" : "Draft"}
                  </span>
                </td>
                <td className="p-4 text-sm text-on-surface-muted">
                  {project.team.map((m) => m.display_name).join(", ")}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setDeleting(project.id)}
                    className="text-secondary/60 hover:text-secondary text-xs font-space-grotesk uppercase cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete Project?"
          message="This will permanently delete the project, all its files, and all votes for it."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 6: Create admin layout**

Create `src/app/(admin)/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getCurrentUser, getAppSettings } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getAppSettings(),
  ]);

  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar user={user} currentPhase={settings.current_phase} />
      <main className="ml-60 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 7: Create admin dashboard page**

Create `src/app/(admin)/admin/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/utils";
import { StatsCards } from "@/components/admin/stats-cards";
import { PhaseSwitcher } from "@/components/admin/phase-switcher";
import { ProjectsTable } from "@/components/admin/projects-table";
import type { ProjectWithTeam } from "@/lib/types";

export default async function AdminPage() {
  const supabase = await createClient();
  const settings = await getAppSettings();

  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("is_submitted", true);

  const { count: participantCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "participant");

  const { count: voteCount } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true });

  // Unique voters
  const { data: voters } = await supabase
    .from("votes")
    .select("voter_id")
    .limit(1000);

  const uniqueVoters = new Set(voters?.map((v) => v.voter_id)).size;
  const maxVoters = participantCount || 1;
  const completion = Math.round((uniqueVoters / maxVoters) * 100);

  const { data: projects } = await supabase
    .from("projects")
    .select("*, team:profiles(id, display_name, avatar_url)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-space-grotesk text-4xl font-bold mb-2">
            Operational Overview
          </h1>
          <p className="text-on-surface-muted">
            Welcome back, Administrator. System status is nominal.
          </p>
        </div>
        <PhaseSwitcher currentPhase={settings.current_phase} />
      </div>

      <StatsCards
        stats={[
          { label: "Total Projects", value: projectCount || 0 },
          { label: "Participants", value: participantCount || 0 },
          { label: "Votes Cast", value: voteCount || 0 },
          { label: "Completion %", value: `${completion}%` },
        ]}
      />

      <div className="mt-8">
        <h2 className="font-space-grotesk text-xl font-bold mb-4">
          Project Manifest
        </h2>
        <ProjectsTable projects={(projects as ProjectWithTeam[]) || []} />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create admin results page with Excel export**

Create `src/app/(admin)/admin/results/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { exportResults } from "@/lib/actions/admin";
import { GradientButton } from "@/components/ui/gradient-button";

export default function AdminResultsPage() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const base64 = await exportResults();
      const blob = new Blob(
        [Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hackathon-results.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-space-grotesk text-4xl font-bold">Results</h1>
        <GradientButton onClick={handleExport} disabled={exporting}>
          {exporting ? "Generating..." : "Download Excel Report"}
        </GradientButton>
      </div>
      <p className="text-on-surface-muted">
        Export includes 3 sheets: Results (ranked), All Votes (individual), Projects (data dump).
      </p>
    </div>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add src/app/\(admin\)/ src/components/admin/ src/components/ui/confirm-dialog.tsx src/lib/actions/admin.ts
git commit -m "feat: add admin panel with dashboard, phase switcher, project table, and Excel export"
```

---

## Task 13: Invite Users Script

**Files:**
- Create: `scripts/invite-users.ts`

- [ ] **Step 1: Create batch invite script**

Create `scripts/invite-users.ts`:
```ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const emails = [
  // Add participant emails here
  // "jan.kowalski@spyrosoft.com",
  // "anna.nowak@spyrosoft.com",
];

async function main() {
  console.log(`Inviting ${emails.length} users...\n`);

  for (const email of emails) {
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    });

    if (error) {
      console.error(`✗ ${email}: ${error.message}`);
    } else {
      console.log(`✓ ${email}: invited`);
    }
  }

  console.log("\nDone!");
}

main();
```

- [ ] **Step 2: Add script to package.json**

Add to `package.json` scripts:
```json
"invite": "npx tsx scripts/invite-users.ts"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/ package.json
git commit -m "feat: add batch user invite script"
```

---

## Task 14: Deploy & Final Polish

**Files:**
- Modify: various files for production readiness

- [ ] **Step 1: Create Supabase project on supabase.com**

Go to supabase.com → create project "spyrosoft-ai-hackathon" → copy URL + anon key + service role key → update `.env.local`.

- [ ] **Step 2: Run migrations on production Supabase**

```bash
npx supabase db push --linked
```

- [ ] **Step 3: Configure auth settings in Supabase dashboard**

- Enable magic link auth
- Set redirect URLs: `https://your-domain.vercel.app/auth/callback`
- Set email template

- [ ] **Step 4: Deploy to Vercel**

```bash
npx vercel --prod
```

Set environment variables in Vercel dashboard.

- [ ] **Step 5: Set admin user**

In Supabase SQL editor:
```sql
update profiles set role = 'admin' where email = 'your-admin@spyrosoft.com';
```

- [ ] **Step 6: Test full flow**

1. Open app → see login page
2. Send magic link → check email → click → logged in
3. Create project → fill form → upload video → submit
4. Browse projects → open detail modal → watch in feed
5. Admin: switch to voting → vote → switch to results
6. Export Excel

- [ ] **Step 7: Commit any fixes**

```bash
git add -A
git commit -m "chore: production configuration and final polish"
```
