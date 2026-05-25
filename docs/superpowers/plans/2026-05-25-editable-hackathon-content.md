# Editable Per-Hackathon Content — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all hackathon-specific content (Garage Rules, FAQ, Project Ideas, Useful Prompts, description) editable per hackathon via admin UI. New hackathons start from bundled defaults; existing ones get backfilled.

**Architecture:** Add `rules_content jsonb` to `hackathons` plus three normalized tables for FAQ/ideas/prompts. Bundled defaults live in `src/lib/defaults/*.ts` and are cloned to DB on `createHackathon`. Public views read content from DB (no runtime fallback to code). Admin edits via dedicated sub-routes under `/h/[slug]/admin/content/...`; each public content page gets an admin-only floating "✏️ Edytuj" button linking to the editor.

**Tech Stack:** Next.js 16 (App Router, RSC, Server Actions), Supabase (Postgres, service_role server-side), Tailwind v4, TypeScript. Adds `react-markdown` + `remark-gfm` for rendering markdown fields.

**Spec:** `docs/superpowers/specs/2026-05-25-editable-hackathon-content-design.md`

---

## File structure

**New files:**

| Path | Purpose |
|---|---|
| `supabase/migrations/020_hackathon_content.sql` | Schema: rules_content column + 4 new tables + indexes |
| `scripts/backfill-content.ts` | One-shot: seed defaults into all existing hackathons |
| `src/lib/defaults/rules.ts` | `DEFAULT_RULES: RulesContent` — parsed from current garage-rules-view |
| `src/lib/defaults/faq.ts` | `DEFAULT_FAQ` — moved from faq-data.ts |
| `src/lib/defaults/ideas.ts` | `DEFAULT_IDEAS` — moved from guide-data.ts |
| `src/lib/defaults/prompts.ts` | `DEFAULT_PROMPTS` — moved from guide-data.ts |
| `src/lib/defaults/seed.ts` | `seedHackathonContent(supabase, hackathonId)` helper |
| `src/lib/auth-guards.ts` | Shared `requireAdmin()` — extracted from 3 dup'd copies |
| `src/lib/actions/content.ts` | Server actions: updateRules/updateFaq/updateIdeas/updatePrompts |
| `src/components/ui/markdown.tsx` | Styled `<Markdown>` wrapper over react-markdown + remark-gfm |
| `src/components/admin/admin-edit-button.tsx` | Floating server-side gated "Edytuj" button |
| `src/components/admin/content-cards.tsx` | 4 tile section on main admin page |
| `src/components/admin/rules-editor.tsx` | Structured form for RulesContent |
| `src/components/admin/faq-editor.tsx` | Nested sections + items editor |
| `src/components/admin/ideas-editor.tsx` | List editor (name/desc/tags) |
| `src/components/admin/prompts-editor.tsx` | List editor (number/title/desc/prompt) |
| `src/app/h/[slug]/admin/content/rules/page.tsx` | RSC + editor mount |
| `src/app/h/[slug]/admin/content/faq/page.tsx` | RSC + editor mount |
| `src/app/h/[slug]/admin/content/ideas/page.tsx` | RSC + editor mount |
| `src/app/h/[slug]/admin/content/prompts/page.tsx` | RSC + editor mount |
| `src/app/h/[slug]/ideas/page.tsx` | Per-hackathon ideas page (moved from global) |
| `src/app/h/[slug]/prompts/page.tsx` | Per-hackathon prompts page (moved from global) |

**Modified files:**

| Path | Change |
|---|---|
| `src/lib/types.ts` | Add `RulesContent`, `FaqSection`, `FaqItem`, `ProjectIdea`, `UsefulPrompt`; extend `Hackathon` with `rules_content` |
| `src/lib/utils.ts` | Add cached loaders: `getRulesContent`, `getFaqForHackathon`, `getIdeasForHackathon`, `getPromptsForHackathon` |
| `src/lib/actions/hackathons.ts` | Use `auth-guards.requireAdmin`; clone defaults in `createHackathon` |
| `src/lib/actions/admin.ts` | Use `auth-guards.requireAdmin` |
| `src/lib/actions/survey.ts` | Use `auth-guards.requireAdmin` |
| `src/components/rules/garage-rules-view.tsx` | Consume `RulesContent` prop instead of hardcoded JSX |
| `src/components/faq/faq-view.tsx` | Consume `FaqSection[]` prop |
| `src/components/admin/hackathon-settings-form.tsx` | Description textarea already exists — verify markdown rendering hint |
| `src/app/h/[slug]/rules/page.tsx` | Load `RulesContent` from DB, pass to view, add edit button |
| `src/app/h/[slug]/faq/page.tsx` | Load FAQ from DB, pass to view, add edit button |
| `src/app/(global)/prompts/page.tsx` | DELETE (replaced by per-hackathon route) |
| `src/components/layout/sidebar.tsx` | Update nav links for ideas/prompts |
| `src/app/h/[slug]/admin/page.tsx` | Add content-cards section |
| `package.json` | Add `react-markdown`, `remark-gfm` |

**Deleted files:**

| Path | When |
|---|---|
| `src/lib/faq-data.ts` | After Task 11 confirms FAQ renders from DB |
| `src/app/(global)/prompts/page.tsx` | Replaced by per-hackathon route (Task 13) |
| Exports `usefulPrompts`, `projectIdeas` from `src/lib/guide-data.ts` | After Task 13 |

---

## Task 1: DB schema migration

**Files:**
- Create: `supabase/migrations/020_hackathon_content.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- ============================================================
-- 020: Editable per-hackathon content
-- Adds rules_content JSONB and normalized FAQ/ideas/prompts tables.
-- ============================================================

ALTER TABLE public.hackathons ADD COLUMN rules_content jsonb;

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

- [ ] **Step 2: Apply migration to local Supabase**

Run: `npx supabase migration up --local` if local Supabase is running. If running against remote project, the migration file is applied by `npx supabase db push` per existing project conventions. Verify migration file is committed; actual deploy happens via existing migration pipeline.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/020_hackathon_content.sql
git commit -m "feat(db): add tables for editable hackathon content"
```

---

## Task 2: TypeScript types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add new types and extend `Hackathon`**

Append to [src/lib/types.ts](src/lib/types.ts):

```ts
export interface RulesContent {
  tagline: string;
  time_range: string;
  what_is_md: string;
  rules_cards: {
    number: string;
    title: string;
    description: string;
  }[];
  before_intro: string;
  before_checklist: string[];
  tokens_box_md: string;
  dont_come_if: string[];
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
  closing_callout_md: string;
}

export interface FaqItem {
  id: string;
  section_id: string;
  question: string;
  answer: string;
  display_order: number;
}

export interface FaqSection {
  id: string;
  hackathon_id: string;
  slug: string;
  title: string;
  icon: string;
  display_order: number;
}

export interface FaqSectionWithItems extends FaqSection {
  items: FaqItem[];
}

export interface ProjectIdea {
  id: string;
  hackathon_id: string;
  name: string;
  description: string;
  tags: string[];
  display_order: number;
}

export interface UsefulPrompt {
  id: string;
  hackathon_id: string;
  number: number;
  title: string;
  description: string;
  prompt: string;
  display_order: number;
}
```

Also extend the existing `Hackathon` interface by adding this field (locate the interface and add the field):

```ts
  rules_content: RulesContent | null;
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS. If errors about `rules_content` in other files, that's expected for later tasks — just ensure `types.ts` itself compiles.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add RulesContent, FaqSection, ProjectIdea, UsefulPrompt"
```

---

## Task 3: Defaults — Rules

**Files:**
- Create: `src/lib/defaults/rules.ts`

This task transcribes the current hardcoded content from [garage-rules-view.tsx](src/components/rules/garage-rules-view.tsx) into a `RulesContent` constant.

- [ ] **Step 1: Create defaults/rules.ts**

Source: `src/components/rules/garage-rules-view.tsx` lines 17-208. Map each section to the `RulesContent` shape:

