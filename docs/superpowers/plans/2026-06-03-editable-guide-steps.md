# Editable Per-Hackathon Guide Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow hackathon admins to add custom Markdown steps (with image upload) to the guide at `/h/[slug]/guide`, appended after default steps within the assigned category.

**Architecture:** New table `hackathon_guide_steps` stores per-hackathon steps. A new `GuideEditor` admin component handles CRUD + image upload to Supabase Storage bucket `guide-images`. The public guide page fetches custom steps server-side and passes them to `GuideView`, which renders them after default steps in each category using a new `CustomGuideStep` component.

**Tech Stack:** Next.js App Router, Server Actions, Supabase (PostgreSQL + Storage), TypeScript, Tailwind CSS v4, react-markdown + remark-gfm (already installed)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/024_hackathon_guide_steps.sql` | Create | New table + Storage bucket |
| `src/lib/types.ts` | Modify | Add `HackathonGuideStep` type |
| `src/lib/utils.ts` | Modify | Add `getGuideStepsForHackathon()` |
| `src/lib/actions/content.ts` | Modify | Add 5 guide step actions + image upload |
| `src/components/guide/custom-guide-step.tsx` | Create | Markdown renderer for custom steps |
| `src/components/guide/guide-view.tsx` | Modify | Accept + render custom steps per category |
| `src/app/h/[slug]/guide/page.tsx` | Modify | Fetch custom steps, pass to GuideView |
| `src/components/admin/guide-editor.tsx` | Create | Admin CRUD editor for guide steps |
| `src/app/h/[slug]/admin/content/guide/page.tsx` | Create | Admin page for guide editor |
| `src/components/admin/content-cards.tsx` | Modify | Add "Poradnik" card |
| `src/app/h/[slug]/admin/page.tsx` | Modify | Pass `guideStepsCount` to ContentCards |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/024_hackathon_guide_steps.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- ============================================================
-- 024: Per-hackathon custom guide steps + guide-images bucket
-- ============================================================

CREATE TABLE public.hackathon_guide_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id  uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  category      text NOT NULL CHECK (category IN ('fundamenty', 'ai-tools', 'weryfikacja')),
  order_index   integer NOT NULL DEFAULT 0,
  title         text NOT NULL,
  content_md    text NOT NULL DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_hackathon_guide_steps_hackathon_id
  ON public.hackathon_guide_steps(hackathon_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('guide-images', 'guide-images', true)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration runs without errors, table `hackathon_guide_steps` exists, bucket `guide-images` exists.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/024_hackathon_guide_steps.sql
git commit -m "feat(guide): add hackathon_guide_steps table and guide-images storage bucket"
```

---

## Task 2: TypeScript Type

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add `HackathonGuideStep` interface**

Add after the `UsefulPrompt` interface (end of file, line 225):

```typescript
export interface HackathonGuideStep {
  id: string;
  hackathon_id: string;
  category: "fundamenty" | "ai-tools" | "weryfikacja";
  order_index: number;
  title: string;
  content_md: string;
  created_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(guide): add HackathonGuideStep type"
```

---

## Task 3: Utility Function

**Files:**
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Add import for `HackathonGuideStep`**

Find the existing import line at the top of `src/lib/utils.ts` that imports from `@/lib/types`, e.g.:

```typescript
import type { Hackathon, FaqSectionWithItems, FaqItem, FaqSection, ProjectIdea, UsefulPrompt } from "@/lib/types";
```

Add `HackathonGuideStep` to that import:

```typescript
import type { Hackathon, FaqSectionWithItems, FaqItem, FaqSection, ProjectIdea, UsefulPrompt, HackathonGuideStep } from "@/lib/types";
```

- [ ] **Step 2: Add `getGuideStepsForHackathon` at the end of `src/lib/utils.ts`**

```typescript
export const getGuideStepsForHackathon = cache(
  async (hackathonId: string): Promise<HackathonGuideStep[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hackathon_guide_steps")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("order_index");
    return (data ?? []) as HackathonGuideStep[];
  }
);
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat(guide): add getGuideStepsForHackathon utility"
```

---

## Task 4: Server Actions

**Files:**
- Modify: `src/lib/actions/content.ts`

