"use client";

import { useTransition } from "react";
import { toggleSubmissions } from "@/lib/actions/admin";

export default function HackathonSubmissionToggle({
  hackathonId,
  isOpen,
}: {
  hackathonId: string;
  isOpen: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => toggleSubmissions(hackathonId, !isOpen));
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-space-grotesk text-sm font-bold transition-colors disabled:opacity-50 ${
        isOpen
          ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
          : "bg-surface-high text-on-surface-muted hover:bg-surface-bright"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${isOpen ? "bg-green-400" : "bg-on-surface-muted/40"}`}
      />
      {isPending
        ? "Aktualizacja..."
        : isOpen
          ? "Zgłoszenia otwarte"
          : "Zgłoszenia zamknięte"}
    </button>
  );
}
