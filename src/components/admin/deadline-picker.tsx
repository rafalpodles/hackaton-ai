"use client";

import { useState, useTransition, useMemo } from "react";
import { setSubmissionDeadline } from "@/lib/actions/admin";

interface DeadlinePickerProps {
  currentDeadline: string | null;
}

const MONTHS = [
  "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze",
  "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru",
];

export default function DeadlinePicker({ currentDeadline }: DeadlinePickerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const parsed = currentDeadline ? new Date(currentDeadline) : null;

  const [day, setDay] = useState(parsed ? parsed.getDate() : now.getDate());
  const [month, setMonth] = useState(parsed ? parsed.getMonth() : now.getMonth());
  const [year, setYear] = useState(parsed ? parsed.getFullYear() : now.getFullYear());
  const [hour, setHour] = useState(parsed ? parsed.getHours() : 18);
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0);

  const isExpired = parsed && parsed < now;

  const daysInMonth = useMemo(
    () => new Date(year, month + 1, 0).getDate(),
    [year, month]
  );

  const previewDate = useMemo(() => {
    const d = new Date(year, month, Math.min(day, daysInMonth), hour, minute);
    return d.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [day, month, year, hour, minute, daysInMonth]);

  const handleSave = () => {
    setError(null);
    const d = new Date(year, month, Math.min(day, daysInMonth), hour, minute);
    startTransition(async () => {
      try {
        await setSubmissionDeadline(d.toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd");
      }
    });
  };

  const handleClear = () => {
    setError(null);
    startTransition(async () => {
      try {
        await setSubmissionDeadline(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd");
      }
    });
  };

  return (
    <div className="rounded-xl border border-outline bg-surface-low/60 p-6 backdrop-blur-md">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
            <svg className="h-5 w-5 text-primary-dim" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-on-surface">
              Deadline zgłoszeń
            </h3>
            {parsed && (
              <p className="mt-0.5 text-xs text-on-surface-muted">{previewDate}</p>
            )}
          </div>
        </div>
        {parsed && (
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

      {/* Date selectors */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {/* Day */}
        <div>
          <label className="mb-1.5 block font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
            Dzień
          </label>
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            disabled={isPending}
            className="w-full appearance-none rounded-lg bg-black px-4 py-3 font-mono text-lg font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary-dim"
          >
            {Array.from({ length: daysInMonth }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {String(i + 1).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div>
          <label className="mb-1.5 block font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
            Miesiąc
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            disabled={isPending}
            className="w-full appearance-none rounded-lg bg-black px-4 py-3 font-mono text-lg font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary-dim"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className="mb-1.5 block font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
            Rok
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={isPending}
            className="w-full appearance-none rounded-lg bg-black px-4 py-3 font-mono text-lg font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary-dim"
          >
            {[now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Time selectors */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {/* Hour */}
        <div>
          <label className="mb-1.5 block font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
            Godzina
          </label>
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            disabled={isPending}
            className="w-full appearance-none rounded-lg bg-black px-4 py-3 font-mono text-lg font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary-dim"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>

        {/* Minute */}
        <div>
          <label className="mb-1.5 block font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
            Minuta
          </label>
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            disabled={isPending}
            className="w-full appearance-none rounded-lg bg-black px-4 py-3 font-mono text-lg font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary-dim"
          >
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex-1 rounded-lg bg-gradient-to-r from-primary to-secondary py-3 font-space-grotesk text-xs font-bold uppercase tracking-wider text-white transition-all hover:shadow-[0_0_20px_rgba(70,70,204,0.3)] disabled:opacity-50"
        >
          {isPending ? "Zapisywanie..." : parsed ? "Zaktualizuj" : "Ustaw deadline"}
        </button>
        {parsed && (
          <button
            onClick={handleClear}
            disabled={isPending}
            className="rounded-lg border border-outline px-5 py-3 font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted transition-colors hover:bg-surface-high disabled:opacity-50"
          >
            Usuń
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs text-secondary">{error}</p>
      )}
    </div>
  );
}