- [ ] **Step 1: Add `HackathonGuideStep` import**

At the top of `src/lib/actions/content.ts`, change:

```typescript
import type { RulesContent } from "@/lib/types";
```

to:

```typescript
import type { RulesContent, HackathonGuideStep } from "@/lib/types";
```

- [ ] **Step 2: Add the five guide actions at the end of `src/lib/actions/content.ts`**

```typescript
export interface GuideStepInput {
  category: "fundamenty" | "ai-tools" | "weryfikacja";
  title: string;
  content_md: string;
  order_index: number;
}

export async function createGuideStep(
  hackathonId: string,
  input: GuideStepInput
): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  if (!input.title?.trim()) return { error: "Tytuł kroku jest wymagany." };
  if (!["fundamenty", "ai-tools", "weryfikacja"].includes(input.category)) {
    return { error: "Nieprawidłowa kategoria." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hackathon_guide_steps")
    .insert({
      hackathon_id: hackathonId,
      category: input.category,
      title: input.title.trim(),
      content_md: input.content_md,
      order_index: input.order_index,
    })
    .select("id")
    .single();

  if (error) return { error: "Nie udało się dodać kroku." };

  revalidatePath(`/h/[slug]/guide`, "page");
  revalidatePath(`/h/[slug]/admin/content/guide`, "page");
  return { success: true, id: data.id };
}

export async function updateGuideStep(
  stepId: string,
  hackathonId: string,
  input: Partial<GuideStepInput>
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  if (input.title !== undefined && !input.title.trim()) {
    return { error: "Tytuł kroku jest wymagany." };
  }
  if (input.category !== undefined && !["fundamenty", "ai-tools", "weryfikacja"].includes(input.category)) {
    return { error: "Nieprawidłowa kategoria." };
  }

  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.category !== undefined) patch.category = input.category;
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.content_md !== undefined) patch.content_md = input.content_md;
  if (input.order_index !== undefined) patch.order_index = input.order_index;

  const { error } = await supabase
    .from("hackathon_guide_steps")
    .update(patch)
    .eq("id", stepId)
    .eq("hackathon_id", hackathonId);

  if (error) return { error: "Nie udało się zapisać kroku." };

  revalidatePath(`/h/[slug]/guide`, "page");
  revalidatePath(`/h/[slug]/admin/content/guide`, "page");
  return { success: true };
}

export async function deleteGuideStep(
  stepId: string,
  hackathonId: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hackathon_guide_steps")
    .delete()
    .eq("id", stepId)
    .eq("hackathon_id", hackathonId);

  if (error) return { error: "Nie udało się usunąć kroku." };

  revalidatePath(`/h/[slug]/guide`, "page");
  revalidatePath(`/h/[slug]/admin/content/guide`, "page");
  return { success: true };
}

export async function reorderGuideSteps(
  hackathonId: string,
  steps: { id: string; order_index: number }[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  const supabase = await createClient();
  for (const s of steps) {
    const { error } = await supabase
      .from("hackathon_guide_steps")
      .update({ order_index: s.order_index })
      .eq("id", s.id)
      .eq("hackathon_id", hackathonId);
    if (error) return { error: "Nie udało się zmienić kolejności kroków." };
  }

  revalidatePath(`/h/[slug]/guide`, "page");
  revalidatePath(`/h/[slug]/admin/content/guide`, "page");
  return { success: true };
}

export async function uploadGuideImage(
  hackathonId: string,
  formData: FormData
): Promise<ActionResult & { url?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Brak pliku." };

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Dozwolone formaty: JPG, PNG, GIF, WebP." };
  }

  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${hackathonId}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("guide-images")
    .upload(fileName, file, { contentType: file.type });

  if (error) return { error: "Nie udało się przesłać pliku." };

  const { data: { publicUrl } } = supabase.storage
    .from("guide-images")
    .getPublicUrl(fileName);

  return { success: true, url: publicUrl };
}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/content.ts
git commit -m "feat(guide): add server actions for guide step CRUD and image upload"
```

---

## Task 5: CustomGuideStep Component

**Files:**
- Create: `src/components/guide/custom-guide-step.tsx`

