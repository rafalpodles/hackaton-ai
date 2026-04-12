# Multi-Hackathon Platform — Design Spec

**Date:** 2026-04-12
**Status:** Approved
**Branch:** v2

---

## Overview

Evolve the single-hackathon Spyrosoft AI Hackathon Showcase into a reusable multi-hackathon platform. Approach: "Hackathon as namespace" — add `hackathons` table, scope existing data per hackathon, add self-registration, dynamic voting categories, and per-hackathon admin delegation.

---

## 1. Database Schema

### New table: `hackathons`

```sql
hackathons
  id                  uuid PK DEFAULT gen_random_uuid()
  name                text NOT NULL
  slug                text UNIQUE NOT NULL
  description         text DEFAULT ''
  hackathon_date      timestamptz
  submission_deadline timestamptz
  submission_open     boolean DEFAULT false
  voting_open         boolean DEFAULT false
  status              text DEFAULT 'upcoming'
                      CHECK (status IN ('upcoming', 'active', 'voting', 'finished'))
  created_at          timestamptz DEFAULT now()
  updated_at          timestamptz DEFAULT now()
```

### New table: `hackathon_categories`

Dynamic voting categories per hackathon.

```sql
hackathon_categories
  id              uuid PK DEFAULT gen_random_uuid()
  hackathon_id    uuid FK hackathons ON DELETE CASCADE
  slug            text NOT NULL
  label           text NOT NULL
  display_order   int DEFAULT 0
  UNIQUE(hackathon_id, slug)
```

### New table: `hackathon_participants`

Per-hackathon participation with team/project context.

```sql
hackathon_participants
  id              uuid PK DEFAULT gen_random_uuid()
  hackathon_id    uuid FK hackathons ON DELETE CASCADE
  user_id         uuid FK profiles ON DELETE CASCADE
  role            text DEFAULT 'participant'
                  CHECK (role IN ('participant', 'admin'))
  team_id         uuid FK teams ON DELETE SET NULL
  project_id      uuid FK projects ON DELETE SET NULL
  is_solo         boolean DEFAULT false
  joined_at       timestamptz DEFAULT now()
  UNIQUE(hackathon_id, user_id)
```

### New table: `registration_attempts`

Rate limiting for self-registration.

```sql
registration_attempts
  id          uuid PK DEFAULT gen_random_uuid()
  ip_address  text NOT NULL
  created_at  timestamptz DEFAULT now()
```

Rate limit: max 5 rows per IP per hour.

### Modified tables

**`projects`** — add column:
- `hackathon_id` uuid FK hackathons ON DELETE CASCADE, NOT NULL

**`teams`** — add column:
- `hackathon_id` uuid FK hackathons ON DELETE CASCADE, NOT NULL

**`team_requests`** — no changes (already scoped via team → hackathon)

**`votes`** — change `category`:
- Remove CHECK constraint on `category` text
- Add `hackathon_id` uuid FK hackathons ON DELETE CASCADE
- `category` references `hackathon_categories.slug` (enforced in server action, not FK — keeps it simple)
- Update unique constraint: `unique(voter_id, category)` → `unique(voter_id, hackathon_id, category)`

**`profiles`** — remove per-hackathon columns:
- Drop `team_id`, `project_id`, `is_solo`
- Keep: `id`, `email`, `display_name`, `first_name`, `last_name`, `avatar_url`, `role`, `openrouter_api_key`, `openrouter_key_hash`, `api_key_requested`, `api_key_requested_at`, `created_at`, `updated_at`

**`app_settings`** — drop entire table (fields moved to `hackathons`)

**`guestbook`** — no changes (global feature)

---

## 2. Routing

### Global routes (outside hackathon context)

```
/                           Landing page with hackathon tiles
/register                   Self-registration
/login                      Login (existing)
/change-password            Password change (existing)
/live                       Public project feed (existing)
/profile                    User profile (global)
/guestbook                  Geocities guestbook (global)
/rules                      Hackathon rules (global)
/guide                      Guide (global)
/faq                        FAQ (global)
/prompts                    Prompt library (global)
```

### Per-hackathon routes

```
/h/[slug]/                  Project grid for this hackathon
/h/[slug]/feed              Video feed
/h/[slug]/vote              Voting
/h/[slug]/results           Results
/h/[slug]/onboarding        Team/solo selection
/h/[slug]/team              Team management
/h/[slug]/my-project        Project submission
/h/[slug]/ideas             Project ideas (per hackathon)
```

### Admin routes

```
/admin                      Global admin dashboard + hackathon list
/admin/hackathons/new       Create new hackathon
/admin/hackathons/[slug]    Hackathon settings (dates, categories, admins, projects, users)
```

### Middleware rules

