"use client";

import { useTransition } from "react";
import { toggleVoting } from "@/lib/actions/admin";

export default function HackathonVotingToggle({
  hackathonId,
  isOpen,
}: {
  hackathonId: string;
  isOpen: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => toggleVoting(hackathonId, !isOpen));
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
      <span
        className={`h-2 w-2 rounded-full ${isOpen ? "bg-primary-dim" : "bg-on-surface-muted/40"}`}
      />
      {isPending
        ? "Aktualizacja..."
        : isOpen
          ? "Głosowanie otwarte"
          : "Głosowanie zamknięte"}
    </button>
  );
}
