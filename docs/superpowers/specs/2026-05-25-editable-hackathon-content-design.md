# Editable Per-Hackathon Content — Design

**Date:** 2026-05-25
**Status:** Approved, ready for implementation plan
**Context:** AI Hackathon Showcase platform — multi-hackathon support exists, but all hackathon-facing text (garage rules, FAQ, project ideas, useful prompts) is hardcoded in source files. New hackathons look identical to the first one. Admins need to edit these per-hackathon.

## Goals

- Admin can edit per-hackathon: Garage Rules, FAQ, Project Ideas, Useful Prompts, and hackathon description.
- New hackathon starts with a working set of default content (cloned from bundled defaults in code).
- Content lives in the database — no fallback to hardcoded values at runtime.
- Edit access is one click from each public content page (admin-only floating button).

## Non-goals

- Editing the technical Guide (`guideSteps` in `guide-data.ts`) — it's generic OS/tool setup, not per-hackathon.
- Cloning content from a previous hackathon (only bundled defaults supported in v1).
- Rich text WYSIWYG. Markdown only for free-form sections.
- Drag-and-drop reordering. Items reorder via numeric `display_order` field or up/down arrows.

## Data model

### New columns on `hackathons`

- `rules_content jsonb` — full Garage Rules structure (see schema below). Single JSONB because it's strictly 1:1 with hackathon, schema is known and stable.
- `description text` — already exists, currently empty default. Promoted to a markdown-editable field in admin Settings.

### New tables

```sql
CREATE TABLE public.hackathon_faq_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id  uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  slug          text NOT NULL,
  title         text NOT NULL,
  icon          text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  UNIQUE (hackathon_id, slug)
);
CREATE INDEX idx_faq_sections_hackathon ON public.hackathon_faq_sections(hackathon_id);

CREATE TABLE public.hackathon_faq_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    uuid NOT NULL REFERENCES public.hackathon_faq_sections(id) ON DELETE CASCADE,
  question      text NOT NULL,
  answer        text NOT NULL,
  display_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_faq_items_section ON public.hackathon_faq_items(section_id);

CREATE TABLE public.hackathon_project_ideas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id  uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text NOT NULL,
  tags          text[] NOT NULL DEFAULT '{}',
  display_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_project_ideas_hackathon ON public.hackathon_project_ideas(hackathon_id);

CREATE TABLE public.hackathon_prompts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id  uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  number        int NOT NULL,
  title         text NOT NULL,
  description   text NOT NULL,
  prompt        text NOT NULL,
  display_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_prompts_hackathon ON public.hackathon_prompts(hackathon_id);
```

### `RulesContent` JSONB schema (TypeScript source of truth)

```ts
export interface RulesContent {
  tagline: string;                 // "Nie buduj ładnego..."
  time_range: string;              // "15:00–19:00"
  what_is_md: string;              // markdown — "Czym jest" section body
  rules_cards: {
    number: string;                // "01", "02", ...
    title: string;
    description: string;
  }[];
  before_intro: string;
  before_checklist: string[];
  tokens_box_md: string;           // markdown — "Tokeny AI" callout
  dont_come_if: string[];          // "Nie przychodź żeby..."
  prizes: {
    icon_key: "energy" | "idea" | "value";
    title: string;
    description: string;
  }[];
  schedule: {
    time: string;
    title: string;
    location: string;
  }[];
  closing_callout_md: string;      // markdown — "Pizza & atmosphere" callout
}
```

Icon for prizes is a string key, not arbitrary SVG. View resolves `icon_key → <svg>` from a hardcoded map. Prevents unsafe HTML and keeps consistency.

## Defaults

Defaults live in source as plain TypeScript:

```
src/lib/defaults/
├── rules.ts        # export const DEFAULT_RULES: RulesContent
├── faq.ts          # export const DEFAULT_FAQ: { sections: ... }
├── ideas.ts        # export const DEFAULT_IDEAS: ProjectIdea[]
└── prompts.ts      # export const DEFAULT_PROMPTS: UsefulPrompt[]
```

Content is sourced from current `faq-data.ts`, `guide-data.ts` (the prompts + ideas sections), and `garage-rules-view.tsx` (rules — parsed into structured fields).

Defaults are **only** used at:
1. `createHackathon` — cloned to DB for the new hackathon.
2. Backfill script for existing hackathons (`ai-hackathon-1`).

After clone, the content is owned by the hackathon row. Defaults can later be updated in code (e.g., bumping prompts list) — future hackathons get new defaults, existing don't (intentional; admins manage their own).

## Clone-on-create

Extends `createHackathon` in `src/lib/actions/hackathons.ts`:

