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