- [ ] **Step 1: Create the component**

```typescript
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { HackathonGuideStep } from "@/lib/types";

interface CustomGuideStepProps {
  step: HackathonGuideStep;
}

export function CustomGuideStep({ step }: CustomGuideStepProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-surface-low/60 p-6 backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          hackathon
        </span>
        <h3 className="font-space-grotesk text-lg font-bold text-on-surface">
          {step.title}
        </h3>
      </div>
      <div className="prose prose-invert max-w-none prose-img:rounded-lg prose-img:border prose-img:border-outline prose-a:text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {step.content_md}
        </ReactMarkdown>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/guide/custom-guide-step.tsx
git commit -m "feat(guide): add CustomGuideStep component for Markdown rendering"
```

---

## Task 6: Update GuideView to Render Custom Steps

**Files:**
- Modify: `src/components/guide/guide-view.tsx`

- [ ] **Step 1: Add import for `HackathonGuideStep` and `CustomGuideStep`**

At the top of `src/components/guide/guide-view.tsx`, add after the existing imports:

```typescript
import { CustomGuideStep } from "@/components/guide/custom-guide-step";
import type { HackathonGuideStep } from "@/lib/types";
```

- [ ] **Step 2: Update the `GuideView` props interface**

Find the component signature (line ~52):

```typescript
export function GuideView({ supportChannel }: { supportChannel?: string | null } = {}) {
```

Change to:

```typescript
export function GuideView({
  supportChannel,
  customSteps = [],
}: {
  supportChannel?: string | null;
  customSteps?: HackathonGuideStep[];
} = {}) {
```

- [ ] **Step 3: Render custom steps after default steps in each category**

Inside `GuideView`, find where categories are rendered. Look for a map over `CATEGORY_LABELS` or category rendering logic. After the block that renders default steps for a category, add:

```typescript
{customSteps
  .filter((s) => s.category === category)
  .map((step) => (
    <CustomGuideStep key={step.id} step={step} />
  ))}
```

The exact placement depends on the category rendering loop in guide-view.tsx. Read the relevant section carefully and inject after the last default step block for each category.

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/guide/guide-view.tsx
git commit -m "feat(guide): render custom hackathon steps in GuideView per category"
```

---

## Task 7: Update Public Guide Page

**Files:**
- Modify: `src/app/h/[slug]/guide/page.tsx`

- [ ] **Step 1: Update the page to fetch and pass custom steps**

Replace the entire file content:

```typescript
import { notFound } from "next/navigation";
import { getHackathonBySlug, assertStartPageVisible, getGuideStepsForHackathon } from "@/lib/utils";
import { GuideView } from "@/components/guide/guide-view";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonGuidePage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();
  await assertStartPageVisible(hackathon, "guide");

  const customSteps = await getGuideStepsForHackathon(hackathon.id);

  return <GuideView supportChannel={hackathon.support_channel} customSteps={customSteps} />;
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/h/[slug]/guide/page.tsx
git commit -m "feat(guide): pass custom steps to GuideView on hackathon guide page"
```

---

## Task 8: GuideEditor Admin Component

**Files:**
- Create: `src/components/admin/guide-editor.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState, useTransition, useRef } from "react";
import {
  createGuideStep,
  updateGuideStep,
  deleteGuideStep,
  reorderGuideSteps,
  uploadGuideImage,
} from "@/lib/actions/content";
import type { HackathonGuideStep } from "@/lib/types";

const CATEGORY_LABELS = {
  fundamenty: "Fundamenty",
  "ai-tools": "AI Tools",
  weryfikacja: "Weryfikacja",
} as const;

type Category = keyof typeof CATEGORY_LABELS;

interface GuideEditorProps {
  hackathonId: string;
  initial: HackathonGuideStep[];
}

const fieldCls =
  "w-full rounded-lg border border-outline bg-surface/60 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none";