```ts
// Inside createHackathon, after INSERT hackathons
const { data: hackathon } = await supabase
  .from("hackathons")
  .insert({ ..., rules_content: DEFAULT_RULES })
  .select("id")
  .single();

await Promise.all([
  insertDefaultFaq(supabase, hackathon.id),
  insertDefaultIdeas(supabase, hackathon.id),
  insertDefaultPrompts(supabase, hackathon.id),
]);
```

FAQ requires two-step insert (sections, then items keyed to section ids). Helpers go in `src/lib/defaults/seed.ts`. Failure during seed: log error, don't fail hackathon create. Admin can re-seed via a "Reset to defaults" button on each content editor (later, not v1 unless trivial).

## Migration

`supabase/migrations/020_hackathon_content.sql`:
- `ALTER TABLE hackathons ADD COLUMN rules_content jsonb`
- `CREATE TABLE` x 4
- `CREATE INDEX` x 4

**Backfill script** `scripts/backfill-content.ts` (style mirrors existing [scripts/backfill-participants.ts](../../../scripts/backfill-participants.ts)):
- Reads `DEFAULT_RULES`, `DEFAULT_FAQ`, etc. from `src/lib/defaults/`
- For every hackathon where `rules_content IS NULL`: writes defaults
- For every hackathon with zero FAQ sections / ideas / prompts: inserts defaults
- Idempotent — re-running is safe.

Migration only creates schema. Script populates data. Clean separation.

## Server actions

New file `src/lib/actions/content.ts` (one file for all content types — they share patterns, ~400 LOC total). Functions:

```ts
// Rules
updateRules(hackathonId: string, content: RulesContent): Promise<{success?: true; error?: string}>

// FAQ
updateFaq(hackathonId: string, sections: FaqSectionInput[]): Promise<...>
// One bulk update — admin sees full FAQ, edits, hits Save. Replaces all sections+items for the hackathon (delete-then-insert in transaction-like sequence).

// Ideas
updateIdeas(hackathonId: string, ideas: ProjectIdeaInput[]): Promise<...>

// Prompts
updatePrompts(hackathonId: string, prompts: UsefulPromptInput[]): Promise<...>
```

All actions use the existing `requireAdmin` pattern (extracted to `src/lib/auth-guards.ts` as part of this change since we add three callers and the duplication noted in the audit is now blocking).

