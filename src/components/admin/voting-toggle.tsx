"use client";

import { useTransition } from "react";
import { toggleVoting } from "@/lib/actions/admin";
import { GradientButton } from "@/components/ui/gradient-button";

export default function VotingToggle({
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
    <GradientButton onClick={handleToggle} disabled={isPending}>
      {isPending
        ? "Aktualizacja..."
        : isOpen
          ? "Zamknij głosowanie"
          : "Otwórz głosowanie"}
    </GradientButton>
  );
}