export default function GuideEditor({ hackathonId, initial }: GuideEditorProps) {
  const [steps, setSteps] = useState<HackathonGuideStep[]>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<HackathonGuideStep>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState<{ category: Category; title: string; content_md: string }>({
    category: "fundamenty",
    title: "",
    content_md: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAdd = () => {
    if (!newDraft.title.trim()) {
      setError("Tytuł kroku jest wymagany.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createGuideStep(hackathonId, {
        category: newDraft.category,
        title: newDraft.title,
        content_md: newDraft.content_md,
        order_index: steps.filter((s) => s.category === newDraft.category).length,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      const newStep: HackathonGuideStep = {
        id: result.id!,
        hackathon_id: hackathonId,
        category: newDraft.category,
        order_index: steps.filter((s) => s.category === newDraft.category).length,
        title: newDraft.title,
        content_md: newDraft.content_md,
        created_at: new Date().toISOString(),
      };
      setSteps((prev) => [...prev, newStep]);
      setNewDraft({ category: "fundamenty", title: "", content_md: "" });
      setAddingNew(false);
      flash();
    });
  };

  const handleSaveEdit = (stepId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateGuideStep(stepId, hackathonId, editDraft);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, ...editDraft } : s))
      );
      setExpandedId(null);
      setEditDraft({});
      flash();
    });
  };

  const handleDelete = (stepId: string) => {
    if (!confirm("Usunąć ten krok?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteGuideStep(stepId, hackathonId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSteps((prev) => prev.filter((s) => s.id !== stepId));
      flash();
    });
  };

  const handleMove = (stepId: string, dir: -1 | 1) => {
    const step = steps.find((s) => s.id === stepId)!;
    const categorySteps = steps
      .filter((s) => s.category === step.category)
      .sort((a, b) => a.order_index - b.order_index);
    const idx = categorySteps.findIndex((s) => s.id === stepId);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= categorySteps.length) return;

    const updated = [...categorySteps];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const reordered = updated.map((s, i) => ({ ...s, order_index: i }));

    setSteps((prev) => {
      const others = prev.filter((s) => s.category !== step.category);
      return [...others, ...reordered];
    });

    startTransition(async () => {
      await reorderGuideSteps(
        hackathonId,
        reordered.map((s) => ({ id: s.id, order_index: s.order_index }))
      );
    });
  };

  const handleImageUpload = async (
    file: File,
    onInsert: (url: string) => void
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await uploadGuideImage(hackathonId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onInsert(result.url!);
    });
  };

  const categoriesInOrder: Category[] = ["fundamenty", "ai-tools", "weryfikacja"];

  return (
    <div className="space-y-8">
      {/* Step list per category */}
      {categoriesInOrder.map((cat) => {
        const catSteps = steps
          .filter((s) => s.category === cat)
          .sort((a, b) => a.order_index - b.order_index);

        return (
          <div key={cat}>
            <h2 className="mb-3 font-space-grotesk text-base font-semibold text-on-surface-muted uppercase tracking-widest">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="space-y-2">
              {catSteps.length === 0 && (
                <p className="text-sm text-on-surface-muted">Brak custom kroków w tej kategorii.</p>
              )}
              {catSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-outline bg-surface-low/60 p-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMove(step.id, -1)}
                        disabled={idx === 0 || isPending}
                        className="rounded px-1 text-on-surface-muted hover:text-on-surface disabled:opacity-20"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(step.id, 1)}
                        disabled={idx === catSteps.length - 1 || isPending}
                        className="rounded px-1 text-on-surface-muted hover:text-on-surface disabled:opacity-20"
                      >
                        ↓
                      </button>
                    </div>
                    <span className="flex-1 font-medium text-on-surface">{step.title}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedId === step.id) {
                          setExpandedId(null);
                          setEditDraft({});
                        } else {
                          setExpandedId(step.id);
                          setEditDraft({
                            category: step.category,
                            title: step.title,
                            content_md: step.content_md,
                          });
                        }
                      }}
                      className="text-sm text-on-surface-muted hover:text-on-surface"
                    >
                      {expandedId === step.id ? "Anuluj" : "Edytuj"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(step.id)}
                      disabled={isPending}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Usuń
                    </button>
                  </div>

                  {expandedId === step.id && (
                    <div className="mt-4 space-y-3 border-t border-outline pt-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                          Kategoria
                        </label>
                        <select
                          className={fieldCls}
                          value={editDraft.category ?? step.category}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, category: e.target.value as Category }))
                          }
                        >
                          {categoriesInOrder.map((c) => (
                            <option key={c} value={c}>
                              {CATEGORY_LABELS[c]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                          Tytuł
                        </label>
                        <input
                          type="text"
                          className={fieldCls}
                          value={editDraft.title ?? step.title}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, title: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                          Treść (Markdown)
                        </label>
                        <textarea
                          className={`${fieldCls} min-h-[200px] font-mono text-xs`}
                          value={editDraft.content_md ?? step.content_md}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, content_md: e.target.value }))
                          }
                        />
                        <div className="mt-1">
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              handleImageUpload(file, (url) => {
                                setEditDraft((d) => ({
                                  ...d,
                                  content_md: (d.content_md ?? step.content_md) + `\n![](${url})`,
                                }));
                              });
                              e.target.value = "";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            disabled={isPending}
                            className="text-xs text-on-surface-muted hover:text-on-surface disabled:opacity-50"
                          >
                            + Wgraj zdjęcie
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(step.id)}
                        disabled={isPending}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {isPending ? "Zapisywanie..." : "Zapisz krok"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add new step */}
      <div className="rounded-xl border border-dashed border-outline p-4">
        {!addingNew ? (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="text-sm text-on-surface-muted hover:text-on-surface"
          >
            + Dodaj krok
          </button>
        ) : (
          <div className="space-y-3">
            <h3 className="font-space-grotesk text-sm font-semibold text-on-surface">
              Nowy krok
            </h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                Kategoria
              </label>
              <select
                className={fieldCls}
                value={newDraft.category}
                onChange={(e) =>
                  setNewDraft((d) => ({ ...d, category: e.target.value as Category }))
                }
              >
                {categoriesInOrder.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                Tytuł
              </label>
              <input
                type="text"
                className={fieldCls}
                value={newDraft.title}
                onChange={(e) => setNewDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="np. Qt Setup"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-muted">
                Treść (Markdown)
              </label>
              <textarea
                className={`${fieldCls} min-h-[200px] font-mono text-xs`}
                value={newDraft.content_md}
                onChange={(e) => setNewDraft((d) => ({ ...d, content_md: e.target.value }))}
                placeholder="## Nagłówek&#10;&#10;Treść kroku w Markdown..."
              />
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleImageUpload(file, (url) => {
                      setNewDraft((d) => ({
                        ...d,
                        content_md: d.content_md + `\n![](${url})`,
                      }));
                    });
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="text-xs text-on-surface-muted hover:text-on-surface disabled:opacity-50"
                >
                  + Wgraj zdjęcie
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAdd}
                disabled={isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isPending ? "Dodawanie..." : "Dodaj krok"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingNew(false);
                  setNewDraft({ category: "fundamenty", title: "", content_md: "" });
                  setError(null);
                }}
                className="text-sm text-on-surface-muted hover:text-on-surface"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback */}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-green-400">Zapisano!</p>}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/guide-editor.tsx
git commit -m "feat(guide): add GuideEditor admin component with CRUD and image upload"
```

---

## Task 9: Admin Guide Page

**Files:**
- Create: `src/app/h/[slug]/admin/content/guide/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getGuideStepsForHackathon } from "@/lib/utils";
import GuideEditor from "@/components/admin/guide-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminGuidePage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const steps = await getGuideStepsForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-space-grotesk text-2xl font-bold text-on-surface">
          Poradnik — {hackathon.name}
        </h1>
        <Link
          href={`/h/${slug}/guide`}
          className="text-sm text-on-surface-muted hover:text-on-surface"
        >
          ← podgląd publiczny
        </Link>
      </div>
      <p className="text-sm text-on-surface-muted">
        Dodaj własne kroki do poradnika dla tego hackathonu. Pojawią się na końcu odpowiedniej kategorii.
      </p>
      <GuideEditor hackathonId={hackathon.id} initial={steps} />
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/h/[slug]/admin/content/guide/page.tsx"
git commit -m "feat(guide): add admin guide editor page at /h/[slug]/admin/content/guide"
```

---

## Task 10: Add Poradnik Card to ContentCards

**Files:**
- Modify: `src/components/admin/content-cards.tsx`
- Modify: `src/app/h/[slug]/admin/page.tsx`

- [ ] **Step 1: Update `ContentCards` props and render**

Replace the entire `src/components/admin/content-cards.tsx`:

```typescript
import Link from "next/link";

