# Spyrosoft AI Hackathon Showcase — Design Spec

## Overview

Web application for showcasing and voting on hackathon projects. ~50 participants, ~20 projects. Participants submit screen recordings (max 60s) and presentations, browse projects in a grid + TikTok-style video feed, and vote in 3 categories.

**Stack:** Next.js 15 (App Router) + Supabase (Auth, Storage, Postgres) + Tailwind CSS + Vercel

**Timeline:** 2 weeks

**Branding:** Spyrosoft colors — primary `#4646CC` (purple), accent `#FF4D29` (red-orange), dark mode, gradients, chill & fun vibe.

---

## 1. Data Model

```sql
-- Singleton for phase management
app_settings (
  id            int PRIMARY KEY DEFAULT 1,
  current_phase text NOT NULL DEFAULT 'submission',
    -- 'submission' | 'browsing' | 'voting' | 'results'
  updated_at    timestamptz DEFAULT now()
)

-- Extends Supabase auth.users
profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id),
  email         text NOT NULL,
  display_name  text NOT NULL,
  avatar_url    text,
  project_id    uuid REFERENCES projects(id) ON DELETE SET NULL,
  role          text NOT NULL DEFAULT 'participant',
    -- 'participant' | 'admin'
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
)

projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text NOT NULL CHECK (char_length(description) <= 280),
  idea_origin     text NOT NULL,
  journey         text NOT NULL,
  tech_stack      text[] DEFAULT '{}',
  video_url       text,
  video_duration  int CHECK (video_duration <= 60),
  pdf_url         text,
  thumbnail_url   text,
  is_submitted    boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)

votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id    uuid NOT NULL REFERENCES profiles(id),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category    text NOT NULL,
    -- 'best_overall' | 'best_demo_ux' | 'most_creative'
  created_at  timestamptz DEFAULT now(),
  UNIQUE(voter_id, category)
)
```

**Key decisions:**
- `project_id` on `profiles` (not a junction table) — one person = one project, simpler queries
- `is_submitted` as lock — once `true`, project is immutable (enforced by RLS)
- `app_settings` singleton — admin changes phase, frontend reacts
- `votes` UNIQUE on `(voter_id, category)` — one vote per category per user

---

## 2. Auth Flow

```
1. Admin batch script → supabase.auth.admin.inviteUserByEmail(email)
   → Supabase sends magic link to each participant

2. User clicks link → /auth/callback
   → Supabase verifies token, creates session (cookie)
   → Redirect to /onboarding (if no project) or / (if has project)

3. Onboarding: "Create new project" or "Join existing project"
   → Sets profiles.project_id

4. Session refresh via @supabase/ssr middleware (middleware.ts)
```

**Admin:** One user with `role: 'admin'` — set manually in DB or via seed script.

**RLS Policies:**
- `profiles`: everyone reads all, user updates only self
- `projects`: everyone reads submitted projects; team members update their project while `is_submitted = false`
- `votes`: insert only when `phase = 'voting'` AND `project_id != voter's project_id`; select only when `phase = 'results'` OR admin
- `app_settings`: select for all, update only admin

---

## 3. File Storage

```
Supabase Storage Buckets:

videos/{project_id}/demo.mp4          -- max 60s, ≤50MB
presentations/{project_id}/presentation.pdf
thumbnails/{project_id}/thumb.jpg
```

**Upload flow:**
1. Client-side validation: format (mp4/webm), size (≤50MB), duration (≤60s via `<video>` metadata)
2. Direct upload to Supabase Storage (client-side, with auth token)
3. Storage RLS: upload/overwrite only by project member, only while `is_submitted = false`
4. After `is_submitted = true` — storage policy blocks overwrite
5. Public read for authenticated users

**Video playback:** Supabase Storage CDN URL → HTML5 `<video>` player

---

## 4. Routing & Pages

```
/login                  → Magic link login form (centered card, glassmorphism)
/auth/callback          → Supabase auth callback handler
/auth/confirm           → "Check your email!" confirmation screen
/onboarding             → Create or join project (if no project_id)

/                       → Landing page — project grid (tiles)
/projects/{id}          → Project detail (or modal on /)
/feed                   → TikTok-style video feed ("Live Feed")
/vote                   → Voting screen (3 categories, tiles)
/results                → Leaderboard (visible only in results phase)

/my-project             → Submission form (stepper) + preview after submit

/admin                  → Dashboard (stats, phase switcher, project table)
/admin/results          → Leaderboard + Excel export
```

**Layout:** Left sidebar navigation (per Stitch designs) with:
- User identity block (avatar + name) at top
- Nav items: Projects, Live Feed, Voting, Submit
- "Vote Now" CTA button in sidebar
- Logout at bottom
- Admin users see additional: Dashboard, (admin routes)

**Middleware (`middleware.ts`):**
- Not authenticated → redirect to `/login`
- Authenticated + no `project_id` → redirect to `/onboarding`
- `/admin/*` → check `role = 'admin'`, else 403
- `/vote` → check `phase = 'voting'`
- `/results` → check `phase = 'results'`

**Phase-aware UI:** Sidebar shows/hides links based on current phase.

---

## 5. Visual Design (from Stitch mockups)

**Design system:** "Neon-Glass Directive" — see `designs/neon_syndicate/DESIGN.md`
- Fonts: Space Grotesk (headlines/labels), Manrope (body)
- No solid borders — use background color shifts and ghost borders (outline at 15% opacity)
- Glassmorphism for floating elements (modals, nav) — 40% opacity + 20px backdrop-blur
- CTA buttons: gradient from primary to accent (135deg)
- Cards: `surface_container_low` bg, ghost border, purple glow on hover, orange glow top-right
- Elevation via tonal layering, not shadows. Ambient glows use 10% primary color
- Stepper: gradient horizontal bars instead of circles
- Surface hierarchy: base `#0e0e13` → sections `#131318` → active `#1f1f26`
- Text: never `#FFFFFF`, use `#f8f5fd` (on_surface)

