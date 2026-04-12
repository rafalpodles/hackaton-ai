# Multi-Hackathon Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the single-hackathon app into a multi-hackathon platform with self-registration, dynamic voting categories, and per-hackathon admin delegation.

**Architecture:** "Hackathon as namespace" — new `hackathons` table becomes the top-level entity. All per-hackathon data (projects, teams, votes, participants) scoped via `hackathon_id`. Profiles remain global. Routing changes from `/(main)/*` to `/h/[slug]/*`. Landing page with hackathon tiles replaces direct project grid.

**Tech Stack:** Next.js 15, Supabase (PostgreSQL + Auth + Storage), TypeScript, Tailwind CSS

**Branch:** `v2`

**Spec:** `docs/superpowers/specs/2026-04-12-multi-hackathon-platform-design.md`

---

## File Structure

### New files

```
supabase/migrations/016_multi_hackathon.sql          — DB migration (new tables, column additions, data migration)
supabase/migrations/017_multi_hackathon_cleanup.sql   — Drop old columns/tables after migration

src/lib/types.ts                                      — Updated types (Hackathon, HackathonCategory, HackathonParticipant)
src/lib/utils.ts                                      — Updated queries (hackathon-scoped)
src/lib/hackathon-context.ts                          — React context for current hackathon

src/app/(auth)/register/page.tsx                      — Self-registration page
src/lib/actions/register.ts                           — Registration server action

src/app/(landing)/layout.tsx                          — Landing page layout (no sidebar)
src/app/(landing)/page.tsx                            — Landing page with hackathon tiles
src/components/landing/hackathon-tile.tsx              — Hackathon card component
src/lib/actions/hackathon-join.ts                     — Join hackathon server action

src/app/h/[slug]/layout.tsx                           — Per-hackathon layout (sidebar + banner)
src/app/h/[slug]/page.tsx                             — Project grid (moved from (main)/)
src/app/h/[slug]/feed/page.tsx                        — Video feed
src/app/h/[slug]/vote/page.tsx                        — Voting
src/app/h/[slug]/results/page.tsx                     — Results
src/app/h/[slug]/onboarding/page.tsx                  — Team/solo choice
src/app/h/[slug]/team/page.tsx                        — Team management
src/app/h/[slug]/my-project/page.tsx                  — Project submission
src/app/h/[slug]/ideas/page.tsx                       — Ideas (per hackathon)

src/app/(admin)/admin/page.tsx                        — Updated: hackathon list + global stats
src/app/(admin)/admin/hackathons/new/page.tsx          — Create hackathon form
src/app/(admin)/admin/hackathons/[slug]/page.tsx       — Hackathon settings
src/lib/actions/hackathons.ts                         — Hackathon CRUD server actions
```

### Modified files

```
src/lib/supabase/middleware.ts                        — New public paths, hackathon-scoped onboarding check
src/lib/actions/teams.ts                              — Read team_id from hackathon_participants instead of profiles
src/lib/actions/projects.ts                           — Read project_id from hackathon_participants instead of profiles
src/lib/actions/voting.ts                             — Read settings from hackathons, dynamic categories
src/lib/actions/admin.ts                              — Scoped to hackathon, settings from hackathons table
src/components/layout/sidebar.tsx                     — Hackathon-aware navigation
src/components/layout/countdown-banner.tsx            — No changes needed (already prop-driven)
src/components/voting/voting-board.tsx                — Dynamic categories
```

### Deleted files (after migration)

```
src/app/(main)/                                       — Entire route group replaced by /h/[slug]/
```

---

## Phase 1: Database Migration

### Task 1: Create migration — new tables and columns

