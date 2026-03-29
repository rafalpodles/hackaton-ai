"use client";

import { useState, useTransition } from "react";
import { setSubmissionDeadline } from "@/lib/actions/admin";

interface DeadlinePickerProps {
  currentDeadline: string | null;
}

export default function DeadlinePicker({ currentDeadline }: DeadlinePickerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  const formatForInput = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [value, setValue] = useState(formatForInput(currentDeadline));

  const handleSave = () => {
    setError(null);
    const deadline = value ? new Date(value).toISOString() : null;
    startTransition(async () => {
      try {
        await setSubmissionDeadline(deadline);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd");
      }
    });
  };

  const handleClear = () => {
    setError(null);
    setValue("");
    startTransition(async () => {
      try {
        await setSubmissionDeadline(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd");
      }
    });
  };

  const isExpired = currentDeadline && new Date(currentDeadline) < new Date();

  return (
    <div className="rounded-xl border border-outline bg-surface-low/60 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-on-surface">
          Deadline zgłoszeń
        </h3>
        {currentDeadline && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isExpired
                ? "bg-red-500/15 text-red-400"
                : "bg-green-500/15 text-green-400"
            }`}
          >
            {isExpired ? "Minął" : "Aktywny"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-lg border border-outline bg-black px-4 py-2.5 font-mono text-sm text-on-surface outline-none focus:border-primary-dim"
          disabled={isPending}
        />
        <button
          onClick={handleSave}
          disabled={isPending || !value}
          className="rounded-lg bg-primary/15 px-4 py-2.5 font-space-grotesk text-xs font-bold uppercase tracking-wider text-primary-dim transition-colors hover:bg-primary/25 disabled:opacity-50"
        >
          {isPending ? "..." : "Ustaw"}
        </button>
        {currentDeadline && (
          <button
            onClick={handleClear}
            disabled={isPending}
            className="rounded-lg px-4 py-2.5 font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted transition-colors hover:bg-surface-high disabled:opacity-50"
          >
            Usuń
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-secondary">{error}</p>
      )}
    </div>
  );
}