Server actions validate structure manually (no Zod — project doesn't use it; adding a runtime dep just for 4 endpoints isn't justified for this scope). Validation rules:
- All text fields trimmed, non-empty where required
- `display_order` clamped to int
- Markdown stored as-is (sanitization is on render via react-markdown's default HTML escaping)

`revalidatePath` after each save: `/h/[slug]/rules`, `/faq`, `/ideas`, `/prompts` as appropriate, plus `/h/[slug]/admin/content/...`.

## Rendering

- `src/lib/utils.ts` gets cached loaders: `getRulesContent(hackathonId)`, `getFaqForHackathon(hackathonId)`, `getIdeasForHackathon(hackathonId)`, `getPromptsForHackathon(hackathonId)`. All use `cache()` from React, all return defaults-shaped data.
- View components (`garage-rules-view.tsx`, `faq-view.tsx`, ideas page, prompts page) refactor to consume props from these loaders instead of importing static data.
- Markdown fields render through `react-markdown` + `remark-gfm`. Wrapped in a styled `<Markdown />` component in `src/components/ui/markdown.tsx` so the typography matches existing design tokens.
- No runtime fallback to bundled defaults. If DB is empty (post-create failure or admin nuked everything), render an empty state with a guidance message. Admin sees the edit button; participant sees "Brak treści w tej edycji".

## Admin UI

**Main admin page** (`/h/[slug]/admin`) — add a new section after "Kategorie głosowania":

```
┌─────────────────────────────────────────┐
│ Treści hackathonu                       │
│ ┌───────────────┬───────────────┐       │
│ │ 📋 Garage     │ ❓ FAQ        │       │
│ │ Rules         │ N sekcji      │       │
│ └───────────────┴───────────────┘       │
│ ┌───────────────┬───────────────┐       │
│ │ 💡 Pomysły    │ 🧠 Prompty    │       │
│ │ N pozycji     │ N pozycji     │       │
│ └───────────────┴───────────────┘       │
└─────────────────────────────────────────┘
```

**New routes:**
- `/h/[slug]/admin/content/rules`
- `/h/[slug]/admin/content/faq`
- `/h/[slug]/admin/content/ideas`
- `/h/[slug]/admin/content/prompts`

Each route is RSC loading data + a single client component with local form state. One "Zapisz" button per page; saves the entire payload via server action.

**Inline edit buttons** on public pages:
- New component `src/components/admin/admin-edit-button.tsx` — server component that checks `getCurrentUser()`, renders only for admins.
- Placement: fixed bottom-right, semi-transparent, themed pill button "✏️ Edytuj treść".
- Used on: `/h/[slug]/rules`, `/faq`, `/ideas`, `/prompts`.
- Hackathon `description` is small — edited in existing Settings form (no separate page).

**Editor patterns:**
- Rules: long structured form, grouped sections matching the view (Hero / What is / Rules cards / Before / Prizes / Schedule / Callout). Markdown fields use a plain `<textarea>` with monospace font. Cards/schedule items use repeating rows with up/down arrows + "Add" / "Remove" buttons. Min/max counts: rules_cards fixed 4 slots, prizes fixed 3 slots (to keep grid layout), schedule and lists are unbounded.
- FAQ: nested editor — list of sections (title + icon + items[]). Each section has its own items list. Reorder by `display_order` input.
- Ideas: flat table-like rows (name, description, tags as comma-separated input).
- Prompts: same flat rows (number, title, description, prompt — prompt is a multiline textarea).

## Settings form change

`HackathonSettingsForm` ([src/components/admin/hackathon-settings-form.tsx](../../../src/components/admin/hackathon-settings-form.tsx)) gets a new `description` textarea (markdown). Underlying `updateHackathon` already accepts `description` — only UI wiring needed.

## Dependencies

Add:
- `react-markdown` (latest)
- `remark-gfm` (latest)

Both ESM, RSC-safe, small. Alternative — a custom 50-line markdown renderer — was rejected because admin-edited content is the canonical authoring surface, and surprise output on a less-common construct (table, nested list) would erode trust.

## File-by-file summary

**New files:**
- `supabase/migrations/020_hackathon_content.sql`
- `scripts/backfill-content.ts`
- `src/lib/defaults/rules.ts`, `faq.ts`, `ideas.ts`, `prompts.ts`, `seed.ts`
- `src/lib/auth-guards.ts` (extracted shared `requireAdmin`)
- `src/lib/actions/content.ts`
- `src/components/ui/markdown.tsx`
- `src/components/admin/admin-edit-button.tsx`
- `src/components/admin/content-cards.tsx` (the 4-tile section)
- `src/components/admin/rules-editor.tsx`
- `src/components/admin/faq-editor.tsx`
- `src/components/admin/ideas-editor.tsx`
- `src/components/admin/prompts-editor.tsx`
- `src/app/h/[slug]/admin/content/rules/page.tsx`
- `src/app/h/[slug]/admin/content/faq/page.tsx`
- `src/app/h/[slug]/admin/content/ideas/page.tsx`
- `src/app/h/[slug]/admin/content/prompts/page.tsx`

**Modified:**
- `src/lib/types.ts` (RulesContent, FaqSection updates, etc.)
- `src/lib/utils.ts` (new cached loaders)
- `src/lib/actions/hackathons.ts` (clone-on-create + use auth-guards)
- `src/lib/actions/survey.ts`, `admin.ts` (use auth-guards)
- `src/components/rules/garage-rules-view.tsx` (consume RulesContent)
- `src/components/faq/faq-view.tsx` (consume sections from DB)
- `src/components/admin/hackathon-settings-form.tsx` (description field)
- `src/app/h/[slug]/admin/page.tsx` (add content cards section)
- Pages for `/h/[slug]/rules`, `/faq`, plus ideas/prompts pages (the latter currently global — promoted to per-hackathon under `/h/[slug]/ideas` and `/h/[slug]/prompts` if not already there)
- `package.json` (add react-markdown, remark-gfm)

**Deleted:**
- `src/lib/faq-data.ts` (after migration confirms DB has the content)

**Untouched:**
- `src/lib/guide-data.ts` keeps `guideSteps`, `CATEGORY_LABELS`, `SUBSCRIPTION_LABELS` (generic technical guide stays in code). The `usefulPrompts` and `projectIdeas` exports are deleted after backfill.

## Open implementation choices

- Whether `/ideas` and `/prompts` are global routes or per-hackathon: current layout has them under `(global)`, but content is per-hackathon. Implementation plan should resolve — either move under `/h/[slug]/` or keep route global and read from the "current hackathon" context (which doesn't exist for global routes). Recommendation: move under `/h/[slug]/`. Update sidebar nav accordingly.

## Testing strategy

- Manual smoke after each phase: build, log in as admin, edit rules, see change on public page.
- No automated tests added in this change — project has zero tests and adding a testing harness is out of scope here. Author note: a follow-up to add Vitest + a few server-action tests would be very high value (see audit).
