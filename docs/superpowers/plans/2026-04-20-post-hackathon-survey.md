# Post-Hackathon Survey — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a post-hackathon survey feature — admin enables it, manages questions (text/rating), participants fill it once, admin sees aggregated results + per-user answers.

**Architecture:** New `survey_questions` and `survey_responses` tables scoped by `hackathon_id`. New `survey_open` boolean on `hackathons`. Server actions in `survey.ts` mirror the voting pattern. Participant fills survey at `/h/[slug]/survey`; admin manages it in the existing admin page.

**Tech Stack:** Next.js App Router, Supabase (service_role server actions), Tailwind CSS v4, TypeScript. No test infrastructure exists — verify with `npm run build` after each task.

**Spec:** `docs/superpowers/specs/2026-04-20-post-hackathon-survey-design.md`

---

## File Map

| Action | Path |
|--------|------|
| Create | `supabase/migrations/019_survey.sql` |
| Modify | `src/lib/types.ts` |
| Create | `src/lib/actions/survey.ts` |
| Modify | `src/lib/actions/hackathons.ts` |
| Create | `src/components/survey/star-rating.tsx` |
| Create | `src/components/survey/survey-form.tsx` |
| Create | `src/app/h/[slug]/survey/page.tsx` |
| Create | `src/components/admin/survey-toggle.tsx` |
| Create | `src/components/admin/survey-section.tsx` |
| Modify | `src/app/h/[slug]/admin/page.tsx` |
| Modify | `src/app/h/[slug]/layout.tsx` |
| Modify | `src/components/layout/sidebar.tsx` |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/019_survey.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/019_survey.sql

ALTER TABLE public.hackathons ADD COLUMN survey_open boolean NOT NULL DEFAULT false;

CREATE TABLE public.survey_questions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  question     text NOT NULL,
  type         text NOT NULL CHECK (type IN ('text', 'rating')),
  "order"      int NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE public.survey_responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  question_id  uuid NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_text  text,
  answer_rating int CHECK (answer_rating BETWEEN 1 AND 5),
  created_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, question_id)
);
```

- [ ] **Step 2: Apply migration in Supabase dashboard or CLI**

```bash
# If using Supabase CLI:
npx supabase db push
# Or paste the SQL directly in Supabase Dashboard → SQL Editor
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/019_survey.sql
git commit -m "feat: add survey tables and survey_open column (AH-survey)"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add `survey_open` to `Hackathon` interface**

In `src/lib/types.ts`, add `survey_open` after `voting_open`:

```typescript
export interface Hackathon {
  id: string;
  name: string;
  slug: string;
  description: string;
  hackathon_date: string | null;
  submission_deadline: string | null;
  submission_open: boolean;
  voting_open: boolean;
  survey_open: boolean;
  status: "upcoming" | "active" | "voting" | "finished";
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Add survey types at end of `src/lib/types.ts`**

```typescript
export interface SurveyQuestion {
  id: string;
  hackathon_id: string;
  question: string;
  type: "text" | "rating";
  order: number;
  created_at: string;
}

export interface SurveyQuestionResult {
  question_id: string;
  question: string;
  type: "text" | "rating";
  avg_rating: number | null;
  distribution: Record<number, number> | null;
  responses: { user_id: string; display_name: string; answer: string | number | null }[];
}

export interface SurveyStats {
  total_participants: number;
  total_responses: number;
  results: SurveyQuestionResult[];
}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: clean build (no type errors).

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add SurveyQuestion, SurveyStats types and survey_open to Hackathon"
```

---

## Task 3: Server Actions

**Files:**
- Create: `src/lib/actions/survey.ts`
- Modify: `src/lib/actions/hackathons.ts` (add `survey_open` to whitelist)

- [ ] **Step 1: Create `src/lib/actions/survey.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import type { SurveyQuestion, SurveyStats, SurveyQuestionResult } from "@/lib/types";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Brak dostępu");
  return user;
}

