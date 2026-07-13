# Handoff: Spyrosoft Hackathons — "GARAGE OS" Redesign

## Overview
A full visual + interaction redesign of the Spyrosoft Hackathons platform
(`spyrosoft-ai-hackaton.up.railway.app`). Concept: the whole product is framed as a
booting **hackathon operating system** — dark, high-energy, terminal/tech aesthetic with a
signature electric gradient, kinetic typography, and motion throughout. Covers every screen:
landing, and the in-app shell (Garage Rules, Poradnik, Q&A, Pomysły na projekty, Przydatne
prompty, Zespół, Mój projekt, Projekty, Live, Wyniki).

## About the Design Files
`Garage OS.dc.html` in this bundle is a **design reference created in HTML** — a working
prototype that shows the intended look, motion, and behavior. It is **not** production code to
copy verbatim. It is authored in a custom "Design Component" runtime (a `<x-dc>` template +
a `Component extends DCLogic` class); **do not** try to reuse that runtime.

The task is to **recreate these designs in the target codebase's existing environment.** The
current app is **Next.js / React** — implement the redesign there using the project's established
patterns (components, routing, styling solution). Treat the HTML as the source of truth for
layout, color, type, spacing, copy, and motion; re-express it in idiomatic React.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, gradients, and interactions are all
intentional. Recreate the UI pixel-closely, then swap the ad-hoc structure for the codebase's
real components/state/data. Exact hex values, fonts, and motion specs are listed under
**Design Tokens**.

## How to read the prototype
- Single file, single-page app. State `screen` drives which view renders.
  `'landing'` = marketing page; anything else = the in-app shell (sidebar + main).
- Screen content lives in `renderVals()` in the logic class as plain data arrays
  (`rules`, `guideSteps`, `ideas`, `prompts`, `teams`, `projects`, `resultCats`, `faqItems`…) —
  use these as the content/copy spec. In the real app this data comes from the backend.
- All styling is inline. Fonts/keyframes are in the `<helmet><style>` block at the top.

---

## Design Tokens

### Color
| Token | Hex | Use |
|---|---|---|
| ink (page bg) | `#07070b` | app background |
| panel | `#0e0e15` (≈`rgba(14,14,21,.6)`) | cards, sidebar |
| panel-2 | `#14141d` | raised surfaces |
| line | `rgba(255,255,255,.08–.12)` | borders/dividers |
| text | `#f5f5fa` | primary text |
| text-muted | `#a6a6b8` | body/secondary |
| text-dim | `#8b8b9a` | meta/labels |
| text-faint | `#55556a` | placeholders, mono ticks |
| accent-indigo | `#6366f1` | gradient start, active nav |
| accent-violet | `#a855f7` | gradient mid |
| accent-coral | `#ff5a4d` | gradient end, LIVE, logout hover |
| accent-cyan | `#2ee6cf` | "signal"/online pulses, terminal text |
| accent-amber | `#ffc14d` | "GŁOSOWANIE" status, #1 rank |
| link | `#8b8cf5`; link:hover `#ff8a80` | |

**Signature gradient:** `linear-gradient(120deg,#6366f1,#a855f7,#ff5a4d)`
(buttons, logo mark, progress). Text-clip variant for headings:
`linear-gradient(115deg,#c7c8ff,#ff9d90)`.

### Typography
- **Display / headings:** `Chakra Petch`, weights 600/700 (Google Fonts).
- **Body / UI:** `Space Grotesk`, 400/500/600/700.
- **Mono / labels / terminal / code:** `JetBrains Mono`, 400/500/700.
- Hero sizes use `clamp()` (e.g. hero `clamp(58px,13vw,190px)`, page H1
  `clamp(40px,6vw,72px)`). Section H2 ≈ 26px. Body 15–17px, line-height 1.6–1.7.
- Meta/labels: JetBrains Mono, 10–13px, letter-spacing `.14–.26em`, often UPPERCASE.

### Radius & shadow
- Radius: cards 16–22px, buttons 12–14px, chips/pills 999px, inputs 12px, nav items 11px.
- Primary button glow: `box-shadow:0 16px 40px -12px rgba(129,90,241,.7)` (landing) /
  `0 12px 30px -10px rgba(129,90,241,.7)` (sidebar).
- Borders are the main separation device; keep shadows subtle.

### Spacing
- Page gutters: `clamp(20px,4–5vw,56–64px)`. Content max-width **1180px** (app) / 1200–1400px (landing).
- Card padding 20–28px. Grid gaps 12–22px. Section rhythm 44–56px vertical.

---

## Global Layout

### Ambient background (fixed, `z-index:0`, non-interactive)
Three blurred radial "aurora" blobs (indigo, coral, cyan) drifting via `@keyframes auroraA/auroraB`
(22–30s ease-in-out); a 64px CSS grid that slowly pans (`gridPan`, radial mask fading edges);
a faint horizontal-line scanline texture. **Note:** a top→bottom moving light bar was removed at
the user's request — do not add a vertical sweeping scanline.

