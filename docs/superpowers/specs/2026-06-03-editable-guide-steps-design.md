# Editable Per-Hackathon Guide Steps

**Date:** 2026-06-03
**Status:** Approved

## Problem

The guide (poradnik) at `/h/[slug]/guide` is entirely hardcoded in `src/lib/guide-data.ts`. Some steps are irrelevant for certain hackathons (e.g., a Qt hackathon needs Qt-specific setup instead of generic Node.js onboarding). Admins have no way to add hackathon-specific content.

## Solution

Extend the existing guide with per-hackathon custom steps stored in the database. Default steps from `guide-data.ts` remain unchanged and visible for all hackathons. Admins can add custom steps that appear at the end of their assigned category.

## Scope

- **In scope:** Add, edit, delete, reorder custom steps per hackathon; Markdown content with image upload to Supabase Storage; admin UI at `/h/[slug]/admin/content/guide`
- **Out of scope:** Hiding or reordering default steps; per-step beginner/advanced/subscription filtering for custom steps; global `/guide` page changes

## Database

New table `hackathon_guide_steps`:

```sql
CREATE TABLE hackathon_guide_steps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  category     text NOT NULL CHECK (category IN ('fundamenty', 'ai-tools', 'weryfikacja')),
  order_index  integer NOT NULL DEFAULT 0,
  title        text NOT NULL,
  content_md   text NOT NULL DEFAULT '',
  created_at   timestamptz DEFAULT now()
);
```

New Supabase Storage bucket: `guide-images` (public). File path pattern: `{hackathon_id}/{uuid}.{ext}`.

## Admin UI

Route: `/h/[slug]/admin/content/guide`

Features:
- List of custom steps for the hackathon
- Add step: inline form with category select, title input, Markdown textarea, image upload button
- Edit step: expandable panel per step with the same fields
- Reorder: ↑ ↓ buttons per step (within same category)
- Delete: button with confirmation

Image upload flow: admin picks a file → `uploadGuideImage` uploads to Storage → returns public URL → frontend inserts `![](url)` at cursor position in the Markdown textarea.

Navigation: "Poradnik" link added to the admin content sidebar alongside Reguły / FAQ / Pomysły / Prompty.

Pattern: follows existing `RulesEditor` / `IdeasEditor` conventions — server actions, `revalidatePath`, minimal client state.

## Server Actions

Added to `src/lib/actions/content.ts`:

```typescript
createGuideStep(hackathonId, { category, title, content_md, order_index })
updateGuideStep(stepId, hackathonId, { category, title, content_md, order_index })
deleteGuideStep(stepId, hackathonId)
reorderGuideSteps(hackathonId, steps: { id, order_index }[])
uploadGuideImage(hackathonId, file: File): Promise<string> // returns public URL
```

All actions verify server-side that the calling user is an admin of the given hackathon.

New helper in `src/lib/utils.ts`: `getHackathonGuideSteps(hackathonId)` — fetches custom steps sorted by `order_index`.

## Public View

- `/h/[slug]/guide` — fetches custom steps server-side, passes as prop to `GuideView`
- `/guide` (global) — no change, shows only default steps

Custom steps render after default steps within their category, sorted by `order_index`. New `CustomGuideStep` component renders title + `react-markdown` content (with standard `<img>` support via Tailwind prose). Custom steps are visually distinguished (subtle badge or border) so admins can identify them.

Custom steps are always visible regardless of selected path (beginner/advanced) or subscription filter.

## Files Affected

| File | Change |
|------|--------|
| `supabase/migrations/024_hackathon_guide_steps.sql` | New table + Storage bucket policy |
| `src/lib/types.ts` | Add `HackathonGuideStep` type |
| `src/lib/utils.ts` | Add `getHackathonGuideSteps()` |
| `src/lib/actions/content.ts` | Add 5 new actions |
| `src/app/h/[slug]/guide/page.tsx` | Fetch and pass custom steps |
| `src/components/guide/guide-view.tsx` | Accept and render custom steps per category |
| `src/components/guide/custom-guide-step.tsx` | New component (Markdown renderer) |
| `src/app/h/[slug]/admin/content/guide/page.tsx` | New admin page |
| `src/components/admin/guide-editor.tsx` | New editor component |
| `src/app/h/[slug]/admin/content/layout.tsx` (or nav) | Add "Poradnik" link |
