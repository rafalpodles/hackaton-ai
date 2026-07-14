# Per-hackathon theme presets — design

## Goal
Let each hackathon pick its own visual theme (preset), selected by an admin, applied
to the whole `/h/[slug]` subtree. First alternative preset: **"poster"** — a light,
playful, pixel-font skin matching the AI-hackathon poster. Default preset **"garage"**
is the existing dark Garage OS look (no visual change).

This differs from the global Geocities easter-egg (which is app-wide, class-on-`<html>`);
themes are **per-hackathon**, chosen in admin, stored in the DB.

## Decisions (made autonomously per user request)
- **Fidelity:** full, faithful light skin (not just accent swap).
- **Scope:** the entire `/h/[slug]` subtree, including admin panels.
- **Mechanism (Approach A):** `data-theme` attribute on the hackathon layout root +
  a `[data-theme="poster"]` block in `globals.css` that redefines the color **tokens**
  to a light palette. Because most UI reads tokens (`bg-surface`, `text-on-surface`,
  `bg-primary`…), redefining tokens flips the bulk of the UI for free. Targeted
  overrides handle the rest.
- **Coverage of hardcoded colors:** the redesign hardcoded ~300 inline color literals
  that don't follow tokens. Where an inline literal exactly equals a token value
  (e.g. `rgba(14,14,21,.6)` == `--color-surface`@60, `white/10` == `--color-outline`,
  `#000`≈`--color-ink`), it was rewritten to the token utility — a **no-op for the
  dark theme**, themeable for poster. Literals with no dark-token equivalent (light
  accent text, semantic status colors, the sidebar active-nav gradient, dark terminal
  code blocks) are handled by explicit `[data-theme="poster"]` overrides.

## Data model
- Migration `026_hackathon_theme.sql`: `hackathons.theme text NOT NULL DEFAULT 'garage'`
  + CHECK `theme IN ('garage','poster')`. Idempotent.
- `types.ts`: `HackathonTheme = 'garage' | 'poster'`, `HACKATHON_THEMES` registry,
  `Hackathon.theme`.

## Application point
- `src/app/h/[slug]/layout.tsx`: `data-theme={hackathon.theme ?? "garage"}` on both the
  authed and unauthed layout roots. SSR-rendered, no hydration mismatch.

## Admin
- `hackathon-settings-form.tsx`: a button-group selector (mirrors the Status control)
  writing `theme` through the existing `updateHackathon` server action (whitelist extended).

## Theme CSS (`globals.css`)
- Pixel display font: `Pixelify_Sans` (latin + latin-ext for Polish) as `--font-pixel`,
  applied to `h1,h2,.font-display` under poster.
- `[data-theme="poster"]` redefines all color tokens to a light palette (white/paper
  surfaces, violet primary `#7c3aed`, royal-blue secondary `#2563eb`, dark ink text),
  plus overrides for: light page background, sidebar (`aside`), active nav item
  (inline-style links), gradient-text, results vote pill, ghost buttons, light accent
  texts, semantic status colors, and keeping the terminal code block dark with light text.

## Non-goals
- No per-hackathon *arbitrary* palettes (only named presets).
- Landing page (`/`) and its tiles are outside `/h/[slug]` and stay on the neutral look.

## Verification
- `npm run build` passes.
- Reviewed by a second agent for the dark-theme no-op invariant; two findings
  (ghost-button non-no-op, terminal code block contrast) fixed.
- Live browser verification was blocked in this environment; correctness rests on the
  build, the review, and the provable token-equivalence of every conversion.

## Rollout
- Migration `026` applied to the production DB (additive, default `garage` → no visual
  change to existing hackathons). To activate the skin on a hackathon: admin → settings →
  "Motyw wizualny" → Poster. Instantly reversible.