### Boot overlay (first load only)
Full-screen `#050507` terminal (`z-index:200`). Types out ~7 lines
(`> booting SPYROSOFT_HACKATHON_OS …`, `mounting /garage … [OK]`, … `ready. welcome, rpo.`) in
cyan mono with a blinking block cursor, a gradient progress bar filling 0→100%, CRT scanline
texture, and a `[ ESC / KLIKNIJ ABY POMINĄĆ ]` skip. Fades out (opacity .6s) then triggers the
stat count-up on the landing. Persists a `booted` flag (localStorage) so it only plays once;
a **REBOOT_INTRO** button on the landing clears the flag and replays.

---

## Screens / Views

> Copy is Polish with English/mono accents, matching the live app. Use the exact strings from
> `renderVals()` arrays in the prototype.

### 1. Landing (`screen: 'landing'`)
- **Top bar:** logo mark (gradient rounded square) + "Spyrosoft **Hackathons**"; right side
  `rpo@spyro-soft.com` (mono) and a pill `● SYSTEM ONLINE` (cyan, pulsing dot `pulseDot`).
- **Hero (centered):** pill badge `v2.0 · BUILD REAL THINGS WITH AI`; two-line kinetic title
  **SPYROSOFT** (gradient text, periodic glitch clip via `glitchClip`) / **HACKATHONS**
  (white→lilac→coral gradient text). Sub: "Dołącz do hackathonu, zbuduj coś niesamowitego i
  rywalizuj z najlepszymi. / Build something real. Ship it in one day."
- **CTAs:** primary `> WEJDŹ DO HACKATHONU` (gradient, animated sheen, magnetic hover → sets
  screen to `rules`); secondary `↻ REBOOT_INTRO` (mono, replays boot).
- **Stats row (4):** 57 UCZESTNIKÓW · 22 PROJEKTÓW · 3 KATEGORIE · 90 SEKUND/IDEA. Numbers
  count up from 0 (cubic ease-out, ~1.4s) after boot completes.
- **Ticker:** full-width marquee (`tick`, 34s linear, content duplicated for seamless loop) of
  project names + vote counts, mono.
- **Hackathon cards:** "Aktywne i nadchodzące // ACTIVE" → featured card *AI Powered HMI
  Development* (amber `● GŁOSOWANIE`, 11 czerwca 2026 · 26 uczestników · 12 projektów, gradient
  `WEJDŹ →`). "Zakończone // ARCHIVE" → *Spyrosoft AI Hackathon #1* (9 kwietnia 2026 · 57 · 22,
  outline "ZOBACZ WYNIKI"). Both cards tilt on hover (`data-tilt`) and navigate into the app.
- **Footer:** `SPYROSOFT_HACKATHON_OS · 2026 · <90s/>`.

### 2. App shell (all non-landing screens)
- **Top status strip** (fixed, 44px): centered `● HACKATHON ZAKOŃCZONY`, gradient-tinted, blur.
- **Sidebar** (288px, sticky, blur): user block (avatar "R", `rpo`, `rpo@spyro-soft.com`);
  `← HACKATHONY` (→ landing); grouped nav with mono section labels + per-item mono EN tag:
  - **NA START:** Garage Rules · Poradnik · Q&A · Pomysły na projekty · Przydatne prompty
  - **HACKATHON:** Zespół · Mój projekt
  - **GALERIA:** Projekty · Live · Wyniki
  - **ADMIN:** Admin · Wyniki

  Active item: gradient-tint fill, `rgba(139,140,245,.4)` border, `inset 3px 0 0 #8b8cf5` left bar,
  white text. Inactive: muted, hover → `rgba(255,255,255,.05)`.
  Below: gradient **ZOBACZ WYNIKI** button, `<90s>` tick, **WYLOGUJ** (hover coral).
- **Main:** own scroll, content max-width 1180px, centered. Each screen fades/rises in
  (`riseIn` .45s) keyed on screen id.

### 3. Garage Rules (`rules`)
Centered gradient hero **GARAGE RULES**, tagline "Nie buduj ładnego. Buduj użytecznego.", date
line. Sections **CZYM JEST TEN HACKATHON** (intro + 3 bullets) and **ZASADY GRY** — 4 rule cards
(01 Vibecoduj / 02 Nowy projekt / 03 Liczy się pomysł + AI / 04 Automatyzuj irytacje), each with
mono number, title, description.

### 4. Poradnik (`guide`)
Gradient banner **PRZYGOTUJ SIĘ** + `🚀 POCZĄTKUJĄCY` pill. `— FUNDAMENTY —` list of 6
collapsible-style rows (numbered chip + title + `⌄`): Terminal, VS Code, Git, Konto GitHub,
Node.js, Python. `— AI TOOLS —` 3 selectable option cards (Claude Pro/Max, ChatGPT Plus/Pro
[selected state = indigo border/tint], OpenRouter).