**Files:**
- Create: `supabase/migrations/016_multi_hackathon.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- ============================================
-- PHASE 1: Create new tables
-- ============================================

-- Hackathons table (replaces app_settings)
CREATE TABLE public.hackathons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  hackathon_date timestamptz,
  submission_deadline timestamptz,
  submission_open boolean DEFAULT false,
  voting_open boolean DEFAULT false,
  status text DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'voting', 'finished')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.hackathons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Dynamic voting categories per hackathon
CREATE TABLE public.hackathon_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  slug text NOT NULL,
  label text NOT NULL,
  display_order int DEFAULT 0,
  UNIQUE(hackathon_id, slug)
);

-- Per-hackathon participation (replaces profiles.team_id/project_id/is_solo)
CREATE TABLE public.hackathon_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'participant'
    CHECK (role IN ('participant', 'admin')),
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  is_solo boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(hackathon_id, user_id)
);

CREATE INDEX idx_hackathon_participants_user ON public.hackathon_participants(user_id);
CREATE INDEX idx_hackathon_participants_hackathon ON public.hackathon_participants(hackathon_id);

-- Registration rate limiting
CREATE TABLE public.registration_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_registration_attempts_ip ON public.registration_attempts(ip_address, created_at);

-- ============================================
-- PHASE 2: Add hackathon_id to existing tables
-- ============================================

ALTER TABLE public.projects ADD COLUMN hackathon_id uuid REFERENCES public.hackathons(id) ON DELETE CASCADE;
ALTER TABLE public.teams ADD COLUMN hackathon_id uuid REFERENCES public.hackathons(id) ON DELETE CASCADE;
ALTER TABLE public.votes ADD COLUMN hackathon_id uuid REFERENCES public.hackathons(id) ON DELETE CASCADE;

-- ============================================
-- PHASE 3: Migrate existing data
-- ============================================

-- Create hackathon #1 from app_settings
INSERT INTO public.hackathons (id, name, slug, description, hackathon_date, submission_deadline, submission_open, voting_open, status)
SELECT
  gen_random_uuid(),
  'Spyrosoft AI Hackathon #1',
  'ai-hackathon-1',
  'Pierwszy Spyrosoft AI Hackathon',
  hackathon_date,
  submission_deadline,
  submission_open,
  voting_open,
  'finished'
FROM public.app_settings
WHERE id = 1;

-- Set hackathon_id on existing data
UPDATE public.projects SET hackathon_id = (SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1');
UPDATE public.teams SET hackathon_id = (SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1');
UPDATE public.votes SET hackathon_id = (SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1');

-- Create hackathon_categories for hackathon #1
INSERT INTO public.hackathon_categories (hackathon_id, slug, label, display_order) VALUES
  ((SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1'), 'concept_to_reality', 'Droga od koncepcji do realizacji ⚡', 1),
  ((SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1'), 'creativity', 'Kreatywność pomysłu ✨', 2),
  ((SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1'), 'usefulness', 'Przydatność / wartość użytkowa ⚙️', 3);

-- Migrate participants from profiles
INSERT INTO public.hackathon_participants (hackathon_id, user_id, role, team_id, project_id, is_solo)
SELECT
  (SELECT id FROM public.hackathons WHERE slug = 'ai-hackathon-1'),
  p.id,
  p.role,
  p.team_id,
  p.project_id,
  p.is_solo
FROM public.profiles p
WHERE p.team_id IS NOT NULL OR p.project_id IS NOT NULL OR p.is_solo = true;

-- ============================================
-- PHASE 4: Make hackathon_id NOT NULL after backfill
-- ============================================

ALTER TABLE public.projects ALTER COLUMN hackathon_id SET NOT NULL;
ALTER TABLE public.teams ALTER COLUMN hackathon_id SET NOT NULL;
ALTER TABLE public.votes ALTER COLUMN hackathon_id SET NOT NULL;

-- Update votes unique constraint
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_voter_id_category_key;
ALTER TABLE public.votes ADD CONSTRAINT votes_voter_hackathon_category_key UNIQUE(voter_id, hackathon_id, category);

-- Remove CHECK constraint on votes.category (now dynamic via hackathon_categories)
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_category_check;

-- Add indexes
CREATE INDEX idx_projects_hackathon ON public.projects(hackathon_id);
CREATE INDEX idx_teams_hackathon ON public.teams(hackathon_id);
CREATE INDEX idx_votes_hackathon ON public.votes(hackathon_id);
```

- [ ] **Step 2: Run the migration**

```bash
npx supabase db push
```

Expected: Migration applies successfully, hackathon #1 created with all existing data migrated.

- [ ] **Step 3: Verify data migration**

```bash
npx supabase db execute --sql "SELECT name, slug, status FROM hackathons;"
npx supabase db execute --sql "SELECT COUNT(*) FROM hackathon_participants;"
npx supabase db execute --sql "SELECT COUNT(*) FROM hackathon_categories;"
npx supabase db execute --sql "SELECT COUNT(*) FROM projects WHERE hackathon_id IS NOT NULL;"
```

Expected: 1 hackathon, participants migrated, 3 categories, all projects have hackathon_id.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/016_multi_hackathon.sql
git commit -m "feat: add multi-hackathon schema with data migration for hackathon #1"
```

### Task 2: Create cleanup migration — drop old columns/table

**Files:**
- Create: `supabase/migrations/017_multi_hackathon_cleanup.sql`

- [ ] **Step 1: Write the cleanup migration**

```sql
-- Drop per-hackathon columns from profiles (now in hackathon_participants)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS team_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_solo;

-- Drop app_settings (replaced by hackathons table)
DROP TABLE IF EXISTS public.app_settings;
```

- [ ] **Step 2: Run the migration**

```bash
npx supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/017_multi_hackathon_cleanup.sql
git commit -m "feat: drop profiles.team_id/project_id/is_solo and app_settings table"
```

---

## Phase 2: Types and Core Utilities

### Task 3: Update TypeScript types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Update types**

Replace the full file content:

```typescript
export type Role = "participant" | "admin";

export interface Hackathon {
  id: string;
  name: string;
  slug: string;
  description: string;
  hackathon_date: string | null;
  submission_deadline: string | null;
  submission_open: boolean;
  voting_open: boolean;
  status: "upcoming" | "active" | "voting" | "finished";
  created_at: string;
  updated_at: string;
}

export interface HackathonCategory {
  id: string;
  hackathon_id: string;
  slug: string;
  label: string;
  display_order: number;
}

