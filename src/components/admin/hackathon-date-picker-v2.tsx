"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { setHackathonDate } from "@/lib/actions/admin";

interface HackathonDatePickerV2Props {
  hackathonId: string;
  currentDate: string | null;
}

const DAY_NAMES = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

const MONTH_NAMES_FULL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

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

export default function HackathonDatePickerV2({ hackathonId, currentDate }: HackathonDatePickerV2Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const parsed = currentDate ? new Date(currentDate) : null;

  const [selectedDay, setSelectedDay] = useState(parsed ? parsed.getDate() : now.getDate());
  const [selectedMonth, setSelectedMonth] = useState(parsed ? parsed.getMonth() : now.getMonth());
  const [selectedYear, setSelectedYear] = useState(parsed ? parsed.getFullYear() : now.getFullYear());
  const [hour, setHour] = useState(parsed ? parsed.getHours() : 9);
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0);
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : now.getMonth());
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : now.getFullYear());

  const daysInViewMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewYear, viewMonth]);
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
      weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }, [selectedDay, selectedMonth, selectedYear, hour, minute, daysInSelectedMonth]);

  const navigateMonth = useCallback((delta: number) => {
    setViewMonth((prev) => {
      let nm = prev + delta;
      let ny = viewYear;
      if (nm < 0) { nm = 11; ny -= 1; }
      else if (nm > 11) { nm = 0; ny += 1; }
      setViewYear(ny);
      return nm;
    });
  }, [viewYear]);

  const selectDay = useCallback((day: number) => {
    setSelectedDay(day);
    setSelectedMonth(viewMonth);
    setSelectedYear(viewYear);
  }, [viewMonth, viewYear]);

  const adjustHour = useCallback((delta: number) => {
    setHour((p) => { const n = p + delta; return n < 0 ? 23 : n > 23 ? 0 : n; });
  }, []);

  const adjustMinute = useCallback((delta: number) => {
    setMinute((p) => { const n = p + delta; return n < 0 ? 55 : n > 55 ? 0 : n; });
  }, []);

  const handleSave = () => {
    setError(null);
    const d = new Date(selectedYear, selectedMonth, Math.min(selectedDay, daysInSelectedMonth), hour, minute);
    startTransition(async () => {
      try { await setHackathonDate(hackathonId, d.toISOString()); }
      catch (err) { setError(err instanceof Error ? err.message : "Błąd"); }
    });
  };

  const handleClear = () => {
    setError(null);
    startTransition(async () => {
      try { await setHackathonDate(hackathonId, null); }
      catch (err) { setError(err instanceof Error ? err.message : "Błąd"); }
    });
  };

  const isToday = (day: number) => day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
  const isSelected = (day: number) => day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;

  return (
    <div className="rounded-xl border border-outline bg-surface-low/60 p-6 backdrop-blur-md">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/15">
            <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <h3 className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-on-surface">Data hackathonu</h3>
        </div>
        {parsed && <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">Ustawiona</span>}
      </div>

      {/* Calendar */}
      <div className="mb-5 rounded-lg border border-outline bg-surface/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => navigateMonth(-1)} className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-space-grotesk text-sm font-semibold text-on-surface">{MONTH_NAMES_FULL[viewMonth]} {viewYear}</span>
          <button type="button" onClick={() => navigateMonth(1)} className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {DAY_NAMES.map((n) => (
            <div key={n} className="py-1 text-center font-space-grotesk text-[10px] font-bold uppercase tracking-wider text-on-surface-muted">{n}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`e-${i}`} className="h-8" />)}
          {Array.from({ length: daysInViewMonth }, (_, i) => {
            const day = i + 1;
            const selected = isSelected(day);
            const today = isToday(day);
            return (
              <button key={day} type="button" onClick={() => selectDay(day)} disabled={isPending}
                className={`relative flex h-8 w-full items-center justify-center rounded-md font-mono text-xs font-medium transition-all disabled:pointer-events-none ${
                  selected ? "bg-secondary text-white shadow-[0_0_12px_rgba(255,77,41,0.4)]"
                  : today ? "ring-1 ring-secondary/50 text-on-surface hover:bg-surface-high"
                  : "text-on-surface hover:bg-surface-high"}`}>
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time */}
      <div className="mb-5 rounded-lg border border-outline bg-surface/60 p-4">
        <label className="mb-3 block font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-muted">Godzina rozpoczęcia</label>
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={() => adjustHour(1)} disabled={isPending} className="flex h-7 w-10 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high disabled:opacity-50"><ChevronUp className="h-4 w-4" /></button>
            <div className="flex h-14 w-16 items-center justify-center rounded-lg border border-outline bg-surface-low font-mono text-3xl font-bold text-on-surface">{String(hour).padStart(2, "0")}</div>
            <button type="button" onClick={() => adjustHour(-1)} disabled={isPending} className="flex h-7 w-10 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high disabled:opacity-50"><ChevronDown className="h-4 w-4" /></button>
          </div>
          <span className="font-mono text-2xl font-bold text-on-surface-muted">:</span>
          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={() => adjustMinute(5)} disabled={isPending} className="flex h-7 w-10 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high disabled:opacity-50"><ChevronUp className="h-4 w-4" /></button>
            <div className="flex h-14 w-16 items-center justify-center rounded-lg border border-outline bg-surface-low font-mono text-3xl font-bold text-on-surface">{String(minute).padStart(2, "0")}</div>
            <button type="button" onClick={() => adjustMinute(-5)} disabled={isPending} className="flex h-7 w-10 items-center justify-center rounded-md text-on-surface-muted transition-colors hover:bg-surface-high disabled:opacity-50"><ChevronDown className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-outline/50 bg-surface-high/40 px-4 py-2.5 text-center text-sm text-on-surface-muted">{previewDate}</div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={isPending} className="flex-1 rounded-lg bg-gradient-to-r from-secondary to-primary py-3 font-space-grotesk text-xs font-bold uppercase tracking-wider text-white transition-all hover:shadow-[0_0_20px_rgba(255,77,41,0.3)] disabled:opacity-50">
          {isPending ? "Zapisywanie..." : parsed ? "Zaktualizuj" : "Ustaw datę"}
        </button>
        {parsed && (
          <button onClick={handleClear} disabled={isPending} className="rounded-lg border border-outline px-5 py-3 font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted transition-colors hover:bg-surface-high disabled:opacity-50">
            Usuń
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-xs text-secondary">{error}</p>}
    </div>
  );
}
