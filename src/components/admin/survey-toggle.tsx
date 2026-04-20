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