interface ContentCardsProps {
  slug: string;
  faqSectionCount: number;
  ideasCount: number;
  promptsCount: number;
  guideStepsCount: number;
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
  guideStepsCount,
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
        href={`/h/${slug}/admin/content/guide`}
        emoji="📚"
        title="Poradnik"
        subtitle={guideStepsCount === 0 ? "Brak custom kroków" : `${guideStepsCount} custom kroków`}
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

- [ ] **Step 2: Update admin page to fetch guide steps and pass count**

In `src/app/h/[slug]/admin/page.tsx`:

Find the import at the top:
```typescript
import { getFaqForHackathon, getIdeasForHackathon, getPromptsForHackathon } from "@/lib/utils";
```

Change to:
```typescript
import { getFaqForHackathon, getIdeasForHackathon, getPromptsForHackathon, getGuideStepsForHackathon } from "@/lib/utils";
```

Find the `Promise.all` block and add `getGuideStepsForHackathon(hackathon.id)`:

```typescript
const [
  { data: categoriesRaw },
  { data: participantsRaw },
  { data: projectsRaw },
  { data: voterRows },
  surveyQuestions,
  surveyStats,
  faqSections,
  ideas,
  prompts,
  guideSteps,
] = await Promise.all([
  supabase.from("hackathon_categories").select("*").eq("hackathon_id", hackathon.id).order("display_order"),
  supabase.from("hackathon_participants").select("*, profile:profiles!user_id(display_name, email, avatar_url), project:projects!project_id(name), team:teams!team_id(name, project_id)").eq("hackathon_id", hackathon.id).order("joined_at"),
  supabase.from("projects").select("*").eq("hackathon_id", hackathon.id).order("created_at", { ascending: false }),
  supabase.from("votes").select("voter_id").eq("hackathon_id", hackathon.id),
  getQuestionsForAdmin(hackathon.id),
  getSurveyResults(hackathon.id),
  getFaqForHackathon(hackathon.id),
  getIdeasForHackathon(hackathon.id),
  getPromptsForHackathon(hackathon.id),
  getGuideStepsForHackathon(hackathon.id),
]);
```

Find the `<ContentCards>` JSX and add the `guideStepsCount` prop:

```typescript
<ContentCards
  slug={slug}
  faqSectionCount={faqSections.length}
  ideasCount={ideas.length}
  promptsCount={prompts.length}
  guideStepsCount={guideSteps.length}
/>
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/content-cards.tsx src/app/h/[slug]/admin/page.tsx
git commit -m "feat(guide): add Poradnik card to admin content cards"
```

---

## Self-Review

**Spec coverage check:**
- [x] New table `hackathon_guide_steps` — Task 1
- [x] Supabase Storage bucket `guide-images` — Task 1
- [x] `HackathonGuideStep` type — Task 2
- [x] `getGuideStepsForHackathon` util — Task 3
- [x] `createGuideStep`, `updateGuideStep`, `deleteGuideStep`, `reorderGuideSteps`, `uploadGuideImage` actions — Task 4
- [x] `CustomGuideStep` component (Markdown renderer, hackathon badge) — Task 5
- [x] `GuideView` updated to accept and render custom steps per category — Task 6
- [x] Public guide page fetches and passes custom steps — Task 7
- [x] Admin editor with CRUD, reorder, image upload — Task 8
- [x] Admin page at `/h/[slug]/admin/content/guide` — Task 9
- [x] "Poradnik" card in ContentCards, count wired through admin page — Task 10
- [x] Custom steps always visible (no path/subscription filtering) — implemented in Task 5/6 (no filter logic)
- [x] Auth check in all server actions via `requireAdmin()` — Task 4

**Type consistency:** `HackathonGuideStep` defined in Task 2, used in Tasks 3, 4, 5, 6, 8, 9 — consistent. `GuideStepInput` defined and used only in Task 4. `Category` type consistent across Tasks 4, 8.

**No placeholders:** all steps contain actual code.
