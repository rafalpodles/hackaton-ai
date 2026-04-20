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