export interface HackathonParticipant {
  id: string;
  hackathon_id: string;
  user_id: string;
  role: Role;
  team_id: string | null;
  project_id: string | null;
  is_solo: boolean;
  joined_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: Role;
  openrouter_api_key: string | null;
  openrouter_key_hash: string | null;
  api_key_requested: boolean;
  api_key_requested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  leader_id: string;
  hackathon_id: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamWithMembers extends Team {
  members: Pick<Profile, "id" | "display_name" | "avatar_url" | "email">[];
}

export interface TeamRequest {
  id: string;
  user_id: string;
  team_id: string;
  created_at: string;
}

export interface TeamRequestWithUser extends TeamRequest {
  user: Pick<Profile, "id" | "display_name" | "email">;
}

export interface TeamRequestWithTeam extends TeamRequest {
  team: Pick<Team, "id" | "name">;
}

export interface Project {
  id: string;
  name: string;
  hackathon_id: string;
  description: string;
  idea_origin: string;
  journey: string;
  tech_stack: string[];
  video_url: string | null;
  video_duration: number | null;
  pdf_url: string | null;
  thumbnail_url: string | null;
  repo_url: string | null;
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
  hackathon_id: string;
  category: string;
  created_at: string;
}

export interface VoteResult {
  project_id: string;
  project_name: string;
  team_members: string[];
  category: string;
  vote_count: number;
}

export interface HackathonWithStats extends Hackathon {
  project_count: number;
  participant_count: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: update types for multi-hackathon support"
```

### Task 4: Update core utilities

**Files:**
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Update getCurrentUser and add hackathon helpers**

Replace the full file:

```typescript
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProjectWithTeam, Hackathon, HackathonParticipant } from "@/lib/types";

export const getCurrentUser = cache(async (): Promise<Profile | null> => {
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
});

export const getHackathonBySlug = cache(async (slug: string): Promise<Hackathon | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hackathons")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
});

export const getParticipant = cache(async (hackathonId: string, userId: string): Promise<HackathonParticipant | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hackathon_participants")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", userId)
    .single();
  return data;
});