**Reference mockups in `designs/` directory:**
- `desktop_landing_page_projects/` — grid layout with sidebar
- `desktop_video_feed/` — landscape video player with nav arrows
- `desktop_voting_screen/` — 3 columns, sticky submit bar
- `desktop_admin_panel/` — stats cards, phase pills, project table
- `desktop_project_submission/` — questions + uploads on single view
- `desktop_magic_link_confirmation/` — glassmorphism card
- `magic_link_login/` — centered card (adapt for desktop)
- `project_detail/` — modal with About/Presentation tabs

---

## 6. Components

```
Layout & Nav
├── AppShell              → dark layout, LEFT SIDEBAR, phase indicator
├── Sidebar               → user identity, nav items, "Vote Now" CTA, logout
└── PhaseGate             → renders children only in correct phase

Landing Page (/)
├── ProjectGrid           → responsive grid 3-4 columns
├── ProjectCard           → thumbnail, title, description, team
└── ProjectDetailModal    → video player, tabs (About/Presentation), team

Video Feed (/feed)
├── VideoFeed             → vertical scroll container, snap scrolling
├── VideoFeedItem         → video player + project info overlay
└── FeedNavigation        → counter "3/20", prev/next arrows

Voting (/vote)
├── VotingBoard           → 3 category columns
├── VotingCategory        → category title + selectable project tiles
├── VotingProjectTile     → thumbnail + title, selected state (glow)
└── VoteSubmitBar         → sticky bottom, submit button + validation

Submission (/my-project)
├── SubmissionStepper     → gradient bar stepper (4 steps)
├── SubmissionForm        → questions (left) + uploads (right) on same screen
├── FileUploadZone        → drag & drop, progress bar, validation
├── JoinProjectList       → list of existing projects with "Join" button
└── SubmissionPreview     → read-only preview before final submit

Admin (/admin)
├── AdminDashboard        → stats cards, phase switcher
├── PhaseSwitcher         → 4 steps, active state, confirm dialog
├── ProjectsTable         → sortable table, edit/delete actions
├── ResultsLeaderboard    → per-category ranking
└── ExcelExportButton     → generates and downloads .xlsx

Shared
├── VideoPlayer           → <video> wrapper, custom controls, autoplay
└── ConfirmDialog         → reusable modal for destructive actions
```

---

## 7. Server Actions & API

```
Auth Actions
├── sendMagicLink(email)        → supabase.auth.signInWithOtp()
└── signOut()                   → supabase.auth.signOut()

Project Actions
├── createProject(name)         → insert project, set profile.project_id
├── joinProject(projectId)      → update profile.project_id
├── updateProject(data)         → gated: is_submitted=false
├── submitProject(projectId)    → set is_submitted=true (irreversible)
└── leaveProject()              → set profile.project_id=null (gated: is_submitted=false)

Upload (client-side direct to Storage)
├── uploadVideo(projectId, file)
├── uploadPdf(projectId, file)
└── uploadThumbnail(projectId, file)

Voting Actions
├── castVotes(votes: {category, projectId}[])
│   → atomic insert of 3 votes in transaction
│   → validation: phase='voting', not own project, no existing votes
└── getResults()
    → aggregate votes per category (gated: phase='results' OR admin)

Admin Actions
├── setPhase(phase)             → update app_settings.current_phase
├── deleteProject(projectId)    → cascade delete project + files
├── editProject(projectId, data)→ admin override
└── exportResults()             → exceljs → .xlsx download
```

**Key:** `castVotes` accepts all 3 votes atomically (not one by one). Validation in both server actions AND RLS (defense in depth).

---

## 8. TikTok-style Video Feed

```
Mechanics:
- CSS scroll-snap (scroll-snap-type: y mandatory)
- Each item = 100vh section with centered 16:9 video player
- IntersectionObserver per item:
  - >50% visible → autoplay
  - <50% visible → pause
- Preload: current + next video (preload="metadata" for rest)
- Keyboard: Arrow Up/Down = scroll to prev/next

Layout per item:
┌─────────────────────────────────────┐
│            3 / 20          [✕ Close]│
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │     16:9 Video Player       │   │
│   │        (landscape)          │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
│   Project Name                      │
│   Short description text here...    │
│   by: Team Alpha                    │
│                        [View Full →]│
└─────────────────────────────────────┘

Edge cases:
- Last project → "That's all! Go vote →" CTA
- Video loading → skeleton + spinner
- Order: chronological (same as grid)
- "View Full" opens ProjectDetailModal
```

---

## 9. Admin & Excel Export

```
Dashboard:
- Stats cards (real-time via Supabase Realtime):
  Total Projects, Participants, Votes Cast, % Completion

Phase Switcher:
- [Submission] → [Browsing] → [Voting] → [Results]
- Forward-only progression (no going back)
- Confirm dialog before switching
- Phase change instant, UI reacts everywhere

Projects Table:
- Columns: Name, Team, Status, Submitted At, Actions
- Actions: View, Edit (modal), Delete (confirm + cascade)

Excel Export (exceljs):
- Sheet 1 "Results": category, rank, project name, team, vote count
- Sheet 2 "All Votes": voter email, category, project voted for
- Sheet 3 "Projects": all project data dump
- Server action returns .xlsx as download
```

---

## Non-goals (explicitly out of scope)

- Likes / hearts / reactions
- Video recording in-app
- Editing submissions after submit
- Public access (unauthenticated)
- Real-time collaboration on project submissions
- Comments on projects
- Mobile-native app
