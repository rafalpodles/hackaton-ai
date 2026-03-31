"use client";

import { useState, useTransition } from "react";
import { setHackathonDate } from "@/lib/actions/admin";

interface HackathonDatePickerProps {
  currentDate: string | null;
}

export default function HackathonDatePicker({ currentDate }: HackathonDatePickerProps) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(() => {
    if (!currentDate) return "";
    const d = new Date(currentDate);
    // Format as datetime-local value (YYYY-MM-DDTHH:MM)
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  function handleSave() {
    if (!value) return;
    startTransition(async () => {
      await setHackathonDate(new Date(value).toISOString());
    });
  }

  function handleClear() {
    startTransition(async () => {
      await setHackathonDate(null);
      setValue("");
    });
  }

  return (
    <div className="rounded-xl border border-outline bg-surface-low/60 backdrop-blur-md p-5">
      <h3 className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-on-surface-muted mb-3">
        Data hackathonu
      </h3>
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-dim"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !value}
          className="rounded-md bg-primary/20 px-4 py-2 text-xs font-semibold text-primary-dim hover:bg-primary/30 transition-colors disabled:opacity-50"
        >
          {isPending ? "..." : "Zapisz"}
        </button>
        {currentDate && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isPending}
            className="rounded-md px-3 py-2 text-xs text-on-surface-muted hover:text-secondary transition-colors disabled:opacity-50"
          >
            Usuń
          </button>
        )}
      </div>
      {currentDate && (
        <p className="mt-2 text-xs text-on-surface-muted">
          Aktualnie: {new Date(currentDate).toLocaleString("pl-PL")}
        </p>
      )}
    </div>
  );
}
