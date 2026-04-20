# Post-Hackathon Survey — Design Spec

**Date:** 2026-04-20  
**Status:** Approved

## Overview

A post-hackathon survey feature allowing admins to collect structured feedback from hackathon participants. Modelled after the existing voting mechanism — admin enables/disables it, adds questions, and views results in the admin panel.

---

## Data Model

### New tables

```sql
survey_questions
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
  hackathon_id uuid NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE
  question    text NOT NULL
  type        text NOT NULL CHECK (type IN ('text', 'rating'))
  order       int  NOT NULL DEFAULT 0
  created_at  timestamptz DEFAULT now()

survey_responses
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
  hackathon_id uuid NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE
  question_id  uuid NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
  answer_text  text        -- populated when question.type = 'text'
  answer_rating int CHECK (answer_rating BETWEEN 1 AND 5)  -- when type = 'rating'
  created_at   timestamptz DEFAULT now()
  UNIQUE (user_id, question_id)
```

### Modified table

```sql
-- Add to hackathons
survey_open boolean NOT NULL DEFAULT false
```

The `survey_open` field is managed via the existing `updateHackathon` server action — add `survey_open` to the allowed whitelist.

---

## Routing

### `/h/[slug]/survey` — participant view

- Protected: user must be authenticated + a participant of this hackathon.
- Visible in sidebar only when `survey_open = true`.
- When `survey_open = false` and user hasn't responded: shows "Ankieta nie jest jeszcze dostępna."
- When user has already submitted: shows "Dziękujemy za wypełnienie ankiety." (no editing).
- Form renders questions in `order` sequence:
  - `rating` → 5-star click widget
  - `text` → textarea (no hard length limit, soft max ~1000 chars shown)
- Submit sends all answers atomically; partial saves not supported.

### `/h/[slug]/admin` — new "Ankieta" tab

Three panels within the tab:

1. **Ustawienia** — toggle `survey_open` (same pattern as voting toggle) + question editor: add / delete / reorder questions, set type per question.
2. **Wyniki** — shown per question:
   - `rating`: average score, distribution bar (count per 1–5), total responses
   - `text`: list of all text answers, total responses
   - Global counter: X/Y uczestników wypełniło ankietę
3. **Odpowiedzi per użytkownik** — table of participants; clicking a row expands all their answers inline.

---

## Server Actions (`src/lib/actions/survey.ts`)

### Participant-facing

**`getQuestionsForSurvey(hackathonId)`**
- Requires auth + participant of hackathon.
- Returns questions only when `survey_open = true`; otherwise returns empty / throws.
- Also returns whether the current user has already submitted (`hasResponded: boolean`).

**`submitSurvey(answers: { question_id, answer_text?, answer_rating? }[], hackathonId)`**
- Requires auth + participant.
- Validates: `survey_open = true`, user hasn't submitted yet (checked via UNIQUE constraint + pre-check), all `question_id`s belong to this hackathon, answer types match question types, ratings in 1–5 range.
- Inserts all rows atomically; returns `{ success }` or `{ error }`.

### Admin-facing

**`getQuestionsForAdmin(hackathonId)`**
- Requires admin role.
- Returns questions regardless of `survey_open` state (needed for editing preview).

**`getSurveyResults(hackathonId)`**
- Requires admin role.
- Returns:
  - Per-question aggregates: `{ question_id, avg_rating, distribution, responses: { user_id, display_name, answer }[] }`
  - Total participant count vs. response count for the hackathon.

**`updateSurveyQuestions(questions: { id?, question, type, order }[], hackathonId)`**
- Requires admin role.
- Full replace: deletes existing questions for hackathon, inserts new list.
- Cascades to `survey_responses` via FK ON DELETE CASCADE — warn admin if responses exist before destructive edit.

---

## Out of scope

- Anonymous responses (only logged-in participants).
- Multiple submissions per user.
- Mandatory vs. optional questions (all treated as required for submission).
- Export to CSV (could be added later).
