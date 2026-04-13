# AI Hackathon Showcase & Voting Platform

Multi-hackathon platform for organizing hackathons at Spyrosoft — teams, project submissions, voting, and results. Built for internal use. Supports multiple hackathons under `/h/[slug]/`.

## Tech stack
- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Database**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS v4
- **Deploy**: Railway (auto-deploy from `main`)
- **Language**: TypeScript

## Project structure
```
src/
├── app/
│   ├── (admin)/admin/       # Global admin (users, create hackathon)
│   ├── (auth)/              # Login, register, change-password
│   ├── (global)/            # Global pages (profile, rules, guide, faq, prompts)
│   ├── (landing)/           # Landing page with hackathon tiles
│   ├── h/[slug]/            # Per-hackathon pages (team, vote, my-project, admin, etc.)
│   └── live/                # Public project feed
├── components/
│   ├── admin/               # Admin components (tables, toggles, settings)
│   ├── landing/             # Hackathon tiles
│   ├── layout/              # Sidebar, countdown banner, hackathon provider
│   ├── teams/               # Team management components
│   ├── voting/              # Voting board, categories
│   └── ui/                  # Shared UI (glass-card, gradient-button, etc.)
├── lib/
│   ├── actions/             # Server actions (teams, projects, voting, admin, hackathons)
│   ├── supabase/            # Supabase clients (server, client, middleware)
│   ├── types.ts             # TypeScript types
│   ├── utils.ts             # Shared utils (getCurrentUser, getHackathonBySlug, etc.)
│   └── vote-results.ts     # Shared vote aggregation logic
└── supabase/
    └── migrations/          # SQL migrations (001-017)
```

## Key conventions
- Language: Polish UI, English code/commits/branches
- Commits: conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
- All auth/authz in server actions (RLS disabled, using service_role key server-side)
- Data scoped to hackathon via `hackathon_id` on projects, teams, votes, participants

## Database schema (key tables)
- `hackathons` — multi-hackathon support (name, slug, status, dates, voting/submission toggles)
- `hackathon_participants` — junction: user ↔ hackathon (role, team_id, project_id, is_solo)
- `hackathon_categories` — per-hackathon vote categories
- `profiles` — user profiles (extends Supabase auth)
- `teams` — hackathon teams (leader_id, project_id)
- `projects` — submitted projects (hackathon_id scoped)
- `votes` — one vote per user per category per hackathon
- `team_requests` — join team requests

## Routing
- `/` — landing page with hackathon tiles
- `/h/[slug]/*` — per-hackathon pages (has sidebar with full nav)
- `/admin` — global admin (users only)
- `/h/[slug]/admin` — per-hackathon admin (settings, categories, projects, participants, stats)
- `/live` — public project feed (no auth required)

## ClaudePlanner integration

```
claudeplanner_project_key: AH
```

### Workflow
- On session start: run `list_tasks` for this project to see current work.
- When asked "what to work on" / "co robić" — list tasks and suggest next one.
- Log important decisions, blockers, or completion notes with `add_comment`.
- When user describes new work, ask if it should be tracked and `create_task` if yes.

### Task statuses
- `planned` — idea/backlog, NOT approved for work. Claude never touches these.
- `todo` — approved for work. Claude picks these up automatically.
- `in_progress` — actively being worked on.
- `in_review` — code complete, awaiting code review.
- `ready_to_test` — review passed, ready for final verification and merge.
- `needs_human_review` — implementation requires human review before proceeding. Claude moves tasks here and **stops working on them** until a human reviews and advances the status.
- `done` — merged to `main`, task complete.

### Autonomous task processing
Claude automatically picks up tasks in `todo` status (assigned to `claude` or unassigned) and processes them through the pipeline. No user confirmation needed for `todo` tasks.

#### Size-based approach
- **S/M tasks** — Claude implements immediately, no upfront plan needed.
- **L/XL tasks** — Claude first writes a plan as a task comment and **waits for user approval** before writing any code.

#### Pipeline: todo → in_progress → in_review → ready_to_test → done

**1. todo → in_progress (Start work)**
- Pick the task, assign to `claude`, change status to `in_progress`.
- Add a comment: what approach will be taken (for S/M: brief, for L/XL: detailed plan — wait for approval).
- Create a feature branch from `main`: `ah-<number>/<short-slug>`.
- Implement the task on that branch.

**1.1. needs_human_review**
- Claude moves tasks here and **stops working on them** until a human reviews and advances the status.

**2. in_progress → in_review (Implementation done)**
- Run `npm run build` to verify the build passes.
- Commit changes to the feature branch (conventional commits).
- Add a comment: summary of what was done, any decisions made.
- Change status to `in_review`.

**3. in_review → ready_to_test (Code review)**
- Review the diff between the feature branch and `main`.
- Check for: correctness, security, code style, missing edge cases.
- If issues found: fix them on the branch, re-commit, add comment with findings. Stay in `in_review`.
- If review passes: add comment confirming review OK. Change status to `ready_to_test`.
- Create a GitHub PR (`gh pr create`) for visibility and history.

**4. ready_to_test → done (Final check & merge)**
- Verify the branch is clean and build passes.
- Merge the PR into `main`.
- Delete the feature branch.
- Add a closing comment on the task.
- Change status to `done`.

#### Blocker handling
- If Claude gets stuck: stay in `in_progress`, add a comment describing the blocker, and **stop working on the task**.
- Do not brute-force or guess. Wait for user input.

### Conventions
- Task keys: `AH-1`, `AH-2` — use these when referencing tasks.
- Assignees use **usernames** (not IDs). `claude` = Claude Code.
- Branch naming: `ah-<number>/<short-slug>` (e.g. `ah-5/dynamic-categories`)