```ts
import type { RulesContent } from "@/lib/types";

export const DEFAULT_RULES: RulesContent = {
  tagline: "Nie buduj ładnego. Buduj użytecznego.",
  time_range: "15:00–19:00",
  what_is_md:
    "~3h warsztat budowania **realnych rzeczy z AI**. Nie event teoretyczny. Nie prezentacja slajdów. Zero teorii o modelach. Tylko praktyka.\n\n" +
    "- Solo lub grupy 2–5 osób\n" +
    "- Otwarte dla wszystkich — nie tylko developerzy. QA, PM, Backoffice — każdy mile widziany\n" +
    "- Cel: pokazać, że **każdy może zbudować coś użytecznego** z pomocą AI",
  rules_cards: [
    {
      number: "01",
      title: "Vibecoduj",
      description: "Buduj aplikację bez głębokiego pisania kodu. AI pisze — Ty sterujesz.",
    },
    {
      number: "02",
      title: "Nowy projekt",
      description: "Stwórz coś nowego. Nie kontynuuj starych projektów.",
    },
    {
      number: "03",
      title: "Liczy się pomysł + AI",
      description: "Nie oceniamy jakości kodu. Liczy się pomysł i to, jak wykorzystałeś AI.",
    },
    {
      number: "04",
      title: "Automatyzuj irytacje",
      description: "Jeśli coś Cię irytuje w codziennej pracy — zautomatyzuj to. To jest ten moment.",
    },
  ],
  before_intro:
    "Hackathon to czas na budowanie, nie na konfigurację. Przygotuj się wcześniej.",
  before_checklist: [
    "Firmowy laptop (nie prywatny)",
    "Sieć firmowa (nie hotspot)",
    "Zalogowane narzędzie AI — sprawdź **przed** hackatonem",
    "Możliwość instalowania paczek",
    "Konto GitHub — załóż wcześniej jeśli nie masz",
    "Przyjdź z **pełnym limitem tokenów** — nie zużywaj ich wcześniej tego dnia",
  ],
  tokens_box_md:
    "Każdy uczestnik otrzyma **API key** jeśli nie ma subskrypcji lub skończą mu się limity podczas hackathonu. " +
    "Limit: **$5 na tokeny** per osoba. Klucz znajdziesz w swoim [profilu](/profile).",
  dont_come_if: [
    "Instalować wszystko od zera",
    "Pracować na prywatnym komputerze",
    "Łączyć się przez hotspot",
  ],
  prizes: [
    {
      icon_key: "energy",
      title: "Droga od koncepcji do realizacji",
      description: "Jak doszedłeś od pomysłu do działającego projektu",
    },
    {
      icon_key: "idea",
      title: "Kreatywność pomysłu",
      description: "Oryginalność i nieszablonowe podejście",
    },
    {
      icon_key: "value",
      title: "Przydatność / wartość użytkowa",
      description: "Coś, co realnie rozwiązuje problem w pracy",
    },
  ],
  schedule: [
    {
      time: "15:00 – 15:15",
      title: "Wprowadzenie",
      location: "Sky Garden",
    },
    {
      time: "15:15 – 18:15",
      title: "3h hackowania!",
      location: "Wszystkie przestrzenie wspólne — Sky Garden i Ahoy",
    },
    {
      time: "18:15 – 18:30",
      title: "Zakończenie i rozpoczęcie głosowania",
      location: "Sky Garden",
    },
  ],
  closing_callout_md:
    "Nie możesz być od początku? Spoko — prezentacja z wprowadzenia będzie **dostępna online**, więc możesz dołączyć i zacząć hackować, kiedy tylko będziesz dostępny.\n\n" +
    "Będzie **pizza** 🍕 — zadbamy o to, żebyście nie hackowali na głodniaka. Zależy nam na **luźnej atmosferze** — to ma być frajda, nie korpo-event. Przyjdź, baw się, buduj.",
};
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS. No consumers yet, just the constant.

- [ ] **Step 3: Commit**

```bash
git add src/lib/defaults/rules.ts
git commit -m "feat(defaults): extract DEFAULT_RULES from garage-rules-view"
```

---

## Task 4: Defaults — FAQ

**Files:**
- Create: `src/lib/defaults/faq.ts`

- [ ] **Step 1: Create defaults/faq.ts**

Open [src/lib/faq-data.ts](src/lib/faq-data.ts) and copy the `faqSections` array into the new file under a new typed constant. The structure changes slightly: each section needs a stable `slug` (use the existing `id` field as `slug`) and items don't have IDs yet (server will assign on insert).

```ts
export interface DefaultFaqItem {
  question: string;
  answer: string;
}

export interface DefaultFaqSection {
  slug: string;
  title: string;
  icon: string;
  items: DefaultFaqItem[];
}

export const DEFAULT_FAQ: DefaultFaqSection[] = [
  // Copy each section from faq-data.ts faqSections:
  // { slug: <id>, title, icon, items: [{question, answer}, ...] }
  // ... 10 sections total — see faq-data.ts for full content
];
```

Transcribe all 10 sections from [src/lib/faq-data.ts](src/lib/faq-data.ts) verbatim. Map `id → slug`, drop nothing else. Keep section order. Preserve all `\n` and `**` markdown in answers.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/defaults/faq.ts
git commit -m "feat(defaults): extract DEFAULT_FAQ from faq-data"
```

---

## Task 5: Defaults — Ideas and Prompts

**Files:**
- Create: `src/lib/defaults/ideas.ts`
- Create: `src/lib/defaults/prompts.ts`

- [ ] **Step 1: Create defaults/ideas.ts**

Copy from [src/lib/guide-data.ts](src/lib/guide-data.ts) line 939 (`projectIdeas` array) into:

```ts
export interface DefaultProjectIdea {
  name: string;
  description: string;
  tags: string[];
}

export const DEFAULT_IDEAS: DefaultProjectIdea[] = [
  // Copy all 10 entries from guide-data.ts projectIdeas verbatim:
  // { name, description, tags }
];
```

- [ ] **Step 2: Create defaults/prompts.ts**

Copy from [src/lib/guide-data.ts](src/lib/guide-data.ts) line 892 (`usefulPrompts` array):

```ts
export interface DefaultUsefulPrompt {
  number: number;
  title: string;
  description: string;
  prompt: string;
}

export const DEFAULT_PROMPTS: DefaultUsefulPrompt[] = [
  // Copy all 5 entries from guide-data.ts usefulPrompts verbatim:
  // { number, title, description, prompt }
];
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/defaults/ideas.ts src/lib/defaults/prompts.ts
git commit -m "feat(defaults): extract DEFAULT_IDEAS and DEFAULT_PROMPTS"
```

---

## Task 6: Auth guards extraction

**Files:**
- Create: `src/lib/auth-guards.ts`
- Modify: `src/lib/actions/admin.ts:8-12` (remove inline `requireAdmin`)
- Modify: `src/lib/actions/hackathons.ts:8-12` (remove inline `requireAdmin`)
- Modify: `src/lib/actions/survey.ts:8-12` (remove inline `requireAdmin`)

- [ ] **Step 1: Create auth-guards.ts**

```ts
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import type { Profile } from "@/lib/types";

/**
 * Throws if not logged in as global admin.
 * Returns the admin profile on success.
 */
export async function requireAdmin(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Brak dostępu");
  return user;
}

/**
 * Throws if not a participant of the given hackathon.
 * Returns the user profile on success.
 */
export async function requireParticipant(hackathonId: string): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Musisz być zalogowany");
  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();
  if (!participant) throw new Error("Nie jesteś uczestnikiem tego hackathonu");
  return user;
}
```

- [ ] **Step 2: Replace dup'd requireAdmin in admin.ts**

In [src/lib/actions/admin.ts](src/lib/actions/admin.ts) remove the local `async function requireAdmin()` definition at lines 8-12 and add this import at the top:

```ts
import { requireAdmin } from "@/lib/auth-guards";
```

- [ ] **Step 3: Replace dup'd requireAdmin in hackathons.ts**

In [src/lib/actions/hackathons.ts](src/lib/actions/hackathons.ts) remove the local `async function requireAdmin()` at lines 8-12 and add at the top:

```ts
import { requireAdmin } from "@/lib/auth-guards";
```

- [ ] **Step 4: Replace dup'd requireAdmin / requireParticipant in survey.ts**

In [src/lib/actions/survey.ts](src/lib/actions/survey.ts) remove local `requireAdmin` (lines 8-12) and `requireParticipant` (lines 14-26). Add:

```ts
import { requireAdmin, requireParticipant } from "@/lib/auth-guards";
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: PASS. No behavior change — pure refactor.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth-guards.ts src/lib/actions/admin.ts src/lib/actions/hackathons.ts src/lib/actions/survey.ts
git commit -m "refactor: extract requireAdmin/requireParticipant to auth-guards"
```

---

## Task 7: Seed helper

**Files:**
- Create: `src/lib/defaults/seed.ts`

- [ ] **Step 1: Implement seed helper**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_RULES } from "./rules";
import { DEFAULT_FAQ } from "./faq";
import { DEFAULT_IDEAS } from "./ideas";
import { DEFAULT_PROMPTS } from "./prompts";

/**
 * Seeds bundled defaults for a hackathon. Idempotent per content type:
 * - Rules: writes only if rules_content is currently null.
 * - FAQ: skips if any sections already exist for this hackathon.
 * - Ideas/Prompts: same — skip if any rows exist.
 */