### 5. Q&A (`qa`)
Huge gradient **Q&A** title + subtitle. Search field (placeholder "Szukaj pytania…"). Filter
chip row (11 categories; first "WSZYSTKIE" = gradient-active). Category block "🔑 Tokeny i
narzędzia AI" with 7 accordion rows (question + `⌄`). Content in `faqItems` / `faqCats`.

### 6. Pomysły na projekty (`ideas`)
Title + intro. Responsive card grid (min 320px). Each card: left gradient accent bar, title,
description, tag pills (mono). 10 ideas in `ideas` array.

### 7. Przydatne prompty (`prompts`)
Title + intro. 5 prompt cards; each = header (numbered chip + title + subtitle) and a mono
code body (cyan, `white-space:pre-wrap`) with a floating "Kopiuj" button. Content in `prompts`.

### 8. Zespół (`team`)
Title, info banner "Pracujesz solo…", "Załóż zespół" card (text input + gradient UTWÓRZ),
"Dołącz do zespołu" list of team rows (name + `x/5 — members` meta + outline DOŁĄCZ). Data `teams`.

### 9. Mój projekt (`project`)
Title + single "Utwórz projekt" card (input "Nazwa projektu" + gradient UTWÓRZ).

### 10. Projekty (`projects`)
Title + "22 zgłoszonych projektów". Card grid (min 260px, tilt on hover). Each card: thumbnail
area (gradient placeholder + emoji icon; optional corner badge e.g. `CHATGPT`, `GOOGLE STITCH`),
name, 2-line description, author row (gradient avatar initial + name). Data `projects` (12 shown;
real app renders all 22). **In production, replace emoji/gradient thumbnails with real project
screenshots.**

### 11. Live (`live`)
`● LIVE` (coral pulse) + `PROJEKT #01` + `1 / 22` counter. 16:10 video frame (loading spinner
placeholder + speaker button) — wire to the real project video/embed. Below: project title
**LetsOrderLunch**, description, "Pokaż więcej →". Add prev/next navigation through the 22 projects.

### 12. Wyniki (`results`)
Header `// FINAL_RESULTS` + "Wyniki: Spyrosoft AI Hackathon #1" (gradient) + gradient
`⬇ POBIERZ EXCEL`. Three category columns (`resultCats`): **Droga od koncepcji do realizacji ⚡**,
**Kreatywność pomysłu ✨**, **Przydatność / wartość użytkowa ⚙️**. Each row = ranked project:
`#n` (amber for #1), name (+ optional author), vote badge, and a **background bar** whose width =
`votes / maxVotesInCategory`, animated growing from left (`barGrow` .9s, staggered 60ms). #1 row
has amber-tinted border. Correct Polish vote pluralization: `1 głos` / `2–4 głosy` / `5+ głosów`.

---

## Interactions & Behavior
- **Navigation:** sidebar items / CTAs set `screen`; main scroll resets to top; content replays
  `riseIn`. In React use the router (Next.js routes) instead of local state.
- **Boot sequence:** typewriter + progress; ESC or click skips; once-per-user via localStorage;
  REBOOT replays.
- **Count-up:** stats animate 0→target on landing after boot (`requestAnimationFrame`, cubic ease-out).
- **Magnetic buttons** (`data-magnetic`): translate toward cursor on `pointermove`
  (×0.22 x / ×0.32 y), reset on leave, `transition:transform .18s`.
- **Tilt cards** (`data-tilt`): `perspective(800px)` rotateX/Y ±6° from cursor, reset on leave.
- **Glitch:** hero "SPYROSOFT" runs `glitchClip` (.35s, steps) every ~4.2s.
- **Marquee ticker:** infinite `translateX(-50%)` over duplicated content.
- **Results bars:** grow-in on mount, staggered.
- **Hover:** cards brighten border to `rgba(139,140,245,.4–.5)`; nav → subtle white fill.
- Respect `prefers-reduced-motion` in production: disable boot typewriter, aurora drift, marquee,
  glitch, and count-up (render final states).

## State Management
Prototype uses one `screen` string. In production:
- Routing = per-screen routes; `screen` maps to route.
- `booted` flag (localStorage) for the intro.
- Data (`projects`, `resultCats`, `ideas`, `teams`, `faqItems`, hackathon meta) → backend/API.
- Live view needs current-index + media state.

## Assets
- **Fonts:** Chakra Petch, Space Grotesk, JetBrains Mono (Google Fonts).
- **Icons:** currently emoji + simple CSS shapes/glyphs (`⌄ ⌕ ↻ ⬇ ● ■ ★ ◇`). Swap for the
  codebase's icon set (e.g. Lucide) in production.
- **Imagery:** all thumbnails/video are gradient/emoji placeholders — replace with real project
  screenshots and demo videos.
- **Logo:** gradient rounded-square mark; use the real Spyrosoft brand mark if available.

## Files
- `Garage OS.dc.html` — the complete high-fidelity prototype (all 12 views + shell + motion).
  Open in a browser to interact; read the `<helmet>` (tokens/keyframes) and the `Component`
  logic class (per-screen content data) as the implementation spec.
