"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { setSubmissionDeadline } from "@/lib/actions/admin";

interface DeadlinePickerProps {
  hackathonId: string;
  currentDeadline: string | null;
}

const DAY_NAMES = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

const MONTH_NAMES_FULL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

function ChevronUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export default function DeadlinePicker({ hackathonId, currentDeadline }: DeadlinePickerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  const parsed = currentDeadline ? new Date(currentDeadline) : null;

  const [selectedDay, setSelectedDay] = useState(parsed ? parsed.getDate() : now.getDate());
  const [selectedMonth, setSelectedMonth] = useState(parsed ? parsed.getMonth() : now.getMonth());
  const [selectedYear, setSelectedYear] = useState(parsed ? parsed.getFullYear() : now.getFullYear());
  const [hour, setHour] = useState(parsed ? parsed.getHours() : 18);
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0);

  // Calendar view state (independent of selection for month navigation)
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : now.getMonth());
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : now.getFullYear());

  const isExpired = parsed && parsed < now;

  const daysInViewMonth = useMemo(
    () => new Date(viewYear, viewMonth + 1, 0).getDate(),
    [viewYear, viewMonth]
  );

  // First day of the month (0 = Sunday). Convert to Monday-based (0 = Monday).
  const firstDayOfMonth = useMemo(() => {
    const day = new Date(viewYear, viewMonth, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }, [viewYear, viewMonth]);

  const daysInSelectedMonth = useMemo(
    () => new Date(selectedYear, selectedMonth + 1, 0).getDate(),
    [selectedYear, selectedMonth]
  );

  const previewDate = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth, Math.min(selectedDay, daysInSelectedMonth), hour, minute);
    return d.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [selectedDay, selectedMonth, selectedYear, hour, minute, daysInSelectedMonth]);

  const navigateMonth = useCallback((delta: number) => {
    setViewMonth((prev) => {
      let newMonth = prev + delta;
      let newYear = viewYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      setViewYear(newYear);
      return newMonth;
    });
  }, [viewYear]);

  const selectDay = useCallback((day: number) => {
    setSelectedDay(day);
    setSelectedMonth(viewMonth);
    setSelectedYear(viewYear);
  }, [viewMonth, viewYear]);

  const adjustHour = useCallback((delta: number) => {
    setHour((prev) => {
      const next = prev + delta;
      if (next < 0) return 23;
      if (next > 23) return 0;
      return next;
    });
  }, []);

  const adjustMinute = useCallback((delta: number) => {
    setMinute((prev) => {
      const next = prev + delta;
      if (next < 0) return 55;
      if (next > 55) return 0;
      return next;
    });
  }, []);

  const handleSave = () => {
    setError(null);
    const d = new Date(selectedYear, selectedMonth, Math.min(selectedDay, daysInSelectedMonth), hour, minute);
    startTransition(async () => {
      try {
        await setSubmissionDeadline(hackathonId, d.toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd");
      }
    });
  };

  const handleClear = () => {
    setError(null);
    startTransition(async () => {
      try {
        await setSubmissionDeadline(hackathonId, null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd");
      }
    });
  };

  const isToday = (day: number) =>
    day === todayDate && viewMonth === todayMonth && viewYear === todayYear;

  const isSelected = (day: number) =>
    day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day, 23, 59, 59);
    return d < now;
  };

  return (
    <div className="rounded-xl border border-outline bg-surface-low/60 p-6 backdrop-blur-md">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
            <svg className="h-5 w-5 text-primary-dim" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-on-surface">
            Deadline zgłoszeń
          </h3>
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

      {/* Calendar */}
      <div className="mb-5 rounded-lg border border-outline bg-surface/60 p-4">
        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
            aria-label="Poprzedni miesiąc"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-space-grotesk text-sm font-semibold text-on-surface">
            {MONTH_NAMES_FULL[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
            aria-label="Następny miesiąc"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day name headers */}
        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {DAY_NAMES.map((name) => (
            <div
              key={name}
              className="py-1 text-center font-space-grotesk text-[10px] font-bold uppercase tracking-wider text-on-surface-muted"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInViewMonth }, (_, i) => {
            const day = i + 1;
            const selected = isSelected(day);
            const today = isToday(day);
            const past = isPast(day);

            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDay(day)}
                disabled={isPending}
                className={`
                  relative flex h-8 w-full items-center justify-center rounded-md font-mono text-xs font-medium transition-all
                  ${selected
                    ? "bg-primary text-white shadow-[0_0_12px_rgba(70,70,204,0.5)]"
                    : today
                      ? "ring-1 ring-primary-dim/50 text-on-surface hover:bg-surface-high"
                      : past
                        ? "text-on-surface-muted/40 hover:bg-surface-high/50"
                        : "text-on-surface hover:bg-surface-high"
                  }
                  disabled:pointer-events-none
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time picker */}
      <div className="mb-5 rounded-lg border border-outline bg-surface/60 p-4">
        <label className="mb-3 block font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">
          Godzina
        </label>
        <div className="flex items-center justify-center gap-4">
          {/* Hour */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => adjustHour(1)}
              disabled={isPending}
              className="flex h-7 w-10 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface disabled:opacity-50"
              aria-label="Zwiększ godzinę"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <div className="flex h-14 w-16 items-center justify-center rounded-lg border border-outline bg-surface-low font-mono text-3xl font-bold text-on-surface">
              {String(hour).padStart(2, "0")}
            </div>
            <button
              type="button"
              onClick={() => adjustHour(-1)}
              disabled={isPending}
              className="flex h-7 w-10 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface disabled:opacity-50"
              aria-label="Zmniejsz godzinę"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Separator */}
          <span className="font-mono text-2xl font-bold text-on-surface-muted">:</span>

          {/* Minute */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => adjustMinute(5)}
              disabled={isPending}
              className="flex h-7 w-10 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface disabled:opacity-50"
              aria-label="Zwiększ minuty"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <div className="flex h-14 w-16 items-center justify-center rounded-lg border border-outline bg-surface-low font-mono text-3xl font-bold text-on-surface">
              {String(minute).padStart(2, "0")}
            </div>
            <button
              type="button"
              onClick={() => adjustMinute(-5)}
              disabled={isPending}
              className="flex h-7 w-10 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface disabled:opacity-50"
              aria-label="Zmniejsz minuty"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mb-5 rounded-lg border border-outline/50 bg-surface-high/40 px-4 py-2.5 text-center text-sm text-on-surface-muted">
        {previewDate}
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