export const getSubmittedProjects = cache(async (hackathonId: string): Promise<ProjectWithTeam[]> => {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .eq("is_submitted", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load projects: ${error.message}`);
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  // Get team members (projects owned by teams)
  const { data: teams } = await supabase
    .from("teams")
    .select("project_id, members:profiles!hackathon_participants(id, display_name, avatar_url)")
    .eq("hackathon_id", hackathonId)
    .in("project_id", projectIds);

  // Get solo users
  const { data: soloParticipants } = await supabase
    .from("hackathon_participants")
    .select("project_id, user:profiles!user_id(id, display_name, avatar_url)")
    .eq("hackathon_id", hackathonId)
    .eq("is_solo", true)
    .in("project_id", projectIds);

  const teamMap = new Map<string, Pick<Profile, "id" | "display_name" | "avatar_url">[]>();

  for (const t of teams ?? []) {
    if (t.project_id) {
      teamMap.set(t.project_id, (t.members ?? []) as Pick<Profile, "id" | "display_name" | "avatar_url">[]);
    }
  }

  for (const p of soloParticipants ?? []) {
    if (p.project_id && p.user) {
      const u = p.user as unknown as Pick<Profile, "id" | "display_name" | "avatar_url">;
      teamMap.set(p.project_id, [u]);
    }
  }

  return projects.map((p) => ({
    ...p,
    team: teamMap.get(p.id) ?? [],
  }));
});
```

Note: The `getSubmittedProjects` query for team members via `hackathon_participants` may need adjustment based on how Supabase handles the join. The exact query syntax should be verified during implementation. The key change is that team membership comes from `hackathon_participants` instead of `profiles.team_id`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add hackathon-scoped utility functions"
```

### Task 5: Create hackathon context provider

**Files:**
- Create: `src/lib/hackathon-context.ts`

- [ ] **Step 1: Create the context**

```typescript
"use client";

import { createContext, useContext } from "react";
import type { Hackathon, HackathonParticipant } from "@/lib/types";

interface HackathonContextValue {
  hackathon: Hackathon;
  participant: HackathonParticipant | null;
}

export const HackathonContext = createContext<HackathonContextValue | null>(null);

export function useHackathon() {
  const ctx = useContext(HackathonContext);
  if (!ctx) throw new Error("useHackathon must be used within HackathonContext.Provider");
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/hackathon-context.ts
git commit -m "feat: add hackathon context provider"
```

---

## Phase 3: Authentication — Self-Registration

### Task 6: Create registration server action

**Files:**
- Create: `src/lib/actions/register.ts`

- [ ] **Step 1: Write the server action**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const EMAIL_REGEX = /^[a-zA-Z]{1,4}@(spyro-soft\.com|vm\.spyro-soft\.com)$/;
const MAX_ATTEMPTS_PER_HOUR = 5;

export async function registerUser(email: string, password: string) {
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Nieprawidłowy email. Wymagany format: akronim@spyro-soft.com lub akronim@vm.spyro-soft.com" };
  }

  if (!password || password.length < 6) {
    return { error: "Hasło musi mieć co najmniej 6 znaków." };
  }

  const supabase = await createClient();

  // Rate limit check
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const { count } = await supabase
    .from("registration_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", new Date(Date.now() - 3600000).toISOString());

  if ((count ?? 0) >= MAX_ATTEMPTS_PER_HOUR) {
    return { error: "Zbyt wiele prób rejestracji. Spróbuj ponownie za godzinę." };
  }

  // Record attempt
  await supabase.from("registration_attempts").insert({ ip_address: ip });

  // Check if email already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (existingProfile) {
    return { error: "Konto z tym adresem email już istnieje." };
  }

  // Create user (email_confirm: true skips email verification)
  const { error } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      return { error: "Konto z tym adresem email już istnieje." };
    }
    return { error: "Nie udało się utworzyć konta. Spróbuj ponownie." };
  }

  return { success: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/register.ts
git commit -m "feat: add self-registration server action with email validation and rate limiting"
```

### Task 7: Create registration page

**Files:**
- Create: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Write the registration page**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerUser } from "@/lib/actions/register";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(email, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Auto-login after registration
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (loginError) {
        // Account created but login failed — redirect to login page
        router.push("/login?registered=true");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Coś poszło nie tak. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8">
        <h1 className="mb-6 text-center font-space-grotesk text-2xl font-bold text-on-surface">
          Rejestracja
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-on-surface-muted">
              Email (akronim@spyro-soft.com)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="abc@spyro-soft.com"
              className="w-full rounded-lg border border-outline bg-surface-high px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-on-surface-muted">
              Hasło (min. 6 znaków)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-outline bg-surface-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-on-surface-muted">
              Powtórz hasło
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-outline bg-surface-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <GradientButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Tworzenie konta..." : "Zarejestruj się"}
          </GradientButton>
        </form>

        <p className="mt-4 text-center text-xs text-on-surface-muted">
          Masz już konto?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Zaloguj się
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
```

- [ ] **Step 2: Add link to registration from login page**

In `src/app/(auth)/login/page.tsx`, find the closing `</GlassCard>` and add before it:

```tsx
<p className="mt-4 text-center text-xs text-on-surface-muted">
  Nie masz konta?{" "}
  <Link href="/register" className="text-primary hover:underline">
    Zarejestruj się
  </Link>
</p>
```

Add `import Link from "next/link";` to imports.

- [ ] **Step 3: Update middleware — add /register to public paths**

In `src/lib/supabase/middleware.ts`, change:

```typescript
const publicPaths = ["/login", "/change-password", "/live"];
```

to:

```typescript
const publicPaths = ["/login", "/register", "/change-password", "/live"];
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/register/page.tsx src/app/\(auth\)/login/page.tsx src/lib/supabase/middleware.ts
git commit -m "feat: add self-registration with email validation and rate limiting"
```

---

## Phase 4: Middleware and Routing

### Task 8: Update middleware for multi-hackathon routing

**Files:**
- Modify: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Rewrite middleware**

Replace the full file:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getRedirectUrl(request: NextRequest, pathname: string): URL {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;
  return new URL(pathname, origin);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
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

  const pathname = request.nextUrl.pathname;

  // Public paths — no auth required
  const publicPaths = ["/login", "/register", "/change-password", "/live"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  // Landing page is public
  if (pathname === "/") return supabaseResponse;

  // Global pages accessible to logged-in users
  const globalAuthPaths = ["/rules", "/guide", "/faq", "/prompts", "/profile", "/guestbook"];
  const isGlobalAuthPath = globalAuthPaths.some((p) => pathname.startsWith(p));

  if (!user && !isPublicPath) {
    return NextResponse.redirect(getRedirectUrl(request, "/login"));
  }

  if (user) {
    const mustChangePassword = user.user_metadata?.must_change_password === true;

    if (mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(getRedirectUrl(request, "/change-password"));
    }

    if (!mustChangePassword && pathname === "/change-password") {
      return NextResponse.redirect(getRedirectUrl(request, "/"));
    }

    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(getRedirectUrl(request, "/"));
    }

    // Per-hackathon routes: /h/[slug]/*
    const hackathonMatch = pathname.match(/^\/h\/([^/]+)(\/.*)?$/);
    if (hackathonMatch) {
      const slug = hackathonMatch[1];
      const subpath = hackathonMatch[2] ?? "/";

      // Check hackathon exists
      const { data: hackathon } = await supabase
        .from("hackathons")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!hackathon) {
        return NextResponse.redirect(getRedirectUrl(request, "/"));
      }

      // Check participation for protected routes
      const protectedSubpaths = ["/onboarding", "/team", "/my-project", "/vote"];
      const needsParticipation = protectedSubpaths.some((p) => subpath.startsWith(p));

      if (needsParticipation) {
        const { data: participant } = await supabase
          .from("hackathon_participants")
          .select("id, team_id, is_solo")
          .eq("hackathon_id", hackathon.id)
          .eq("user_id", user.id)
          .single();

        if (!participant) {
          return NextResponse.redirect(getRedirectUrl(request, "/"));
        }

        // Onboarding check for team/my-project
        const needsOnboarding = ["/team", "/my-project"].some((p) => subpath.startsWith(p));
        if (needsOnboarding && !participant.team_id && !participant.is_solo) {
          return NextResponse.redirect(getRedirectUrl(request, `/h/${slug}/onboarding`));
        }
      }
    }

    // Admin routes
    if (pathname.startsWith("/admin")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        return NextResponse.redirect(getRedirectUrl(request, "/"));
      }
    }
  }

  return supabaseResponse;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/middleware.ts
git commit -m "feat: rewrite middleware for multi-hackathon routing"
```

---

## Phase 5: Landing Page

### Task 9: Create landing page layout and page

**Files:**
- Create: `src/app/(landing)/layout.tsx`
- Create: `src/app/(landing)/page.tsx`
- Create: `src/components/landing/hackathon-tile.tsx`
- Create: `src/lib/actions/hackathon-join.ts`
- Delete: `src/app/(main)/page.tsx` (old home page — moved to `/h/[slug]/`)

- [ ] **Step 1: Create landing layout**

```typescript
// src/app/(landing)/layout.tsx
import Link from "next/link";
import { getCurrentUser } from "@/lib/utils";

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-outline px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-space-grotesk text-xl font-bold text-on-surface">
            Spyrosoft Hackathons
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/profile" className="text-sm text-on-surface-muted hover:text-on-surface">
                  {user.display_name}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-on-surface-muted hover:text-on-surface">
                  Zaloguj się
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-bold text-white"
                >
                  Zarejestruj się
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create hackathon tile component**

```typescript
// src/components/landing/hackathon-tile.tsx
"use client";

import Link from "next/link";
import { useTransition } from "react";
import { joinHackathon } from "@/lib/actions/hackathon-join";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";

interface HackathonTileProps {
  hackathon: {
    id: string;
    name: string;
    slug: string;
    description: string;
    hackathon_date: string | null;
    status: string;
    project_count: number;
    participant_count: number;
  };
  isParticipant: boolean;
  isLoggedIn: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  upcoming: { label: "Nadchodzący", color: "text-primary" },
  active: { label: "W trakcie", color: "text-green-400" },
  voting: { label: "Głosowanie", color: "text-amber-400" },
  finished: { label: "Zakończony", color: "text-on-surface-muted" },
};

export function HackathonTile({ hackathon, isParticipant, isLoggedIn }: HackathonTileProps) {
  const [isPending, startTransition] = useTransition();
  const statusInfo = STATUS_LABELS[hackathon.status] ?? STATUS_LABELS.upcoming;

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleJoin = () => {
    startTransition(() => joinHackathon(hackathon.id));
  };

  return (
    <GlassCard className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <h2 className="font-space-grotesk text-xl font-bold text-on-surface">
          {hackathon.name}
        </h2>
        <span className={`font-space-grotesk text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {hackathon.hackathon_date && (
        <p className="text-sm text-on-surface-muted">
          {formatDate(hackathon.hackathon_date)}
        </p>
      )}

      {hackathon.description && (
        <p className="text-sm text-on-surface-muted">{hackathon.description}</p>
      )}

      <div className="flex gap-4 text-xs text-on-surface-muted">
        <span>{hackathon.project_count} projektów</span>
        <span>{hackathon.participant_count} uczestników</span>
      </div>

      <div className="mt-auto pt-2">
        {!isLoggedIn ? (
          hackathon.status !== "finished" ? (
            <Link href="/register">
              <GradientButton className="w-full">Zarejestruj się żeby dołączyć</GradientButton>
            </Link>
          ) : (
            <Link href={`/h/${hackathon.slug}`}>
              <GradientButton className="w-full">Przeglądaj projekty</GradientButton>
            </Link>
          )
        ) : isParticipant ? (
          <Link href={`/h/${hackathon.slug}`}>
            <GradientButton className="w-full">
              {hackathon.status === "finished" ? "Zobacz wyniki" : "Wejdź"}
            </GradientButton>
          </Link>
        ) : hackathon.status !== "finished" ? (
          <GradientButton className="w-full" onClick={handleJoin} disabled={isPending}>
            {isPending ? "Dołączanie..." : "Dołącz"}
          </GradientButton>
        ) : (
          <Link href={`/h/${hackathon.slug}`}>
            <GradientButton className="w-full">Przeglądaj projekty</GradientButton>
          </Link>
        )}
      </div>
    </GlassCard>
  );
}
```

- [ ] **Step 3: Create join hackathon action**

```typescript
// src/lib/actions/hackathon-join.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function joinHackathon(hackathonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Nie jesteś zalogowany");

  // Check hackathon exists and is joinable
  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("id, slug, status")
    .eq("id", hackathonId)
    .single();

  if (!hackathon) throw new Error("Hackathon nie istnieje");
  if (hackathon.status === "finished") throw new Error("Hackathon jest zakończony");

  // Check not already a participant
  const { data: existing } = await supabase
    .from("hackathon_participants")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    redirect(`/h/${hackathon.slug}`);
  }

  const { error } = await supabase
    .from("hackathon_participants")
    .insert({ hackathon_id: hackathonId, user_id: user.id });

  if (error) throw new Error("Nie udało się dołączyć do hackathonu");

  revalidatePath("/");
  redirect(`/h/${hackathon.slug}/onboarding`);
}
```

- [ ] **Step 4: Create landing page**

```typescript
// src/app/(landing)/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import { HackathonTile } from "@/components/landing/hackathon-tile";

export default async function LandingPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: hackathons } = await supabase
    .from("hackathons")
    .select("*")
    .order("created_at", { ascending: false });

  // Get participant status for logged-in user
  let participantMap = new Map<string, boolean>();
  if (user) {
    const { data: participations } = await supabase
      .from("hackathon_participants")
      .select("hackathon_id")
      .eq("user_id", user.id);

    for (const p of participations ?? []) {
      participantMap.set(p.hackathon_id, true);
    }
  }

  // Get stats per hackathon
  const statsMap = new Map<string, { project_count: number; participant_count: number }>();
  for (const h of hackathons ?? []) {
    const [{ count: projectCount }, { count: participantCount }] = await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("hackathon_id", h.id),
      supabase.from("hackathon_participants").select("*", { count: "exact", head: true }).eq("hackathon_id", h.id),
    ]);
    statsMap.set(h.id, {
      project_count: projectCount ?? 0,
      participant_count: participantCount ?? 0,
    });
  }

  const upcoming = (hackathons ?? []).filter((h) => h.status !== "finished");
  const finished = (hackathons ?? []).filter((h) => h.status === "finished");

  return (
    <div className="space-y-10 py-8">
      <div className="text-center">
        <h1 className="font-space-grotesk text-4xl font-bold text-on-surface">
          Spyrosoft Hackathons
        </h1>
        <p className="mt-2 text-on-surface-muted">
          Platforma do organizacji i przeglądania hackatonów Spyrosoft
        </p>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 font-space-grotesk text-xl font-semibold text-on-surface">
            Aktywne i nadchodzące
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((h) => (
              <HackathonTile
                key={h.id}
                hackathon={{ ...h, ...(statsMap.get(h.id) ?? { project_count: 0, participant_count: 0 }) }}
                isParticipant={participantMap.has(h.id)}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h2 className="mb-4 font-space-grotesk text-xl font-semibold text-on-surface">
            Archiwum
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {finished.map((h) => (
              <HackathonTile
                key={h.id}
                hackathon={{ ...h, ...(statsMap.get(h.id) ?? { project_count: 0, participant_count: 0 }) }}
                isParticipant={participantMap.has(h.id)}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </section>
      )}

      {(!hackathons || hackathons.length === 0) && (
        <p className="text-center text-on-surface-muted">
          Brak hackatonów. Wkrótce dodamy pierwszy!
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(landing\)/ src/components/landing/ src/lib/actions/hackathon-join.ts
git commit -m "feat: add landing page with hackathon tiles and join flow"
```

---

## Phase 6: Per-Hackathon Layout and Pages

### Task 10: Create per-hackathon layout

**Files:**
- Create: `src/app/h/[slug]/layout.tsx`

- [ ] **Step 1: Write the layout**

```typescript
import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug, getParticipant } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/sidebar";
import { CountdownBanner } from "@/components/layout/countdown-banner";
import { HackathonContext } from "@/lib/hackathon-context";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function HackathonLayout({ children, params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const participant = await getParticipant(hackathon.id, user.id);

  return (
    <HackathonContext.Provider value={{ hackathon, participant }}>
      <div className="min-h-screen">
        <Sidebar
          user={user}
          votingOpen={hackathon.voting_open}
          hackathonSlug={hackathon.slug}
        />
        <div className="lg:ml-60">
          {hackathon.hackathon_date && (
            <CountdownBanner
              hackathonDate={hackathon.hackathon_date}
              submissionDeadline={hackathon.submission_deadline ?? undefined}
              votingOpen={hackathon.voting_open}
            />
          )}
          <main className="p-4 pt-16 lg:p-8">{children}</main>
        </div>
      </div>
    </HackathonContext.Provider>
  );
}
```

Note: `HackathonContext.Provider` is used here server-side — this will need to be wrapped in a client component. During implementation, extract a `<HackathonProvider>` client component that accepts serializable props and provides the context.

- [ ] **Step 2: Commit**

```bash
git add src/app/h/
git commit -m "feat: add per-hackathon layout with sidebar and countdown banner"
```

### Task 11: Update sidebar for hackathon context

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add hackathonSlug prop and update navigation links**

Add `hackathonSlug?: string` to `SidebarProps`. When `hackathonSlug` is present, prefix per-hackathon links with `/h/${hackathonSlug}`. Keep global links (rules, guide, faq) without prefix.

Key changes:
- `SidebarProps` gets `hackathonSlug?: string`
- Navigation items become dynamic:

```typescript
const hackathonPrefix = hackathonSlug ? `/h/${hackathonSlug}` : "";

const hackathonItems = [
  { label: "Zespół", href: `${hackathonPrefix}/team` },
  { label: "Mój projekt", href: `${hackathonPrefix}/my-project` },
];

const galleryItems = [
  { label: "Projekty", href: `${hackathonPrefix}/` },
  { label: "Live", href: `${hackathonPrefix}/feed` },
];
```

Global items stay the same (no prefix):

```typescript
const startItems = [
  { label: "Garage Rules", href: "/rules" },
  { label: "Poradnik", href: "/guide" },
  { label: "Q&A", href: "/faq" },
  { label: "Pomysły na projekty", href: `${hackathonPrefix}/ideas` },
  { label: "Przydatne prompty", href: "/prompts" },
];
```

Vote CTA link changes to `${hackathonPrefix}/vote`.

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: make sidebar hackathon-aware with dynamic link prefixes"
```

### Task 12: Move pages from (main) to /h/[slug]/

**Files:**
- Create pages in `src/app/h/[slug]/` by adapting existing `(main)` pages
- Keep `(main)` global pages: rules, guide, faq, prompts, profile, guestbook

- [ ] **Step 1: Create project grid page**

Adapt `src/app/(main)/page.tsx` → `src/app/h/[slug]/page.tsx`. Key change: use `getSubmittedProjects(hackathon.id)` instead of `getSubmittedProjects()`.

- [ ] **Step 2: Create feed page**

Adapt `src/app/(main)/feed/page.tsx` → `src/app/h/[slug]/feed/page.tsx`.

- [ ] **Step 3: Create vote page**

Adapt `src/app/(main)/vote/page.tsx` → `src/app/h/[slug]/vote/page.tsx`. Key changes:
- Read `voting_open` from hackathon (passed via layout/context)
- Load categories from `hackathon_categories` instead of hardcoded
- Read own project from `hackathon_participants` instead of `profiles`

- [ ] **Step 4: Create results page**

Adapt `src/app/(main)/results/page.tsx` → `src/app/h/[slug]/results/page.tsx`. Scope votes query to `hackathon_id`.

- [ ] **Step 5: Create onboarding page**

Adapt `src/app/(main)/onboarding/page.tsx` → `src/app/h/[slug]/onboarding/page.tsx`. Key changes:
- Check `hackathon_participants` for team/solo status (not `profiles`)
- Filter teams by `hackathon_id`
- `createTeam` and `goSolo` need `hackathonId` parameter

- [ ] **Step 6: Create team page**

Adapt `src/app/(main)/team/page.tsx` → `src/app/h/[slug]/team/page.tsx`. Scope to hackathon.

- [ ] **Step 7: Create my-project page**

Adapt `src/app/(main)/my-project/page.tsx` → `src/app/h/[slug]/my-project/page.tsx`. Read settings from hackathon, project from `hackathon_participants`.

- [ ] **Step 8: Create ideas page**

Adapt `src/app/(main)/ideas/page.tsx` → `src/app/h/[slug]/ideas/page.tsx`.

- [ ] **Step 9: Commit**

```bash
git add src/app/h/
git commit -m "feat: add all per-hackathon pages (grid, feed, vote, results, onboarding, team, project, ideas)"
```

---

## Phase 7: Update Server Actions

### Task 13: Update teams actions

**Files:**
- Modify: `src/lib/actions/teams.ts`

- [ ] **Step 1: Add hackathonId parameter to all functions**

Every function that reads/writes `profiles.team_id` or `profiles.is_solo` must now read/write `hackathon_participants` instead:
- `createTeam(name, hackathonId)` — create team with `hackathon_id`, update `hackathon_participants.team_id`
- `goSolo(hackathonId)` — set `hackathon_participants.is_solo = true`
- `requestJoinTeam(teamId)` — no hackathonId needed (team is already scoped)
- `approveRequest(requestId)` — update `hackathon_participants.team_id` instead of `profiles.team_id`
- `leaveTeam(hackathonId)` — update `hackathon_participants`
- `removeMember(memberId, hackathonId)` — update `hackathon_participants`
- `deleteTeam(hackathonId)` — update all team members' `hackathon_participants`

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/teams.ts
git commit -m "feat: scope team actions to hackathon via hackathon_participants"
```

### Task 14: Update projects actions

**Files:**
- Modify: `src/lib/actions/projects.ts`

- [ ] **Step 1: Update getUserProjectId to read from hackathon_participants**

Change `getUserProjectId` to accept `hackathonId` and query `hackathon_participants` instead of `profiles`:

```typescript
async function getUserProjectId(supabase: any, userId: string, hackathonId: string) {
  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("project_id, team_id, is_solo")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", userId)
    .single();

  if (!participant) throw new Error("Nie jesteś uczestnikiem tego hackathonu");

  if (participant.is_solo && !participant.team_id) {
    return { projectId: participant.project_id, isSolo: true, teamId: null };
  }

  if (participant.team_id) {
    const { data: team } = await supabase
      .from("teams")
      .select("project_id, leader_id")
      .eq("id", participant.team_id)
      .single();
    return { projectId: team?.project_id ?? null, isSolo: false, teamId: participant.team_id, isLeader: team?.leader_id === userId };
  }

  return { projectId: null, isSolo: false, teamId: null };
}
```

All project actions (`createProject`, `updateProject`, `submitProject`) need `hackathonId` parameter. New projects get `hackathon_id` on insert.

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/projects.ts
git commit -m "feat: scope project actions to hackathon"
```

### Task 15: Update voting actions

**Files:**
- Modify: `src/lib/actions/voting.ts`

- [ ] **Step 1: Make castVotes hackathon-aware**

Changes:
- `castVotes(votes, hackathonId)` — accept hackathon ID
- Read `voting_open` from `hackathons` table instead of `app_settings`
- Load valid categories from `hackathon_categories` instead of hardcoded array
- Determine own project from `hackathon_participants` instead of `profiles`
- Insert votes with `hackathon_id`

```typescript
export async function castVotes(votes: { category: string; project_id: string }[], hackathonId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musisz być zalogowany, aby głosować." };

  // Check voting is open
  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("voting_open")
    .eq("id", hackathonId)
    .single();

  if (!hackathon?.voting_open) return { error: "Głosowanie nie jest otwarte." };

  // Load valid categories
  const { data: categories } = await supabase
    .from("hackathon_categories")
    .select("slug")
    .eq("hackathon_id", hackathonId);

  const validSlugs = new Set((categories ?? []).map((c) => c.slug));
  // ... validate votes against validSlugs, check own project via hackathon_participants, insert with hackathon_id
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/voting.ts
git commit -m "feat: scope voting to hackathon with dynamic categories"
```

### Task 16: Update admin actions

**Files:**
- Modify: `src/lib/actions/admin.ts`
- Create: `src/lib/actions/hackathons.ts`

- [ ] **Step 1: Create hackathon CRUD actions**

```typescript
// src/lib/actions/hackathons.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Brak dostępu");
  return user;
}

export async function createHackathon(data: {
  name: string;
  slug: string;
  description: string;
  hackathon_date: string | null;
}) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("hackathons").insert({
    name: data.name,
    slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    description: data.description,
    hackathon_date: data.hackathon_date,
  });

  if (error) {
    if (error.message.includes("duplicate")) throw new Error("Slug jest już zajęty");
    throw new Error("Nie udało się utworzyć hackathonu");
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateHackathon(hackathonId: string, data: Partial<{
  name: string;
  description: string;
  hackathon_date: string | null;
  submission_deadline: string | null;
  submission_open: boolean;
  voting_open: boolean;
  status: string;
}>) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("hackathons")
    .update(data)
    .eq("id", hackathonId);

  if (error) throw new Error("Nie udało się zaktualizować hackathonu");
  revalidatePath("/admin");
}

export async function addHackathonCategory(hackathonId: string, slug: string, label: string, displayOrder: number) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("hackathon_categories").insert({
    hackathon_id: hackathonId,
    slug,
    label,
    display_order: displayOrder,
  });

  if (error) throw new Error("Nie udało się dodać kategorii");
  revalidatePath("/admin");
}

export async function removeHackathonCategory(categoryId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("hackathon_categories").delete().eq("id", categoryId);
  if (error) throw new Error("Nie udało się usunąć kategorii");
  revalidatePath("/admin");
}

export async function delegateHackathonAdmin(hackathonId: string, userId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("hackathon_participants")
    .update({ role: "admin" })
    .eq("hackathon_id", hackathonId)
    .eq("user_id", userId);

  if (error) throw new Error("Nie udało się przypisać admina");
  revalidatePath("/admin");
}
```

- [ ] **Step 2: Update admin.ts to scope to hackathon**

Functions like `toggleVoting`, `toggleSubmissions`, `setSubmissionDeadline` now update `hackathons` table instead of `app_settings`. They need `hackathonId` parameter.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/hackathons.ts src/lib/actions/admin.ts
git commit -m "feat: add hackathon CRUD and scope admin actions to hackathon"
```

---

## Phase 8: Admin Pages

### Task 17: Update admin dashboard

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`
- Create: `src/app/(admin)/admin/hackathons/new/page.tsx`
- Create: `src/app/(admin)/admin/hackathons/[slug]/page.tsx`

- [ ] **Step 1: Rewrite admin dashboard**

Replace admin page to show list of hackathons with stats + "Nowy hackathon" button + global user table.

- [ ] **Step 2: Create new hackathon page**

Form with: name, slug (auto-generated from name), description, date.

- [ ] **Step 3: Create hackathon settings page**

Per-hackathon settings: dates, submission/voting toggles, category management, participant list with role management, project table.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/
git commit -m "feat: add hackathon management to admin panel"
```

---

## Phase 9: Cleanup

### Task 18: Remove old (main) route group

**Files:**
- Delete: `src/app/(main)/` — all per-hackathon pages that were moved to `/h/[slug]/`
- Keep: global pages need to be moved to a `(global)` route group or kept at top level

- [ ] **Step 1: Move global pages**

Move these pages out of `(main)` to their own route group `(global)` with a simple auth-requiring layout:
- `/rules`, `/guide`, `/faq`, `/prompts`, `/profile`, `/guestbook`

- [ ] **Step 2: Delete old (main) route group**

Remove `src/app/(main)/` entirely after verifying all pages are migrated.

- [ ] **Step 3: Update /live page**

`src/app/live/page.tsx` — needs to handle multiple hackathons. Show latest active hackathon's projects, or add a hackathon selector.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove old (main) route group, move global pages"
```

### Task 19: Verify and push

- [ ] **Step 1: Type check**

```bash
npx tsc --noEmit
```

Fix any TypeScript errors.

- [ ] **Step 2: Manual smoke test**

- Visit `/` — see hackathon tiles
- Visit `/register` — test registration with valid/invalid emails
- Visit `/h/ai-hackathon-1/` — see migrated projects
- Visit `/admin` — see hackathon list
- Visit `/admin/hackathons/ai-hackathon-1` — see settings

- [ ] **Step 3: Push**

```bash
git push origin v2
```