async function requireParticipant(hackathonId: string) {
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

export async function getQuestionsForSurvey(
  hackathonId: string
): Promise<{ questions: SurveyQuestion[]; hasResponded: boolean }> {
  const user = await requireParticipant(hackathonId);
  const supabase = await createClient();

  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("survey_open")
    .eq("id", hackathonId)
    .single();

  if (!hackathon?.survey_open) return { questions: [], hasResponded: false };

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("order");

  const { data: existing } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .limit(1);

  return {
    questions: (questions ?? []) as SurveyQuestion[],
    hasResponded: (existing?.length ?? 0) > 0,
  };
}

export async function submitSurvey(
  answers: { question_id: string; answer_text?: string; answer_rating?: number }[],
  hackathonId: string
): Promise<{ success?: boolean; error?: string }> {
  let user;
  try {
    user = await requireParticipant(hackathonId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  const supabase = await createClient();

  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("survey_open")
    .eq("id", hackathonId)
    .single();

  if (!hackathon?.survey_open) return { error: "Ankieta nie jest otwarta." };

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("id, type")
    .eq("hackathon_id", hackathonId);

  const questionMap = new Map((questions ?? []).map((q) => [q.id, q.type]));

  for (const answer of answers) {
    const type = questionMap.get(answer.question_id);
    if (!type) return { error: `Nieprawidłowe pytanie.` };
    if (type === "rating") {
      if (!answer.answer_rating || answer.answer_rating < 1 || answer.answer_rating > 5) {
        return { error: "Ocena musi być liczbą od 1 do 5." };
      }
    }
    if (type === "text" && !answer.answer_text?.trim()) {
      return { error: "Odpowiedź tekstowa nie może być pusta." };
    }
  }

  const rows = answers.map((a) => ({
    hackathon_id: hackathonId,
    question_id: a.question_id,
    user_id: user.id,
    answer_text: a.answer_text ?? null,
    answer_rating: a.answer_rating ?? null,
  }));

  const { error } = await supabase.from("survey_responses").insert(rows);
  if (error) {
    if (error.code === "23505") return { error: "Ankieta już wypełniona." };
    return { error: "Nie udało się zapisać odpowiedzi." };
  }

  return { success: true };
}

export async function getQuestionsForAdmin(hackathonId: string): Promise<SurveyQuestion[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("order");
  return (data ?? []) as SurveyQuestion[];
}

export async function getSurveyResults(hackathonId: string): Promise<SurveyStats> {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: questions }, { data: responses }, { data: participants }] = await Promise.all([
    supabase.from("survey_questions").select("*").eq("hackathon_id", hackathonId).order("order"),
    supabase.from("survey_responses").select("*, profile:profiles!user_id(display_name)").eq("hackathon_id", hackathonId),
    supabase.from("hackathon_participants").select("id").eq("hackathon_id", hackathonId),
  ]);

  const qs = (questions ?? []) as SurveyQuestion[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rs = (responses ?? []) as any[];

  const uniqueResponders = new Set(rs.map((r) => r.user_id)).size;

  const results: SurveyQuestionResult[] = qs.map((q) => {
    const qr = rs.filter((r) => r.question_id === q.id);
    if (q.type === "rating") {
      const ratings = qr.map((r) => r.answer_rating).filter(Boolean) as number[];
      const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of ratings) distribution[r] = (distribution[r] ?? 0) + 1;
      return {
        question_id: q.id, question: q.question, type: q.type,
        avg_rating: avg, distribution,
        responses: qr.map((r) => ({ user_id: r.user_id, display_name: r.profile?.display_name ?? "?", answer: r.answer_rating })),
      };
    }
    return {
      question_id: q.id, question: q.question, type: q.type,
      avg_rating: null, distribution: null,
      responses: qr.map((r) => ({ user_id: r.user_id, display_name: r.profile?.display_name ?? "?", answer: r.answer_text })),
    };
  });

  return {
    total_participants: (participants ?? []).length,
    total_responses: uniqueResponders,
    results,
  };
}

export async function updateSurveyQuestions(
  questions: { question: string; type: "text" | "rating"; order: number }[],
  hackathonId: string
): Promise<{ success?: boolean; error?: string }> {
  try { await requireAdmin(); } catch { return { error: "Brak dostępu" }; }
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("survey_questions")
    .delete()
    .eq("hackathon_id", hackathonId);

  if (deleteError) return { error: "Nie udało się zaktualizować pytań." };
  if (questions.length === 0) {
    revalidatePath("/h/[slug]/admin", "page");
    return { success: true };
  }

  const rows = questions.map((q, i) => ({
    hackathon_id: hackathonId,
    question: q.question,
    type: q.type,
    order: q.order ?? i,
  }));

  const { error: insertError } = await supabase.from("survey_questions").insert(rows);
  if (insertError) return { error: "Nie udało się dodać pytań." };

  revalidatePath("/h/[slug]/admin", "page");
  return { success: true };
}
```

- [ ] **Step 2: Add `survey_open` to `updateHackathon` whitelist in `src/lib/actions/hackathons.ts`**

Find the `updateHackathon` function signature (around line 42) and add `survey_open: boolean` to the `Partial<{...}>` type, then add this line inside the `allowed` object:

```typescript
// In the Partial<{...}> type parameter, add:
survey_open: boolean;

// In the allowed object spread, add after voting_open line:
...(data.survey_open !== undefined && { survey_open: data.survey_open }),
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/survey.ts src/lib/actions/hackathons.ts
git commit -m "feat: add survey server actions and whitelist survey_open"
```

---

## Task 4: Star Rating + Survey Form Components

**Files:**
- Create: `src/components/survey/star-rating.tsx`
- Create: `src/components/survey/survey-form.tsx`

- [ ] **Step 1: Create `src/components/survey/star-rating.tsx`**

```typescript
"use client";

export function StarRating({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`text-4xl transition-transform hover:scale-110 disabled:cursor-default ${
            star <= value ? "text-primary-dim" : "text-on-surface-muted/20"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/survey/survey-form.tsx`**

```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "./star-rating";
import { submitSurvey } from "@/lib/actions/survey";
import type { SurveyQuestion } from "@/lib/types";

export function SurveyForm({
  questions,
  hackathonId,
}: {
  questions: SurveyQuestion[];
  hackathonId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="text-5xl">🙏</div>
        <h2 className="font-space-grotesk text-2xl font-bold text-on-surface">
          Dziękujemy za wypełnienie ankiety!
        </h2>
        <p className="text-on-surface-muted">Twoje odpowiedzi zostały zapisane.</p>
      </div>
    );
  }

  const handleSubmit = () => {
    setError(null);
    const answers = questions.map((q) => ({
      question_id: q.id,
      answer_text: q.type === "text" ? texts[q.id] : undefined,
      answer_rating: q.type === "rating" ? ratings[q.id] : undefined,
    }));

    startTransition(async () => {
      const result = await submitSurvey(answers, hackathonId);
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-10">
      {questions.map((q, i) => (
        <div key={q.id} className="space-y-4">
          <h2 className="font-space-grotesk text-xl font-bold text-on-surface">
            {i + 1}. {q.question}
          </h2>
          {q.type === "rating" ? (
            <StarRating
              value={ratings[q.id] ?? 0}
              onChange={(v) => setRatings((prev) => ({ ...prev, [q.id]: v }))}
              disabled={isPending}
            />
          ) : (
            <div className="group relative">
              <textarea
                className="min-h-[120px] w-full resize-none border-none bg-black p-6 text-lg leading-relaxed text-on-surface placeholder:text-on-surface-muted/30 focus:outline-none focus:ring-0"
                value={texts[q.id] ?? ""}
                onChange={(e) => setTexts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Wpisz swoją odpowiedź..."
                disabled={isPending}
                maxLength={1000}
              />
              <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-primary to-secondary transition-transform duration-500 group-focus-within:scale-x-100" />
            </div>
          )}
        </div>
      ))}

      {error && (
        <p className="font-space-grotesk text-sm font-semibold text-secondary">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="group flex h-16 w-full items-center justify-center gap-4 bg-gradient-to-br from-primary via-primary to-secondary transition-all hover:shadow-[0_0_40px_rgba(164,165,255,0.2)] active:scale-[0.98] disabled:opacity-50"
      >
        <span className="font-space-grotesk text-lg font-extrabold tracking-[0.2em] text-white">
          {isPending ? "WYSYŁANIE..." : "WYŚLIJ ODPOWIEDZI"}
        </span>
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/survey/
git commit -m "feat: add StarRating and SurveyForm components"
```

---

## Task 5: Survey Page

**Files:**
- Create: `src/app/h/[slug]/survey/page.tsx`

- [ ] **Step 1: Create `src/app/h/[slug]/survey/page.tsx`**

```typescript
import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug, getParticipant } from "@/lib/utils";
import { getQuestionsForSurvey } from "@/lib/actions/survey";
import { SurveyForm } from "@/components/survey/survey-form";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SurveyPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const participant = await getParticipant(hackathon.id, user.id);
  if (!participant) redirect(`/h/${slug}`);

  if (!hackathon.survey_open) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">Ankieta</h1>
        <p className="text-on-surface-muted">Ankieta nie jest jeszcze dostępna.</p>
      </div>
    );
  }

  const { questions, hasResponded } = await getQuestionsForSurvey(hackathon.id);

  if (hasResponded) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="text-5xl">🙏</div>
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Dziękujemy za wypełnienie ankiety!
        </h1>
        <p className="text-on-surface-muted">Twoje odpowiedzi zostały zapisane.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">Ankieta</h1>
        <p className="text-on-surface-muted">Brak pytań w ankiecie.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-12">
        <h1 className="font-space-grotesk text-5xl font-extrabold tracking-tighter text-on-surface">
          ANKIETA
        </h1>
        <p className="mt-2 text-lg font-light text-on-surface-muted">
          Podziel się swoją opinią o hackathonie.
        </p>
      </header>
      <SurveyForm questions={questions} hackathonId={hackathon.id} />
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/h/\[slug\]/survey/
git commit -m "feat: add survey participant page"
```

---

## Task 6: Admin Survey Components

**Files:**
- Create: `src/components/admin/survey-toggle.tsx`
- Create: `src/components/admin/survey-section.tsx`
- Modify: `src/app/h/[slug]/admin/page.tsx`

- [ ] **Step 1: Create `src/components/admin/survey-toggle.tsx`**

```typescript
"use client";

import { useTransition } from "react";
import { updateHackathon } from "@/lib/actions/hackathons";

export default function SurveyToggle({
  hackathonId,
  isOpen,
}: {
  hackathonId: string;
  isOpen: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => updateHackathon(hackathonId, { survey_open: !isOpen }));
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-space-grotesk text-sm font-bold transition-colors disabled:opacity-50 ${
        isOpen
          ? "bg-primary/15 text-primary-dim hover:bg-primary/25"
          : "bg-surface-high text-on-surface-muted hover:bg-surface-bright"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-primary-dim" : "bg-on-surface-muted/40"}`} />
      {isPending ? "Aktualizacja..." : isOpen ? "Ankieta otwarta" : "Ankieta zamknięta"}
    </button>
  );
}
```

- [ ] **Step 2: Create `src/components/admin/survey-section.tsx`**

```typescript
"use client";