- **Public:** `/`, `/login`, `/register`, `/change-password`, `/live`
- **Auth required:** `/h/[slug]/*` — must be logged in + participant of this hackathon
- **Global admin:** `/admin/*` — `profiles.role = 'admin'`
- **Hackathon admin:** hackathon settings — `hackathon_participants.role = 'admin'` OR global admin

---

## 3. Authentication & Registration

### Self-registration flow

1. User visits `/register`
2. Form: email + password + confirm password
3. Email validation regex: `^[a-zA-Z]{1,4}@(spyro-soft\.com|vm\.spyro-soft\.com)$`
4. Password: min 6 characters
5. Backend:
   - Check rate limit: `SELECT COUNT(*) FROM registration_attempts WHERE ip_address = $ip AND created_at > now() - interval '1 hour'` — block if >= 5
   - Insert `registration_attempts` row
   - `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
   - Auto-login after creation
6. Redirect to `/` (landing page)

### Existing users

- Log in with existing password
- See landing page with hackathon tiles
- First hackathon visible as finished (archive)

### Joining a hackathon

- Logged-in user on landing page → clicks "Dołącz" on upcoming hackathon tile
- Creates `hackathon_participants` row (role: 'participant')
- Redirects to `/h/[slug]/onboarding`

### Admin roles

- **Global admin:** `profiles.role = 'admin'` — full access to `/admin`, auto-admin of every hackathon
- **Hackathon admin:** `hackathon_participants.role = 'admin'` — manages specific hackathon settings
- Global admin can delegate hackathon admin via `/admin/hackathons/[slug]`

---

## 4. Landing Page & UI

### Landing page (`/`)

**Not logged in:**
- Header: logo + "Zaloguj się" / "Zarejestruj się" buttons
- Hackathon tiles (public, visible without login)
- Finished → browse projects/results
- Upcoming → "Zarejestruj się żeby dołączyć"

**Logged in:**
- Header: avatar + profile link
- Tiles with contextual actions:
  - **Upcoming** (not joined) → "Dołącz"
  - **Upcoming/Active** (joined) → "Wejdź" → `/h/[slug]/`
  - **Finished** (was participant) → "Zobacz wyniki"
  - **Finished** (was not participant) → "Przeglądaj projekty"

### Hackathon tile content

- Name, date, status badge
- Stats: project count, participant count
- Action button (contextual)

### Per-hackathon layout (`/h/[slug]/`)

- Sidebar with hackathon name in header
- Navigation: per-hackathon pages + links to global pages (rules, guide, faq)
- Countdown banner reads dates from `hackathons` table (not app_settings)

### Admin panel

- `/admin` — list of all hackathons + "Nowy hackathon" button + global user management
- `/admin/hackathons/[slug]` — settings: name, dates, categories, submission/voting toggles, delegated admins, project table, participant table

---

## 5. Data Migration (Hackathon #1)

Sequential migration steps:

1. Create `hackathons` row with slug `ai-hackathon-1`, populate from `app_settings` fields
2. Create `hackathon_categories` rows for 3 existing categories (`concept_to_reality`, `creativity`, `usefulness`)
3. Add `hackathon_id` to `projects`, `teams` — set to hackathon #1 ID for all existing rows
4. Add `hackathon_id` to `votes` — set to hackathon #1 ID for all existing rows
5. Create `hackathon_participants` rows from profiles that have `team_id` OR `project_id` OR `is_solo = true`, copying `team_id`, `project_id`, `is_solo`
6. Drop `team_id`, `project_id`, `is_solo` from `profiles`
7. Drop `app_settings` table
8. Create `registration_attempts` table

### Vote category migration

- Existing `votes.category` text values match `hackathon_categories.slug` — no data change needed
- Remove CHECK constraint, add `hackathon_id` column

---

## 6. Key Behavioral Changes

### Onboarding

- Now scoped per hackathon: `/h/[slug]/onboarding`
- User chooses team/solo **within** a hackathon
- Same user can be solo in one hackathon, team in another
- Middleware checks `hackathon_participants` for team/solo status (not `profiles`)

### Voting

- Categories loaded from `hackathon_categories` (not hardcoded)
- Vote count = number of categories in that hackathon
- Constraint: `unique(voter_id, hackathon_id, category)` — replaces `unique(voter_id, category)`

### Project submission

- Project linked to hackathon via `hackathon_id`
- Submission deadline and toggle from `hackathons` table

### Team management

- Teams scoped to hackathon via `hackathon_id`
- Team requests work same as before (scoped through team → hackathon)

---

## 7. What Stays Unchanged

- Geocities mode (global easter egg)
- Guestbook (global)
- Video feed component internals
- Voting board UI (just reads categories dynamically)
- Project submission form (just reads hackathon context)
- Excel export (scoped to hackathon)
- OpenRouter API key management (global, on profile)
- Storage buckets structure (videos/, presentations/, thumbnails/)
