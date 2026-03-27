# Spyrosoft AI Hackathon Showcase — App Specification

## Overview
A web application for showcasing and voting on hackathon projects. Participants submit short screen recordings and presentations, browse other projects in a TikTok-style video feed, and vote in 3 categories.

## Branding
- **Name:** Spyrosoft AI Hackathon
- **Primary color:** `#4646CC` (deep purple/indigo)
- **Accent color:** `#FF4D29` (red-orange)
- **Style:** Dark backgrounds, purple-to-orange/red gradients
- **Vibe:** Chill & fun (not corporate)

## Scale
- ~50 participants
- ~20 projects (solo + teams)
- 2 weeks development time

## User Flow

### 1. Authentication
- Magic links sent via email (batch script by admin)
- One link per person — no passwords, no registration forms
- Token in URL, session in cookie

### 2. Project Creation / Joining
- After logging in, participant either:
  - **Creates a new project** (becomes owner)
  - **Joins an existing project** from a list of open projects
- Team members are displayed on the project

### 3. Submission Phase (~3 days after hackathon)
Each project submits:
- **Project name**
- **Predefined questions** (filled by project owner/team):
  - Short description (what does it do?)
  - How did you get the idea?
  - What was your journey/path?
  - Tech stack used
- **Screen recording** (max 60 seconds, landscape/wide format, uploaded as file)
- **PDF presentation** (optional)
- **Screenshot/thumbnail** for the project card
- No editing after submission

### 4. Browsing Phase
**Landing page (Grid view):**
- Tile/card grid of all projects
- Each card shows: thumbnail/screenshot, project title, short description, team/author name
- Click on card → modal/detail view with full info (video player, PDF, all question answers, team members)

**Video feed (TikTok-style view):**
- Big button on landing page: "Browse all projects" / "Watch all demos"
- Full-screen-ish landscape video player
- Scroll/swipe between project videos
- Autoplay next video
- Project name + short description overlay on video

### 5. Voting Phase
- Separate screen/page with all project tiles
- 3 voting categories (names TBD, e.g.):
  - Best Overall
  - Best Demo / UX
  - Most Creative
- 1 vote per category
- Cannot vote on own project
- Results hidden until admin closes voting

### 6. Results Phase
- Admin closes voting
- Results become visible to all participants
- Leaderboard / winners displayed

## Admin Panel
- **Phase management:** Switch between phases (submission → browsing → voting → results)
- **Project management:** Edit or remove projects
- **Voting control:** Manually close voting
- **Export:** Download results as Excel file
- **No content moderation** needed (trusted participants)

## Technical Constraints
- Web only (desktop-first, but responsive)
- Videos are screen recordings (wide/landscape format)
- Max video length: 60 seconds
- Only authenticated participants can browse and vote
- No likes/hearts — just voting

## Suggested Stack
- **Frontend:** Next.js (React) — mobile-responsive but desktop-first
- **Backend:** Supabase (Auth magic links + Storage + Postgres + Realtime)
- **Video storage:** Supabase Storage or S3
- **Hosting:** Vercel
- **Export:** Server-side Excel generation (e.g., exceljs)