import { useState, useTransition } from "react";
import { updateSurveyQuestions } from "@/lib/actions/survey";
import type { SurveyQuestion, SurveyStats } from "@/lib/types";

type Tab = "settings" | "results" | "per-user";

interface SurveySectionProps {
  hackathonId: string;
  initialQuestions: SurveyQuestion[];
  stats: SurveyStats | null;
}

export default function SurveySection({ hackathonId, initialQuestions, stats }: SurveySectionProps) {
  const [tab, setTab] = useState<Tab>("settings");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-outline pb-1">
        {(["settings", "results", "per-user"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-4 py-2 font-space-grotesk text-xs uppercase tracking-wider transition-colors ${
              tab === t
                ? "border-b-2 border-primary-dim text-primary-dim"
                : "text-on-surface-muted hover:text-on-surface"
            }`}
          >
            {t === "settings" ? "Ustawienia" : t === "results" ? "Wyniki" : "Per użytkownik"}
          </button>
        ))}
      </div>

      {tab === "settings" && (
        <QuestionEditor hackathonId={hackathonId} initialQuestions={initialQuestions} />
      )}
      {tab === "results" && <ResultsView stats={stats} />}
      {tab === "per-user" && <PerUserView stats={stats} />}
    </div>
  );
}

function QuestionEditor({
  hackathonId,
  initialQuestions,
}: {
  hackathonId: string;
  initialQuestions: SurveyQuestion[];
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<
    { question: string; type: "text" | "rating"; order: number }[]
  >(initialQuestions.map((q) => ({ question: q.question, type: q.type, order: q.order })));

  const addQuestion = () =>
    setQuestions((prev) => [...prev, { question: "", type: "rating", order: prev.length }]);

  const removeQuestion = (i: number) =>
    setQuestions((prev) => prev.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx })));

  const updateQuestion = (i: number, patch: Partial<{ question: string; type: "text" | "rating" }>) =>
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateSurveyQuestions(
        questions.map((q, i) => ({ ...q, order: i })),
        hackathonId
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg bg-surface-high/40 p-4">
          <span className="mt-3 font-mono text-xs text-on-surface-muted">{i + 1}.</span>
          <div className="flex flex-1 flex-col gap-2">
            <input
              className="w-full border-none bg-transparent text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:outline-none"
              value={q.question}
              onChange={(e) => updateQuestion(i, { question: e.target.value })}
              placeholder="Treść pytania..."
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateQuestion(i, { type: "rating" })}
                className={`rounded px-2 py-1 font-space-grotesk text-xs uppercase tracking-wider transition-colors ${
                  q.type === "rating"
                    ? "bg-primary/20 text-primary-dim"
                    : "text-on-surface-muted hover:bg-surface-high"
                }`}
              >
                ★ Ocena
              </button>
              <button
                type="button"
                onClick={() => updateQuestion(i, { type: "text" })}
                className={`rounded px-2 py-1 font-space-grotesk text-xs uppercase tracking-wider transition-colors ${
                  q.type === "text"
                    ? "bg-primary/20 text-primary-dim"
                    : "text-on-surface-muted hover:bg-surface-high"
                }`}
              >
                ✏ Tekst
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeQuestion(i)}
            className="mt-1 text-on-surface-muted/50 transition hover:text-secondary"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="flex items-center gap-2 rounded-lg border border-dashed border-outline px-4 py-2 text-sm text-on-surface-muted transition hover:border-primary-dim hover:text-primary-dim"
      >
        + Dodaj pytanie
      </button>

      {error && <p className="text-sm font-semibold text-secondary">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="flex h-10 items-center gap-2 rounded-lg border border-outline bg-surface-high/60 px-5 text-sm font-bold text-on-surface transition hover:bg-surface-high disabled:opacity-50"
      >
        {saved ? "Zapisano!" : isPending ? "Zapisywanie..." : "Zapisz pytania"}
      </button>
    </div>
  );
}

function ResultsView({ stats }: { stats: SurveyStats | null }) {
  if (!stats || stats.results.length === 0) {
    return <p className="text-sm text-on-surface-muted">Brak danych — dodaj pytania i otwórz ankietę.</p>;
  }

  return (
    <div className="space-y-6">
      <p className="font-mono text-sm text-on-surface-muted">
        {stats.total_responses} / {stats.total_participants} uczestników wypełniło ankietę
      </p>
      {stats.results.map((r) => (
        <div key={r.question_id} className="rounded-lg bg-surface-high/40 p-4 space-y-3">
          <h3 className="font-space-grotesk text-sm font-bold text-on-surface">{r.question}</h3>
          {r.type === "rating" && r.avg_rating !== null && (
            <div className="space-y-2">
              <p className="font-mono text-2xl font-bold text-primary-dim">
                {r.avg_rating.toFixed(1)} / 5
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="flex flex-col items-center gap-1">
                    <span className="font-mono text-xs text-on-surface-muted">
                      {r.distribution?.[star] ?? 0}
                    </span>
                    <span className={`text-sm ${star <= Math.round(r.avg_rating!) ? "text-primary-dim" : "text-on-surface-muted/30"}`}>★</span>
                    <span className="font-mono text-xs text-on-surface-muted">{star}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {r.type === "text" && (
            <ul className="space-y-1">
              {r.responses.map((resp) => (
                <li key={resp.user_id} className="text-sm text-on-surface-muted">
                  <span className="font-semibold text-on-surface">{resp.display_name}:</span>{" "}
                  {resp.answer as string}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function PerUserView({ stats }: { stats: SurveyStats | null }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!stats || stats.results.length === 0) {
    return <p className="text-sm text-on-surface-muted">Brak odpowiedzi.</p>;
  }

  const usersMap = new Map<string, { display_name: string; answers: { question: string; answer: string | number | null }[] }>();
  for (const result of stats.results) {
    for (const resp of result.responses) {
      if (!usersMap.has(resp.user_id)) {
        usersMap.set(resp.user_id, { display_name: resp.display_name, answers: [] });
      }
      usersMap.get(resp.user_id)!.answers.push({ question: result.question, answer: resp.answer });
    }
  }

  const users = Array.from(usersMap.entries());

  return (
    <div className="space-y-2">
      {users.map(([userId, { display_name, answers }]) => (
        <div key={userId} className="rounded-lg bg-surface-high/40">
          <button
            type="button"
            onClick={() => setExpanded(expanded === userId ? null : userId)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="font-space-grotesk text-sm font-semibold text-on-surface">{display_name}</span>
            <svg
              className={`h-4 w-4 text-on-surface-muted transition-transform ${expanded === userId ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {expanded === userId && (
            <div className="space-y-2 border-t border-outline px-4 pb-3 pt-3">
              {answers.map(({ question, answer }, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold text-on-surface-muted">{question}</p>
                  <p className="text-sm text-on-surface">{String(answer)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Add survey section to `src/app/h/[slug]/admin/page.tsx`**

Add these imports at the top (after existing imports):

```typescript
import SurveyToggle from "@/components/admin/survey-toggle";
import SurveySection from "@/components/admin/survey-section";
import { getQuestionsForAdmin, getSurveyResults } from "@/lib/actions/survey";
```

Add to the `Promise.all` block (after the 4 existing queries):

```typescript
// Existing Promise.all becomes:
const [
  { data: categoriesRaw },
  { data: participantsRaw },
  { data: projectsRaw },
  { data: voterRows },
  surveyQuestions,
  surveyStats,
] = await Promise.all([
  supabase.from("hackathon_categories").select("*").eq("hackathon_id", hackathon.id).order("display_order"),
  supabase.from("hackathon_participants").select("*, profile:profiles!user_id(display_name, email, avatar_url), project:projects!project_id(name), team:teams!team_id(name, project_id)").eq("hackathon_id", hackathon.id).order("joined_at"),
  supabase.from("projects").select("*").eq("hackathon_id", hackathon.id).order("created_at", { ascending: false }),
  supabase.from("votes").select("voter_id").eq("hackathon_id", hackathon.id),
  getQuestionsForAdmin(hackathon.id),
  getSurveyResults(hackathon.id),
]);
```

Add `SurveyToggle` to the header toggle buttons (after `HackathonVotingToggle`):

```tsx
<SurveyToggle hackathonId={hackathon.id} isOpen={hackathon.survey_open} />
```

Add the survey section at the end (before the links section):

```tsx
{/* Survey */}
<section className="rounded-xl border border-outline bg-surface-low/60 p-6 backdrop-blur-md">
  <h2 className="mb-5 font-space-grotesk text-lg font-semibold text-on-surface">
    Ankieta pohackathonowa
  </h2>
  <SurveySection
    hackathonId={hackathon.id}
    initialQuestions={surveyQuestions}
    stats={surveyStats}
  />
</section>
```

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/survey-toggle.tsx src/components/admin/survey-section.tsx src/app/h/\[slug\]/admin/page.tsx
git commit -m "feat: add survey admin section with toggle, question editor, and results"
```

---

## Task 7: Sidebar Link

**Files:**
- Modify: `src/app/h/[slug]/layout.tsx`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Pass `surveyOpen` to `Sidebar` in `src/app/h/[slug]/layout.tsx`**

Change the `<Sidebar>` usage (around line 67):

```tsx
<Sidebar
  user={user}
  votingOpen={hackathon.voting_open}
  surveyOpen={hackathon.survey_open}
  hackathonSlug={hackathon.slug}
/>
```

- [ ] **Step 2: Add `surveyOpen` prop and link to `src/components/layout/sidebar.tsx`**

Update the `SidebarProps` interface:

```typescript
interface SidebarProps {
  user: Profile;
  votingOpen: boolean;
  surveyOpen?: boolean;
  hackathonSlug?: string;
}
```

Update the destructuring:

```typescript
export default function Sidebar({ user, votingOpen, surveyOpen, hackathonSlug }: SidebarProps) {
```

Add survey link to `hackathonItems` array (after "Mój projekt"):

```typescript
const hackathonItems = hackathonSlug
  ? [
      { label: "Zespół", href: `${h}/team` },
      { label: "Mój projekt", href: `${h}/my-project` },
      ...(surveyOpen ? [{ label: "Ankieta", href: `${h}/survey` }] : []),
    ]
  : [];
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/app/h/\[slug\]/layout.tsx src/components/layout/sidebar.tsx
git commit -m "feat: add survey link to sidebar when survey is open"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: clean build with no errors or warnings.

- [ ] **Step 2: Manual smoke test checklist**

- Admin opens `/h/[slug]/admin` → sees "Ankieta zamknięta" toggle and "Ankieta pohackathonowa" section
- Admin adds 2 questions (1 rating, 1 text), saves
- Admin clicks "Ankieta zamknięta" → toggles to "Ankieta otwarta"
- Participant opens sidebar → sees "Ankieta" link
- Participant fills the form, submits → sees thank-you screen
- Participant revisits `/h/[slug]/survey` → still sees thank-you screen (no re-submit)
- Admin opens results tab → sees avg rating + text answers + per-user view

- [ ] **Step 3: Push to main**

```bash
git push origin main
```