export async function seedHackathonContent(
  supabase: SupabaseClient,
  hackathonId: string
): Promise<{ rules: boolean; faq: boolean; ideas: boolean; prompts: boolean }> {
  const result = { rules: false, faq: false, ideas: false, prompts: false };

  // Rules
  const { data: h } = await supabase
    .from("hackathons")
    .select("rules_content")
    .eq("id", hackathonId)
    .single();
  if (h && h.rules_content === null) {
    await supabase
      .from("hackathons")
      .update({ rules_content: DEFAULT_RULES })
      .eq("id", hackathonId);
    result.rules = true;
  }

  // FAQ
  const { data: existingSections } = await supabase
    .from("hackathon_faq_sections")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .limit(1);
  if (!existingSections || existingSections.length === 0) {
    for (let i = 0; i < DEFAULT_FAQ.length; i++) {
      const section = DEFAULT_FAQ[i];
      const { data: inserted } = await supabase
        .from("hackathon_faq_sections")
        .insert({
          hackathon_id: hackathonId,
          slug: section.slug,
          title: section.title,
          icon: section.icon,
          display_order: i,
        })
        .select("id")
        .single();
      if (inserted) {
        const itemRows = section.items.map((item, idx) => ({
          section_id: inserted.id,
          question: item.question,
          answer: item.answer,
          display_order: idx,
        }));
        if (itemRows.length > 0) {
          await supabase.from("hackathon_faq_items").insert(itemRows);
        }
      }
    }
    result.faq = true;
  }

  // Ideas
  const { data: existingIdeas } = await supabase
    .from("hackathon_project_ideas")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .limit(1);
  if (!existingIdeas || existingIdeas.length === 0) {
    await supabase.from("hackathon_project_ideas").insert(
      DEFAULT_IDEAS.map((idea, i) => ({
        hackathon_id: hackathonId,
        name: idea.name,
        description: idea.description,
        tags: idea.tags,
        display_order: i,
      }))
    );
    result.ideas = true;
  }

  // Prompts
  const { data: existingPrompts } = await supabase
    .from("hackathon_prompts")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .limit(1);
  if (!existingPrompts || existingPrompts.length === 0) {
    await supabase.from("hackathon_prompts").insert(
      DEFAULT_PROMPTS.map((p, i) => ({
        hackathon_id: hackathonId,
        number: p.number,
        title: p.title,
        description: p.description,
        prompt: p.prompt,
        display_order: i,
      }))
    );
    result.prompts = true;
  }

  return result;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/defaults/seed.ts
git commit -m "feat(defaults): seedHackathonContent helper"
```

---

## Task 8: Clone-on-create + backfill script

**Files:**
- Modify: `src/lib/actions/hackathons.ts:14-40` (createHackathon)
- Create: `scripts/backfill-content.ts`

- [ ] **Step 1: Wire seed into createHackathon**

In [src/lib/actions/hackathons.ts](src/lib/actions/hackathons.ts) modify `createHackathon` so that:
1. The INSERT also writes `rules_content: DEFAULT_RULES`
2. After insert succeeds, seed FAQ/ideas/prompts (using `seedHackathonContent` — except rules already written above)
3. On seed failure, log to console but do not throw (clone-on-create should not block hackathon creation)

Add imports at top:
```ts
import { DEFAULT_RULES } from "@/lib/defaults/rules";
import { seedHackathonContent } from "@/lib/defaults/seed";
```

Replace the body of `createHackathon`:
```ts
export async function createHackathon(data: {
  name: string;
  slug: string;
  description: string;
  hackathon_date: string | null;
}) {
  await requireAdmin();
  const supabase = await createClient();

  const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  const { data: inserted, error } = await supabase
    .from("hackathons")
    .insert({
      name: data.name,
      slug,
      description: data.description,
      hackathon_date: data.hackathon_date,
      rules_content: DEFAULT_RULES,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    if (error?.message.includes("duplicate")) throw new Error("Slug jest już zajęty");
    throw new Error("Nie udało się utworzyć hackathonu");
  }

  try {
    await seedHackathonContent(supabase, inserted.id);
  } catch (e) {
    console.error("Failed to seed default content for hackathon", inserted.id, e);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/");
}
```

- [ ] **Step 2: Create backfill script**

```ts
// scripts/backfill-content.ts
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { seedHackathonContent } from "../src/lib/defaults/seed";

config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_DEFAULT_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_DEFAULT_KEY");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const { data: hackathons, error } = await supabase.from("hackathons").select("id, slug, name");
  if (error || !hackathons) {
    console.error("Failed to load hackathons:", error);
    process.exit(1);
  }

  for (const h of hackathons) {
    console.log(`Seeding content for "${h.name}" (${h.slug})...`);
    const result = await seedHackathonContent(supabase, h.id);
    console.log(`  rules=${result.rules} faq=${result.faq} ideas=${result.ideas} prompts=${result.prompts}`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Check if `dotenv` is on the classpath:

Run: `node -e "require.resolve('dotenv')" 2>&1 | head -5`

If "Cannot find module" — install it as a devDependency (it's a tiny standard package and other scripts in `scripts/` likely use it; pattern of other backfill scripts in this repo should be followed):

Run: `cat scripts/backfill-participants.ts | head -20`

If `backfill-participants.ts` uses `dotenv`, then `dotenv` is already in package.json. If not — check what env-loading pattern other scripts use, and follow it instead of installing `dotenv`. Adapt the env loading in `backfill-content.ts` accordingly.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Run backfill against current DB**

Run: `npx tsx scripts/backfill-content.ts`

(Use whatever script runner the existing scripts use — check `package.json` and `scripts/` for the pattern. Most likely `tsx` or `ts-node`.)

Expected: outputs `Seeding content for "Spyrosoft AI Hackathon #1" ... rules=true faq=true ideas=true prompts=true` (or `false` for whichever was already populated).

- [ ] **Step 5: Verify in Supabase**

Manually check via Supabase dashboard or `psql`:
- `SELECT id, name, rules_content IS NOT NULL FROM hackathons` — all rows should be `true`
- `SELECT COUNT(*) FROM hackathon_faq_sections` — should be 10 × number of hackathons
- `SELECT COUNT(*) FROM hackathon_project_ideas` — 10 × N
- `SELECT COUNT(*) FROM hackathon_prompts` — 5 × N

- [ ] **Step 6: Commit**

```bash
git add src/lib/actions/hackathons.ts scripts/backfill-content.ts
git commit -m "feat(hackathons): clone default content on create + backfill script"
```

---

## Task 9: Cached loaders in utils.ts

**Files:**
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Add cached loaders**

Append to [src/lib/utils.ts](src/lib/utils.ts):

```ts
import type {
  RulesContent,
  FaqSectionWithItems,
  ProjectIdea,
  UsefulPrompt,
} from "@/lib/types";

export const getRulesContent = cache(
  async (hackathonId: string): Promise<RulesContent | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hackathons")
      .select("rules_content")
      .eq("id", hackathonId)
      .single();
    return (data?.rules_content as RulesContent | null) ?? null;
  }
);

export const getFaqForHackathon = cache(
  async (hackathonId: string): Promise<FaqSectionWithItems[]> => {
    const supabase = await createClient();
    const { data: sections } = await supabase
      .from("hackathon_faq_sections")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("display_order");

    if (!sections || sections.length === 0) return [];

    const { data: items } = await supabase
      .from("hackathon_faq_items")
      .select("*")
      .in(
        "section_id",
        sections.map((s) => s.id)
      )
      .order("display_order");

    const itemsBySection = new Map<string, FaqSectionWithItems["items"]>();
    for (const it of items ?? []) {
      const arr = itemsBySection.get(it.section_id) ?? [];
      arr.push(it);
      itemsBySection.set(it.section_id, arr);
    }

    return sections.map((s) => ({
      ...s,
      items: itemsBySection.get(s.id) ?? [],
    }));
  }
);

export const getIdeasForHackathon = cache(
  async (hackathonId: string): Promise<ProjectIdea[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hackathon_project_ideas")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("display_order");
    return (data ?? []) as ProjectIdea[];
  }
);

export const getPromptsForHackathon = cache(
  async (hackathonId: string): Promise<UsefulPrompt[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hackathon_prompts")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("display_order");
    return (data ?? []) as UsefulPrompt[];
  }
);
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat(utils): add cached loaders for hackathon content"
```

---

## Task 10: Markdown component

**Files:**
- Create: `src/components/ui/markdown.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

Run: `npm install react-markdown remark-gfm`

Expected: package.json updated, no errors.

- [ ] **Step 2: Create Markdown wrapper**

```tsx
// src/components/ui/markdown.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div
      className={
        className ??
        "prose-invert space-y-3 text-on-surface/80 [&_a]:text-primary-dim [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary [&_strong]:font-semibold [&_strong]:text-on-surface [&_ul]:ml-4 [&_ul]:list-disc [&_ol]:ml-4 [&_ol]:list-decimal [&_code]:rounded [&_code]:bg-surface-high [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs"
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/markdown.tsx package.json package-lock.json
git commit -m "feat(ui): add Markdown component (react-markdown + gfm)"
```

---

## Task 11: Refactor garage-rules-view + rules page

**Files:**
- Modify: `src/components/rules/garage-rules-view.tsx`
- Modify: `src/app/h/[slug]/rules/page.tsx`
- Read: `src/app/(global)/rules/page.tsx` — check if it still needed; if it's the same content, delete or redirect

- [ ] **Step 1: Refactor garage-rules-view to consume RulesContent**

Rewrite [src/components/rules/garage-rules-view.tsx](src/components/rules/garage-rules-view.tsx). Keep all sub-components (Section, RuleCard, CheckItem, PrizeCard, TimelineItem) but replace the hardcoded JSX with rendering from the prop:

```tsx
"use client";

import type { RulesContent } from "@/lib/types";
import { Markdown } from "@/components/ui/markdown";

interface GarageRulesViewProps {
  hackathonDate: string | null;
  content: RulesContent;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const PRIZE_ICONS: Record<RulesContent["prizes"][number]["icon_key"], React.ReactNode> = {
  energy: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  idea: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  value: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-3.06a1.5 1.5 0 01-.75-1.3V6.75a1.5 1.5 0 01.75-1.3l5.1-3.06a1.5 1.5 0 011.5 0l5.1 3.06a1.5 1.5 0 01.75 1.3v4.06a1.5 1.5 0 01-.75 1.3l-5.1 3.06a1.5 1.5 0 01-1.5 0z" />
    </svg>
  ),
};

export function GarageRulesView({ hackathonDate, content }: GarageRulesViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-16 pb-20">
      <section className="space-y-4 pt-4 text-center">
        <h1 className="bg-gradient-to-r from-primary-dim to-secondary bg-clip-text font-space-grotesk text-5xl font-black uppercase tracking-wider text-transparent sm:text-6xl">
          Garage Rules
        </h1>
        <p className="text-xl font-medium text-on-surface">{content.tagline}</p>
        {hackathonDate && (
          <p className="font-space-grotesk text-sm uppercase tracking-widest text-on-surface-muted">
            {formatDate(hackathonDate)} &bull; {content.time_range}
          </p>
        )}
      </section>

      <Section title="Czym jest ten hackathon">
        <Markdown>{content.what_is_md}</Markdown>
      </Section>

      <Section title="Zasady gry">
        <div className="grid gap-4 sm:grid-cols-2">
          {content.rules_cards.map((card) => (
            <RuleCard key={card.number} emoji={card.number} title={card.title}>
              {card.description}
            </RuleCard>
          ))}
        </div>
      </Section>

      <Section title="Zanim przyjdziesz">
        <p className="mb-6 text-on-surface/60">{content.before_intro}</p>

        <div className="space-y-3">
          {content.before_checklist.map((item, i) => (
            <CheckItem key={i} checked>
              <Markdown className="inline">{item}</Markdown>
            </CheckItem>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-secondary/20 bg-secondary/5 p-5">
          <p className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-secondary-dim">
            Tokeny AI
          </p>
          <div className="mt-2">
            <Markdown>{content.tokens_box_md}</Markdown>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-red-400">
            Nie przychodź żeby
          </p>
          <ul className="mt-2 space-y-1 text-on-surface/70">
            {content.dont_come_if.map((item, i) => (
              <li key={i}>&bull; {item}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="Nagrody">
        <p className="mb-6 text-on-surface/60">3 kategorie, 3 zwycięzców.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {content.prizes.map((p, i) => (
            <PrizeCard
              key={i}
              icon={PRIZE_ICONS[p.icon_key]}
              title={p.title}
              description={p.description}
            />
          ))}
        </div>
      </Section>

      <Section title="Harmonogram">
        <div className="relative space-y-0">
          {content.schedule.map((item, i) => (
            <TimelineItem
              key={i}
              time={item.time}
              title={item.title}
              location={item.location}
              last={i === content.schedule.length - 1}
            />
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-primary-dim">
            Pizza &amp; luźna atmosfera
          </p>
          <div className="mt-2">
            <Markdown>{content.closing_callout_md}</Markdown>
          </div>
        </div>
      </Section>
    </div>
  );
}
```

Keep the existing `Section`, `RuleCard`, `CheckItem`, `PrizeCard`, `TimelineItem` sub-components below the main export — copy them from the current file verbatim. Drop the `Strong` and `BulletItem` helpers (markdown handles `**bold**` and `-` bullets now).

- [ ] **Step 2: Update rules page to load from DB**

Open [src/app/h/[slug]/rules/page.tsx](src/app/h/[slug]/rules/page.tsx) (read it first), then rewrite to:
1. Resolve hackathon via slug
2. Load `RulesContent` via `getRulesContent`
3. If null → empty state
4. Otherwise pass to `<GarageRulesView />`

Pattern (adapt as needed):
```tsx
import { notFound } from "next/navigation";
import { getHackathonBySlug, getRulesContent } from "@/lib/utils";
import { GarageRulesView } from "@/components/rules/garage-rules-view";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function RulesPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const rules = await getRulesContent(hackathon.id);
  if (!rules) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center text-on-surface-muted">
        Brak treści dla tej edycji. Administrator może je dodać w panelu admina.
      </div>
    );
  }

  return <GarageRulesView hackathonDate={hackathon.hackathon_date} content={rules} />;
}
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Then: `npm run dev`, open `/h/ai-hackathon-1/rules`, confirm page renders identically to before (visual diff vs. previous version).

- [ ] **Step 4: Commit**

```bash
git add src/components/rules/garage-rules-view.tsx src/app/h/[slug]/rules/page.tsx
git commit -m "feat(rules): consume RulesContent from DB"
```

---

## Task 12: Refactor faq-view + faq page

**Files:**
- Modify: `src/components/faq/faq-view.tsx`
- Modify: `src/app/h/[slug]/faq/page.tsx`
- Modify: `src/app/(global)/faq/page.tsx` (decide: keep as redirect or delete — see Step 3)

- [ ] **Step 1: Read current faq-view and faq page**

Run: `cat src/components/faq/faq-view.tsx src/app/h/[slug]/faq/page.tsx src/app/\(global\)/faq/page.tsx`

Understand current shape: faq-view consumes the `faqSections` import directly. After refactor it should accept `sections: FaqSectionWithItems[]` as a prop.

- [ ] **Step 2: Refactor faq-view**

Change `faq-view.tsx` to accept `{ sections }: { sections: FaqSectionWithItems[] }`. Use existing layout/icons (whatever the file currently does for the `icon` field — preserve it). Render `item.question` and `item.answer` (where answer should now go through `<Markdown>`).

The `icon` field is a string key (e.g. "key", "video", "rules"). Whatever mapping the current file uses (likely an inline switch or component), keep it as-is and pass `section.icon` through.

- [ ] **Step 3: Update faq pages**

For `/h/[slug]/faq/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getHackathonBySlug, getFaqForHackathon } from "@/lib/utils";
import FaqView from "@/components/faq/faq-view";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FaqPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const sections = await getFaqForHackathon(hackathon.id);
  return <FaqView sections={sections} />;
}
```

For the `(global)/faq/page.tsx` route: if there's a "current hackathon" notion available, redirect to it. Otherwise: render an empty stub or remove the route. Recommendation: **delete the global `/faq` route** — FAQ is per-hackathon. Update sidebar links in Task 14.

- [ ] **Step 4: Verify**

Run: `npm run build`
Then `npm run dev`, open `/h/ai-hackathon-1/faq`, confirm all 10 sections render with their items.

- [ ] **Step 5: Commit**

```bash
git add src/components/faq/faq-view.tsx src/app/h/[slug]/faq/page.tsx src/app/\(global\)/faq
git commit -m "feat(faq): consume FAQ from DB per hackathon"
```

---

## Task 13: Per-hackathon ideas + prompts pages

**Files:**
- Read: `src/app/(global)/prompts/page.tsx` and `src/app/h/[slug]/ideas/page.tsx` to understand current shape
- Create or modify: `src/app/h/[slug]/ideas/page.tsx`
- Create: `src/app/h/[slug]/prompts/page.tsx`
- Delete: `src/app/(global)/prompts/page.tsx`

- [ ] **Step 1: Read current state**

Run: `cat src/app/\(global\)/prompts/page.tsx src/app/h/\[slug\]/ideas/page.tsx 2>/dev/null`

Note current rendering — both currently import `usefulPrompts` / `projectIdeas` from `guide-data.ts`. The new versions read from DB via the cached loaders.

- [ ] **Step 2: Per-hackathon ideas page**

```tsx
// src/app/h/[slug]/ideas/page.tsx
import { notFound } from "next/navigation";
import { getHackathonBySlug, getIdeasForHackathon } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function IdeasPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const ideas = await getIdeasForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
        Pomysły na projekty
      </h1>
      {ideas.length === 0 ? (
        <p className="text-on-surface-muted">Brak pomysłów dla tej edycji.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-xl border border-outline bg-surface-low p-5"
            >
              <h2 className="font-space-grotesk text-lg font-bold text-on-surface">
                {idea.name}
              </h2>
              <p className="mt-2 text-sm text-on-surface/80">{idea.description}</p>
              {idea.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-high px-2 py-0.5 text-xs text-on-surface-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

If `src/app/h/[slug]/ideas/page.tsx` already exists (Task 0 listing showed `ideas/` dir), check what it does. If it imports `projectIdeas` from `guide-data.ts` — replace entirely with the above. If it has a richer layout — preserve the structure and only swap the data source.

- [ ] **Step 3: Per-hackathon prompts page**

```tsx
// src/app/h/[slug]/prompts/page.tsx
import { notFound } from "next/navigation";
import { getHackathonBySlug, getPromptsForHackathon } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PromptsPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const prompts = await getPromptsForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
        Przydatne prompty
      </h1>
      {prompts.length === 0 ? (
        <p className="text-on-surface-muted">Brak promptów dla tej edycji.</p>
      ) : (
        <div className="space-y-5">
          {prompts.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-outline bg-surface-low p-5"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm text-primary-dim">#{p.number}</span>
                <h2 className="font-space-grotesk text-lg font-bold text-on-surface">
                  {p.title}
                </h2>
              </div>
              <p className="mt-1 text-sm text-on-surface-muted">{p.description}</p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-high/60 p-3 text-xs text-on-surface/90 whitespace-pre-wrap">
                {p.prompt}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

If the existing `(global)/prompts/page.tsx` had styling worth preserving — port it. The above is a clean baseline.

- [ ] **Step 4: Delete global prompts page**

```bash
rm src/app/\(global\)/prompts/page.tsx
```

Or if there's a directory with only this file, remove the dir.

- [ ] **Step 5: Update sidebar links**

Read [src/components/layout/sidebar.tsx](src/components/layout/sidebar.tsx). Find links pointing at `/prompts` or `/ideas` (global routes) and update them to `/h/${slug}/prompts` and `/h/${slug}/ideas` respectively. The sidebar already operates with a `hackathonSlug` prop (see [src/app/h/[slug]/layout.tsx:86](src/app/h/[slug]/layout.tsx:86)) so this is straightforward.

- [ ] **Step 6: Verify**

Run: `npm run build`
Then `npm run dev`. Visit `/h/ai-hackathon-1/ideas` and `/h/ai-hackathon-1/prompts`. Both should render the migrated content.

- [ ] **Step 7: Commit**

```bash
git add src/app/h/\[slug\]/ideas/page.tsx src/app/h/\[slug\]/prompts/page.tsx src/components/layout/sidebar.tsx
git rm -rf src/app/\(global\)/prompts
git commit -m "feat: per-hackathon ideas and prompts pages"
```

---

## Task 14: Server actions for content CRUD

**Files:**
- Create: `src/lib/actions/content.ts`

- [ ] **Step 1: Write content.ts**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import type { RulesContent } from "@/lib/types";

type ActionResult = { success?: true; error?: string };

function validateRulesContent(c: unknown): c is RulesContent {
  if (!c || typeof c !== "object") return false;
  const r = c as Partial<RulesContent>;
  return (
    typeof r.tagline === "string" &&
    typeof r.time_range === "string" &&
    typeof r.what_is_md === "string" &&
    Array.isArray(r.rules_cards) &&
    typeof r.before_intro === "string" &&
    Array.isArray(r.before_checklist) &&
    typeof r.tokens_box_md === "string" &&
    Array.isArray(r.dont_come_if) &&
    Array.isArray(r.prizes) &&
    Array.isArray(r.schedule) &&
    typeof r.closing_callout_md === "string"
  );
}

export async function updateRules(
  hackathonId: string,
  content: RulesContent
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  if (!validateRulesContent(content)) {
    return { error: "Nieprawidłowa struktura treści." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hackathons")
    .update({ rules_content: content })
    .eq("id", hackathonId);

  if (error) return { error: "Nie udało się zapisać treści." };

  revalidatePath(`/h/[slug]/rules`, "page");
  revalidatePath(`/h/[slug]/admin/content/rules`, "page");
  return { success: true };
}

export interface FaqSectionInput {
  slug: string;
  title: string;
  icon: string;
  items: { question: string; answer: string }[];
}

export async function updateFaq(
  hackathonId: string,
  sections: FaqSectionInput[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  for (const s of sections) {
    if (!s.slug?.trim() || !s.title?.trim() || !s.icon?.trim()) {
      return { error: "Wszystkie sekcje wymagają slug, title i icon." };
    }
    for (const i of s.items) {
      if (!i.question?.trim() || !i.answer?.trim()) {
        return { error: "Wszystkie pytania i odpowiedzi muszą być wypełnione." };
      }
    }
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("hackathon_faq_sections")
    .delete()
    .eq("hackathon_id", hackathonId);
  if (deleteError) return { error: "Nie udało się wyczyścić poprzednich sekcji." };

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const { data: inserted, error: insErr } = await supabase
      .from("hackathon_faq_sections")
      .insert({
        hackathon_id: hackathonId,
        slug: s.slug.trim(),
        title: s.title.trim(),
        icon: s.icon.trim(),
        display_order: i,
      })
      .select("id")
      .single();
    if (insErr || !inserted) return { error: "Nie udało się dodać sekcji." };

    if (s.items.length > 0) {
      const itemRows = s.items.map((it, idx) => ({
        section_id: inserted.id,
        question: it.question.trim(),
        answer: it.answer.trim(),
        display_order: idx,
      }));
      const { error: itemErr } = await supabase.from("hackathon_faq_items").insert(itemRows);
      if (itemErr) return { error: "Nie udało się dodać pytań." };
    }
  }

  revalidatePath(`/h/[slug]/faq`, "page");
  revalidatePath(`/h/[slug]/admin/content/faq`, "page");
  return { success: true };
}

export interface ProjectIdeaInput {
  name: string;
  description: string;
  tags: string[];
}

export async function updateIdeas(
  hackathonId: string,
  ideas: ProjectIdeaInput[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  for (const i of ideas) {
    if (!i.name?.trim() || !i.description?.trim()) {
      return { error: "Każdy pomysł wymaga nazwy i opisu." };
    }
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("hackathon_project_ideas")
    .delete()
    .eq("hackathon_id", hackathonId);
  if (deleteError) return { error: "Nie udało się wyczyścić poprzednich pomysłów." };

  if (ideas.length > 0) {
    const { error: insertError } = await supabase
      .from("hackathon_project_ideas")
      .insert(
        ideas.map((idea, i) => ({
          hackathon_id: hackathonId,
          name: idea.name.trim(),
          description: idea.description.trim(),
          tags: idea.tags.map((t) => t.trim()).filter(Boolean),
          display_order: i,
        }))
      );
    if (insertError) return { error: "Nie udało się dodać pomysłów." };
  }

  revalidatePath(`/h/[slug]/ideas`, "page");
  revalidatePath(`/h/[slug]/admin/content/ideas`, "page");
  return { success: true };
}

export interface UsefulPromptInput {
  number: number;
  title: string;
  description: string;
  prompt: string;
}

export async function updatePrompts(
  hackathonId: string,
  prompts: UsefulPromptInput[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  for (const p of prompts) {
    if (!p.title?.trim() || !p.prompt?.trim()) {
      return { error: "Każdy prompt wymaga tytułu i treści." };
    }
    if (typeof p.number !== "number" || Number.isNaN(p.number)) {
      return { error: "Numer promptu musi być liczbą." };
    }
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("hackathon_prompts")
    .delete()
    .eq("hackathon_id", hackathonId);
  if (deleteError) return { error: "Nie udało się wyczyścić poprzednich promptów." };

  if (prompts.length > 0) {
    const { error: insertError } = await supabase
      .from("hackathon_prompts")
      .insert(
        prompts.map((p, i) => ({
          hackathon_id: hackathonId,
          number: p.number,
          title: p.title.trim(),
          description: p.description.trim(),
          prompt: p.prompt.trim(),
          display_order: i,
        }))
      );
    if (insertError) return { error: "Nie udało się dodać promptów." };
  }

  revalidatePath(`/h/[slug]/prompts`, "page");
  revalidatePath(`/h/[slug]/admin/content/prompts`, "page");
  return { success: true };
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/content.ts
git commit -m "feat(actions): content CRUD server actions"
```

---

## Task 15: Admin edit button component

**Files:**
- Create: `src/components/admin/admin-edit-button.tsx`

- [ ] **Step 1: Implement server-side gated button**

```tsx
// src/components/admin/admin-edit-button.tsx
import Link from "next/link";
import { getCurrentUser } from "@/lib/utils";

interface AdminEditButtonProps {
  href: string;
  label?: string;
}

export async function AdminEditButton({ href, label = "Edytuj treść" }: AdminEditButtonProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;

  return (
    <Link
      href={href}
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-2.5 font-space-grotesk text-sm font-semibold text-primary-dim backdrop-blur-md shadow-lg transition-all hover:bg-primary/25 hover:shadow-[0_0_20px_rgba(70,70,204,0.35)]"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
      </svg>
      ✏️ {label}
    </Link>
  );
}
```

- [ ] **Step 2: Add to all 4 public content pages**

In each of the four public content pages, render `<AdminEditButton href="..." />` at the end (sibling to main content). It returns `null` for non-admins so it's safe everywhere.

For `/h/[slug]/rules/page.tsx`:
```tsx
import { AdminEditButton } from "@/components/admin/admin-edit-button";
// ...
return (
  <>
    <GarageRulesView hackathonDate={...} content={rules} />
    <AdminEditButton href={`/h/${slug}/admin/content/rules`} />
  </>
);
```

Do the same in `/h/[slug]/faq/page.tsx`, `/h/[slug]/ideas/page.tsx`, `/h/[slug]/prompts/page.tsx`, with respective hrefs.

- [ ] **Step 3: Verify**

Run: `npm run build`
Then `npm run dev`. Logged in as admin: visit `/h/ai-hackathon-1/rules` — see floating button. Logged in as participant — no button. Click → goes to `/admin/content/rules` (404 for now, fixed in next tasks).

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/admin-edit-button.tsx src/app/h/\[slug\]
git commit -m "feat(admin): floating edit button on public content pages"
```

---

## Task 16: Rules editor + admin route

**Files:**
- Create: `src/components/admin/rules-editor.tsx`
- Create: `src/app/h/[slug]/admin/content/rules/page.tsx`

- [ ] **Step 1: Implement rules-editor.tsx**

```tsx
"use client";

import { useState, useTransition } from "react";
import { updateRules } from "@/lib/actions/content";
import type { RulesContent } from "@/lib/types";

interface RulesEditorProps {
  hackathonId: string;
  initial: RulesContent;
}

const PRIZE_ICON_OPTIONS: RulesContent["prizes"][number]["icon_key"][] = ["energy", "idea", "value"];

export default function RulesEditor({ hackathonId, initial }: RulesEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [content, setContent] = useState<RulesContent>(initial);

  const update = <K extends keyof RulesContent>(key: K, value: RulesContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  const updateCard = (i: number, patch: Partial<RulesContent["rules_cards"][number]>) =>
    setContent((c) => ({
      ...c,
      rules_cards: c.rules_cards.map((card, idx) => (idx === i ? { ...card, ...patch } : card)),
    }));

  const updatePrize = (i: number, patch: Partial<RulesContent["prizes"][number]>) =>
    setContent((c) => ({
      ...c,
      prizes: c.prizes.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));

  const updateScheduleItem = (i: number, patch: Partial<RulesContent["schedule"][number]>) =>
    setContent((c) => ({
      ...c,
      schedule: c.schedule.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));

  const addScheduleItem = () =>
    setContent((c) => ({
      ...c,
      schedule: [...c.schedule, { time: "", title: "", location: "" }],
    }));

  const removeScheduleItem = (i: number) =>
    setContent((c) => ({ ...c, schedule: c.schedule.filter((_, idx) => idx !== i) }));

  const updateChecklist = (i: number, value: string) =>
    setContent((c) => ({
      ...c,
      before_checklist: c.before_checklist.map((it, idx) => (idx === i ? value : it)),
    }));

  const addChecklist = () =>
    setContent((c) => ({ ...c, before_checklist: [...c.before_checklist, ""] }));

  const removeChecklist = (i: number) =>
    setContent((c) => ({
      ...c,
      before_checklist: c.before_checklist.filter((_, idx) => idx !== i),
    }));

  const updateDontCome = (i: number, value: string) =>
    setContent((c) => ({
      ...c,
      dont_come_if: c.dont_come_if.map((it, idx) => (idx === i ? value : it)),
    }));

  const addDontCome = () =>
    setContent((c) => ({ ...c, dont_come_if: [...c.dont_come_if, ""] }));

  const removeDontCome = (i: number) =>
    setContent((c) => ({
      ...c,
      dont_come_if: c.dont_come_if.filter((_, idx) => idx !== i),
    }));

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateRules(hackathonId, content);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  const fieldCls =
    "w-full rounded-lg border border-outline bg-surface/60 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none";
  const labelCls =
    "mb-1.5 block font-space-grotesk text-xs font-bold uppercase tracking-wider text-on-surface-muted";

  return (
    <div className="space-y-8">
      <Section title="Hero">
        <div>
          <label className={labelCls}>Tagline</label>
          <input className={fieldCls} value={content.tagline} onChange={(e) => update("tagline", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Godziny</label>
          <input className={fieldCls} value={content.time_range} onChange={(e) => update("time_range", e.target.value)} />
        </div>
      </Section>

      <Section title="Czym jest (markdown)">
        <textarea
          className={`${fieldCls} font-mono`}
          rows={6}
          value={content.what_is_md}
          onChange={(e) => update("what_is_md", e.target.value)}
        />
      </Section>

      <Section title="Zasady gry (4 karty)">
        {content.rules_cards.map((card, i) => (
          <div key={i} className="rounded-lg bg-surface-high/40 p-3 space-y-2">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <input
                className={fieldCls}
                value={card.number}
                onChange={(e) => updateCard(i, { number: e.target.value })}
                placeholder="01"
              />
              <input
                className={fieldCls}
                value={card.title}
                onChange={(e) => updateCard(i, { title: e.target.value })}
                placeholder="Tytuł"
              />
            </div>
            <textarea
              className={fieldCls}
              rows={2}
              value={card.description}
              onChange={(e) => updateCard(i, { description: e.target.value })}
              placeholder="Opis"
            />
          </div>
        ))}
      </Section>

      <Section title="Zanim przyjdziesz">
        <div>
          <label className={labelCls}>Intro</label>
          <input className={fieldCls} value={content.before_intro} onChange={(e) => update("before_intro", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Checklist</label>
          {content.before_checklist.map((item, i) => (
            <div key={i} className="mt-2 flex gap-2">
              <input className={fieldCls} value={item} onChange={(e) => updateChecklist(i, e.target.value)} />
              <button type="button" onClick={() => removeChecklist(i)} className="text-on-surface-muted hover:text-secondary">
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addChecklist} className="mt-2 text-sm text-primary-dim hover:underline">
            + dodaj punkt
          </button>
        </div>
        <div>
          <label className={labelCls}>Box „Tokeny AI" (markdown)</label>
          <textarea className={`${fieldCls} font-mono`} rows={4} value={content.tokens_box_md} onChange={(e) => update("tokens_box_md", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>„Nie przychodź żeby"</label>
          {content.dont_come_if.map((item, i) => (
            <div key={i} className="mt-2 flex gap-2">
              <input className={fieldCls} value={item} onChange={(e) => updateDontCome(i, e.target.value)} />
              <button type="button" onClick={() => removeDontCome(i)} className="text-on-surface-muted hover:text-secondary">
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addDontCome} className="mt-2 text-sm text-primary-dim hover:underline">
            + dodaj punkt
          </button>
        </div>
      </Section>

      <Section title="Nagrody (3 karty)">
        {content.prizes.map((p, i) => (
          <div key={i} className="rounded-lg bg-surface-high/40 p-3 space-y-2">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <select
                className={fieldCls}
                value={p.icon_key}
                onChange={(e) => updatePrize(i, { icon_key: e.target.value as typeof PRIZE_ICON_OPTIONS[number] })}
              >
                {PRIZE_ICON_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <input className={fieldCls} value={p.title} onChange={(e) => updatePrize(i, { title: e.target.value })} placeholder="Tytuł" />
            </div>
            <textarea className={fieldCls} rows={2} value={p.description} onChange={(e) => updatePrize(i, { description: e.target.value })} placeholder="Opis" />
          </div>
        ))}
      </Section>

      <Section title="Harmonogram">
        {content.schedule.map((s, i) => (
          <div key={i} className="rounded-lg bg-surface-high/40 p-3 space-y-2">
            <div className="grid grid-cols-[140px_1fr_auto] gap-2">
              <input className={fieldCls} value={s.time} onChange={(e) => updateScheduleItem(i, { time: e.target.value })} placeholder="15:00 – 16:00" />
              <input className={fieldCls} value={s.title} onChange={(e) => updateScheduleItem(i, { title: e.target.value })} placeholder="Tytuł" />
              <button type="button" onClick={() => removeScheduleItem(i)} className="text-on-surface-muted hover:text-secondary">✕</button>
            </div>
            <input className={fieldCls} value={s.location} onChange={(e) => updateScheduleItem(i, { location: e.target.value })} placeholder="Lokalizacja" />
          </div>
        ))}
        <button type="button" onClick={addScheduleItem} className="text-sm text-primary-dim hover:underline">
          + dodaj punkt harmonogramu
        </button>
      </Section>

      <Section title="Callout końcowy (markdown)">
        <textarea
          className={`${fieldCls} font-mono`}
          rows={5}
          value={content.closing_callout_md}
          onChange={(e) => update("closing_callout_md", e.target.value)}
        />
      </Section>

      {error && <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-2.5 font-space-grotesk text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
      >
        {saved ? "Zapisano!" : isPending ? "Zapisywanie..." : "Zapisz zmiany"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-outline bg-surface-low/60 p-5">
      <h3 className="font-space-grotesk text-base font-bold text-on-surface">{title}</h3>
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Admin route**

```tsx
// src/app/h/[slug]/admin/content/rules/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getRulesContent } from "@/lib/utils";
import { DEFAULT_RULES } from "@/lib/defaults/rules";
import RulesEditor from "@/components/admin/rules-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminRulesPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const rules = (await getRulesContent(hackathon.id)) ?? DEFAULT_RULES;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-space-grotesk text-2xl font-bold text-on-surface">
          Garage Rules — {hackathon.name}
        </h1>
        <Link
          href={`/h/${slug}/rules`}
          className="text-sm text-on-surface-muted hover:text-on-surface"
        >
          ← podgląd publiczny
        </Link>
      </div>
      <RulesEditor hackathonId={hackathon.id} initial={rules} />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Then `npm run dev`, log in as admin, visit `/h/ai-hackathon-1/admin/content/rules`. Edit tagline, click "Zapisz zmiany", verify success message. Visit `/h/ai-hackathon-1/rules` to confirm change.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/rules-editor.tsx src/app/h/\[slug\]/admin/content/rules
git commit -m "feat(admin): rules editor and admin route"
```

---

## Task 17: FAQ editor + admin route

**Files:**
- Create: `src/components/admin/faq-editor.tsx`
- Create: `src/app/h/[slug]/admin/content/faq/page.tsx`

- [ ] **Step 1: faq-editor.tsx**

```tsx
"use client";

import { useState, useTransition } from "react";
import { updateFaq, type FaqSectionInput } from "@/lib/actions/content";
import type { FaqSectionWithItems } from "@/lib/types";

interface FaqEditorProps {
  hackathonId: string;
  initial: FaqSectionWithItems[];
}

type LocalSection = FaqSectionInput & { uid: string; itemUids: string[] };

function toLocal(sections: FaqSectionWithItems[]): LocalSection[] {
  return sections.map((s) => ({
    uid: crypto.randomUUID(),
    slug: s.slug,
    title: s.title,
    icon: s.icon,
    items: s.items.map((it) => ({ question: it.question, answer: it.answer })),
    itemUids: s.items.map(() => crypto.randomUUID()),
  }));
}

export default function FaqEditor({ hackathonId, initial }: FaqEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sections, setSections] = useState<LocalSection[]>(() => toLocal(initial));
  const [openSection, setOpenSection] = useState<string | null>(null);

  const updateSection = (uid: string, patch: Partial<Omit<LocalSection, "uid" | "items" | "itemUids">>) =>
    setSections((prev) => prev.map((s) => (s.uid === uid ? { ...s, ...patch } : s)));

  const addSection = () =>
    setSections((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), slug: "", title: "Nowa sekcja", icon: "key", items: [], itemUids: [] },
    ]);

  const removeSection = (uid: string) =>
    setSections((prev) => prev.filter((s) => s.uid !== uid));

  const moveSection = (uid: string, dir: -1 | 1) =>
    setSections((prev) => {
      const i = prev.findIndex((s) => s.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addItem = (sectionUid: string) =>
    setSections((prev) =>
      prev.map((s) =>
        s.uid === sectionUid
          ? {
              ...s,
              items: [...s.items, { question: "", answer: "" }],
              itemUids: [...s.itemUids, crypto.randomUUID()],
            }
          : s
      )
    );

  const updateItem = (sectionUid: string, i: number, patch: Partial<{ question: string; answer: string }>) =>
    setSections((prev) =>
      prev.map((s) =>
        s.uid === sectionUid
          ? { ...s, items: s.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }
          : s
      )
    );

  const removeItem = (sectionUid: string, i: number) =>
    setSections((prev) =>
      prev.map((s) =>
        s.uid === sectionUid
          ? {
              ...s,
              items: s.items.filter((_, idx) => idx !== i),
              itemUids: s.itemUids.filter((_, idx) => idx !== i),
            }
          : s
      )
    );

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const payload: FaqSectionInput[] = sections.map((s) => ({
        slug: s.slug || s.title.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        title: s.title,
        icon: s.icon,
        items: s.items,
      }));
      const result = await updateFaq(hackathonId, payload);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  const fieldCls =
    "w-full rounded-lg border border-outline bg-surface/60 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none";

  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.uid} className="rounded-xl border border-outline bg-surface-low/60">
          <div className="flex items-center gap-2 p-3">
            <button onClick={() => moveSection(s.uid, -1)} className="text-on-surface-muted hover:text-on-surface" type="button">↑</button>
            <button onClick={() => moveSection(s.uid, 1)} className="text-on-surface-muted hover:text-on-surface" type="button">↓</button>
            <input
              className={`${fieldCls} flex-1`}
              value={s.title}
              onChange={(e) => updateSection(s.uid, { title: e.target.value })}
              placeholder="Tytuł sekcji"
            />
            <input
              className={`${fieldCls} w-32`}
              value={s.slug}
              onChange={(e) => updateSection(s.uid, { slug: e.target.value })}
              placeholder="slug"
            />
            <input
              className={`${fieldCls} w-24`}
              value={s.icon}
              onChange={(e) => updateSection(s.uid, { icon: e.target.value })}
              placeholder="icon"
            />
            <button
              type="button"
              onClick={() => setOpenSection(openSection === s.uid ? null : s.uid)}
              className="text-sm text-on-surface-muted hover:text-on-surface"
            >
              {openSection === s.uid ? "▲" : "▼"} {s.items.length} q&a
            </button>
            <button
              type="button"
              onClick={() => removeSection(s.uid)}
              className="text-on-surface-muted hover:text-secondary"
            >
              ✕
            </button>
          </div>

          {openSection === s.uid && (
            <div className="space-y-3 border-t border-outline px-3 pb-3 pt-3">
              {s.items.map((it, i) => (
                <div key={s.itemUids[i]} className="rounded-lg bg-surface-high/40 p-3 space-y-2">
                  <input
                    className={fieldCls}
                    value={it.question}
                    onChange={(e) => updateItem(s.uid, i, { question: e.target.value })}
                    placeholder="Pytanie"
                  />
                  <textarea
                    className={`${fieldCls} font-mono`}
                    rows={4}
                    value={it.answer}
                    onChange={(e) => updateItem(s.uid, i, { answer: e.target.value })}
                    placeholder="Odpowiedź (markdown)"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(s.uid, i)}
                    className="text-xs text-on-surface-muted hover:text-secondary"
                  >
                    usuń pytanie
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(s.uid)}
                className="text-sm text-primary-dim hover:underline"
              >
                + dodaj pytanie
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline px-4 py-2 text-sm text-on-surface-muted hover:border-primary-dim hover:text-primary-dim"
      >
        + dodaj sekcję
      </button>

      {error && <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-2.5 font-space-grotesk text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
      >
        {saved ? "Zapisano!" : isPending ? "Zapisywanie..." : "Zapisz FAQ"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Admin route**

```tsx
// src/app/h/[slug]/admin/content/faq/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getFaqForHackathon } from "@/lib/utils";
import FaqEditor from "@/components/admin/faq-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminFaqPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const faq = await getFaqForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-space-grotesk text-2xl font-bold text-on-surface">
          FAQ — {hackathon.name}
        </h1>
        <Link
          href={`/h/${slug}/faq`}
          className="text-sm text-on-surface-muted hover:text-on-surface"
        >
          ← podgląd publiczny
        </Link>
      </div>
      <FaqEditor hackathonId={hackathon.id} initial={faq} />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build` then `npm run dev`. Visit `/h/ai-hackathon-1/admin/content/faq`. Add a test section, save, verify on `/h/ai-hackathon-1/faq`.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/faq-editor.tsx src/app/h/\[slug\]/admin/content/faq
git commit -m "feat(admin): FAQ editor and admin route"
```

---

## Task 18: Ideas editor + admin route

**Files:**
- Create: `src/components/admin/ideas-editor.tsx`
- Create: `src/app/h/[slug]/admin/content/ideas/page.tsx`

- [ ] **Step 1: ideas-editor.tsx**

```tsx
"use client";

import { useState, useTransition } from "react";
import { updateIdeas, type ProjectIdeaInput } from "@/lib/actions/content";
import type { ProjectIdea } from "@/lib/types";

interface IdeasEditorProps {
  hackathonId: string;
  initial: ProjectIdea[];
}

type LocalIdea = ProjectIdeaInput & { uid: string; tagsInput: string };

export default function IdeasEditor({ hackathonId, initial }: IdeasEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [ideas, setIdeas] = useState<LocalIdea[]>(() =>
    initial.map((i) => ({
      uid: crypto.randomUUID(),
      name: i.name,
      description: i.description,
      tags: i.tags,
      tagsInput: i.tags.join(", "),
    }))
  );

  const updateIdea = (uid: string, patch: Partial<Omit<LocalIdea, "uid">>) =>
    setIdeas((prev) => prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it)));

  const addIdea = () =>
    setIdeas((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), name: "", description: "", tags: [], tagsInput: "" },
    ]);

  const removeIdea = (uid: string) => setIdeas((prev) => prev.filter((it) => it.uid !== uid));

  const moveIdea = (uid: string, dir: -1 | 1) =>
    setIdeas((prev) => {
      const i = prev.findIndex((s) => s.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const payload: ProjectIdeaInput[] = ideas.map((it) => ({
        name: it.name,
        description: it.description,
        tags: it.tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      }));
      const result = await updateIdeas(hackathonId, payload);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  const fieldCls =
    "w-full rounded-lg border border-outline bg-surface/60 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none";

  return (
    <div className="space-y-3">
      {ideas.map((it) => (
        <div key={it.uid} className="rounded-xl border border-outline bg-surface-low/60 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => moveIdea(it.uid, -1)} type="button" className="text-on-surface-muted hover:text-on-surface">↑</button>
            <button onClick={() => moveIdea(it.uid, 1)} type="button" className="text-on-surface-muted hover:text-on-surface">↓</button>
            <input
              className={fieldCls}
              value={it.name}
              onChange={(e) => updateIdea(it.uid, { name: e.target.value })}
              placeholder="Nazwa pomysłu"
            />
            <button
              type="button"
              onClick={() => removeIdea(it.uid)}
              className="text-on-surface-muted hover:text-secondary"
            >
              ✕
            </button>
          </div>
          <textarea
            className={fieldCls}
            rows={2}
            value={it.description}
            onChange={(e) => updateIdea(it.uid, { description: e.target.value })}
            placeholder="Opis"
          />
          <input
            className={fieldCls}
            value={it.tagsInput}
            onChange={(e) => updateIdea(it.uid, { tagsInput: e.target.value })}
            placeholder="tagi (po przecinku)"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addIdea}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline px-4 py-2 text-sm text-on-surface-muted hover:border-primary-dim hover:text-primary-dim"
      >
        + dodaj pomysł
      </button>

      {error && <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-2.5 font-space-grotesk text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
      >
        {saved ? "Zapisano!" : isPending ? "Zapisywanie..." : "Zapisz pomysły"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Admin route**

```tsx
// src/app/h/[slug]/admin/content/ideas/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getIdeasForHackathon } from "@/lib/utils";
import IdeasEditor from "@/components/admin/ideas-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminIdeasPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const ideas = await getIdeasForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-space-grotesk text-2xl font-bold text-on-surface">
          Pomysły — {hackathon.name}
        </h1>
        <Link
          href={`/h/${slug}/ideas`}
          className="text-sm text-on-surface-muted hover:text-on-surface"
        >
          ← podgląd publiczny
        </Link>
      </div>
      <IdeasEditor hackathonId={hackathon.id} initial={ideas} />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build` then `npm run dev`. Visit `/h/ai-hackathon-1/admin/content/ideas`, edit, save, check public page.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/ideas-editor.tsx src/app/h/\[slug\]/admin/content/ideas
git commit -m "feat(admin): ideas editor and admin route"
```

---

## Task 19: Prompts editor + admin route

**Files:**
- Create: `src/components/admin/prompts-editor.tsx`
- Create: `src/app/h/[slug]/admin/content/prompts/page.tsx`

- [ ] **Step 1: prompts-editor.tsx**

```tsx
"use client";

import { useState, useTransition } from "react";
import { updatePrompts, type UsefulPromptInput } from "@/lib/actions/content";
import type { UsefulPrompt } from "@/lib/types";

interface PromptsEditorProps {
  hackathonId: string;
  initial: UsefulPrompt[];
}

type LocalPrompt = UsefulPromptInput & { uid: string };

export default function PromptsEditor({ hackathonId, initial }: PromptsEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [prompts, setPrompts] = useState<LocalPrompt[]>(() =>
    initial.map((p) => ({
      uid: crypto.randomUUID(),
      number: p.number,
      title: p.title,
      description: p.description,
      prompt: p.prompt,
    }))
  );

  const updatePrompt = (uid: string, patch: Partial<Omit<LocalPrompt, "uid">>) =>
    setPrompts((prev) => prev.map((p) => (p.uid === uid ? { ...p, ...patch } : p)));

  const addPrompt = () => {
    const nextNumber = prompts.length > 0 ? Math.max(...prompts.map((p) => p.number)) + 1 : 1;
    setPrompts((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), number: nextNumber, title: "", description: "", prompt: "" },
    ]);
  };

  const removePrompt = (uid: string) => setPrompts((prev) => prev.filter((p) => p.uid !== uid));

  const movePrompt = (uid: string, dir: -1 | 1) =>
    setPrompts((prev) => {
      const i = prev.findIndex((s) => s.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const payload: UsefulPromptInput[] = prompts.map(({ uid: _uid, ...rest }) => rest);
      const result = await updatePrompts(hackathonId, payload);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  const fieldCls =
    "w-full rounded-lg border border-outline bg-surface/60 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none";

  return (
    <div className="space-y-3">
      {prompts.map((p) => (
        <div key={p.uid} className="rounded-xl border border-outline bg-surface-low/60 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => movePrompt(p.uid, -1)} type="button" className="text-on-surface-muted hover:text-on-surface">↑</button>
            <button onClick={() => movePrompt(p.uid, 1)} type="button" className="text-on-surface-muted hover:text-on-surface">↓</button>
            <input
              type="number"
              className={`${fieldCls} w-20`}
              value={p.number}
              onChange={(e) => updatePrompt(p.uid, { number: parseInt(e.target.value, 10) || 0 })}
            />
            <input
              className={fieldCls}
              value={p.title}
              onChange={(e) => updatePrompt(p.uid, { title: e.target.value })}
              placeholder="Tytuł"
            />
            <button
              type="button"
              onClick={() => removePrompt(p.uid)}
              className="text-on-surface-muted hover:text-secondary"
            >
              ✕
            </button>
          </div>
          <input
            className={fieldCls}
            value={p.description}
            onChange={(e) => updatePrompt(p.uid, { description: e.target.value })}
            placeholder="Krótki opis"
          />
          <textarea
            className={`${fieldCls} font-mono`}
            rows={6}
            value={p.prompt}
            onChange={(e) => updatePrompt(p.uid, { prompt: e.target.value })}
            placeholder="Treść promptu"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addPrompt}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline px-4 py-2 text-sm text-on-surface-muted hover:border-primary-dim hover:text-primary-dim"
      >
        + dodaj prompt
      </button>

      {error && <p className="rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-2.5 font-space-grotesk text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
      >
        {saved ? "Zapisano!" : isPending ? "Zapisywanie..." : "Zapisz prompty"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Admin route**

```tsx
// src/app/h/[slug]/admin/content/prompts/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getPromptsForHackathon } from "@/lib/utils";
import PromptsEditor from "@/components/admin/prompts-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminPromptsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const prompts = await getPromptsForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-space-grotesk text-2xl font-bold text-on-surface">
          Prompty — {hackathon.name}
        </h1>
        <Link
          href={`/h/${slug}/prompts`}
          className="text-sm text-on-surface-muted hover:text-on-surface"
        >
          ← podgląd publiczny
        </Link>
      </div>
      <PromptsEditor hackathonId={hackathon.id} initial={prompts} />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build` then `npm run dev`. Same flow as previous editors.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/prompts-editor.tsx src/app/h/\[slug\]/admin/content/prompts
git commit -m "feat(admin): prompts editor and admin route"
```

---

## Task 20: Content cards on admin page

**Files:**
- Create: `src/components/admin/content-cards.tsx`
- Modify: `src/app/h/[slug]/admin/page.tsx`

- [ ] **Step 1: content-cards.tsx**

```tsx
import Link from "next/link";

interface ContentCardsProps {
  slug: string;
  faqSectionCount: number;
  ideasCount: number;
  promptsCount: number;
}

interface CardProps {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
}

function Card({ href, emoji, title, subtitle }: CardProps) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-outline bg-surface-low p-5 transition-colors hover:border-primary/30"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <h3 className="font-space-grotesk text-base font-bold text-on-surface group-hover:text-primary-dim">
            {title}
          </h3>
          <p className="mt-1 text-xs text-on-surface-muted">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

export default function ContentCards({
  slug,
  faqSectionCount,
  ideasCount,
  promptsCount,
}: ContentCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card
        href={`/h/${slug}/admin/content/rules`}
        emoji="📋"
        title="Garage Rules"
        subtitle="Zasady, harmonogram, nagrody"
      />
      <Card
        href={`/h/${slug}/admin/content/faq`}
        emoji="❓"
        title="FAQ"
        subtitle={`${faqSectionCount} sekcji`}
      />
      <Card
        href={`/h/${slug}/admin/content/ideas`}
        emoji="💡"
        title="Pomysły"
        subtitle={`${ideasCount} pozycji`}
      />
      <Card
        href={`/h/${slug}/admin/content/prompts`}
        emoji="🧠"
        title="Prompty"
        subtitle={`${promptsCount} pozycji`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Wire into admin page**

In [src/app/h/[slug]/admin/page.tsx](src/app/h/[slug]/admin/page.tsx):

1. Add imports near the top:
```ts
import ContentCards from "@/components/admin/content-cards";
import { getFaqForHackathon, getIdeasForHackathon, getPromptsForHackathon } from "@/lib/utils";
```

2. In the parallel data load (around line 47-61, the existing `Promise.all`), add three new fetches:
```ts
const [
  // ... existing ones
  faqSections,
  ideas,
  prompts,
] = await Promise.all([
  // ... existing
  getFaqForHackathon(hackathon.id),
  getIdeasForHackathon(hackathon.id),
  getPromptsForHackathon(hackathon.id),
]);
```

3. Add a new section after Categories (after line 173 in the current file):
```tsx
<section className="rounded-xl border border-outline bg-surface-low/60 p-6 backdrop-blur-md">
  <h2 className="mb-5 font-space-grotesk text-lg font-semibold text-on-surface">
    Treści hackathonu
  </h2>
  <ContentCards
    slug={slug}
    faqSectionCount={faqSections.length}
    ideasCount={ideas.length}
    promptsCount={prompts.length}
  />
</section>
```

- [ ] **Step 3: Verify**

Run: `npm run build` then `npm run dev`. As admin visit `/h/ai-hackathon-1/admin`, scroll to "Treści hackathonu", click cards to verify they go to right routes.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/content-cards.tsx src/app/h/\[slug\]/admin/page.tsx
git commit -m "feat(admin): content cards section on main admin page"
```

---

## Task 21: Cleanup

**Files:**
- Delete: `src/lib/faq-data.ts`
- Modify: `src/lib/guide-data.ts` (remove `usefulPrompts` and `projectIdeas`)

- [ ] **Step 1: Verify nobody imports faq-data anymore**

Run: `grep -rn "faq-data" src/`

Expected: no matches (FAQ now flows through DB). If matches exist, those files still depend on the static data — convert them first.

- [ ] **Step 2: Delete faq-data.ts**

```bash
git rm src/lib/faq-data.ts
```

- [ ] **Step 3: Verify nobody imports usefulPrompts / projectIdeas**

Run: `grep -rn "usefulPrompts\|projectIdeas" src/`

Expected: no matches.

- [ ] **Step 4: Strip from guide-data.ts**

In [src/lib/guide-data.ts](src/lib/guide-data.ts), remove:
- The `UsefulPrompt` interface (line ~885)
- The `usefulPrompts` array (line ~892)
- The `ProjectIdea` interface (line ~933)
- The `projectIdeas` array (line ~939)
- The trailing comment markers (`// ─── Useful Prompts ───` and `// ─── Project Ideas ───`)

Keep everything else (the `guideSteps` and supporting types/constants).

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/guide-data.ts
git commit -m "chore: remove stale faq-data and ideas/prompts exports"
```

---

## Self-review

### Spec coverage

- ✅ Editable Garage Rules — Tasks 1-3, 9, 11, 14, 16
- ✅ Editable FAQ — Tasks 1, 4, 9, 12, 14, 17
- ✅ Editable Project Ideas — Tasks 1, 5, 9, 13, 14, 18
- ✅ Editable Useful Prompts — Tasks 1, 5, 9, 13, 14, 19
- ✅ Editable description — already in `HackathonSettingsForm` (no new task needed; verify in Task 11 smoke)
- ✅ Bundled defaults — Tasks 3, 4, 5
- ✅ Clone-on-create — Task 8
- ✅ Backfill existing — Task 8
- ✅ Admin-only edit button on public pages — Task 15
- ✅ Admin content cards — Task 20
- ✅ Auth guards extraction — Task 6
- ✅ Cleanup hardcoded files — Task 21
- ✅ Per-hackathon ideas/prompts routes (open question from spec) — Task 13

### Type consistency

- `RulesContent` defined in Task 2 used by Tasks 3, 9, 11, 14, 16 ✓
- `FaqSectionWithItems` defined in Task 2, used by Tasks 9, 12, 17 ✓
- `FaqSectionInput`, `ProjectIdeaInput`, `UsefulPromptInput` defined in Task 14, used by Tasks 17, 18, 19 ✓
- Defaults' types (`DefaultFaqSection`, etc.) defined in Tasks 4-5 and only used by Tasks 7-8 ✓
- `seedHackathonContent` defined in Task 7, called in Task 8 ✓

### Placeholder scan

- No TBD, no TODO, no "implement later"
- Code blocks shown for every code change
- Exact paths in every Files: section
- Exact commands in every Verify step
