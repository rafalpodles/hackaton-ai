"use client";

import { useTransition } from "react";
import { toggleVoting } from "@/lib/actions/admin";
import { GradientButton } from "@/components/ui/gradient-button";

export default function VotingToggle({ isOpen }: { isOpen: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => toggleVoting(!isOpen));
  }

  return (
    <GradientButton onClick={handleToggle} disabled={isPending}>
      {isPending
        ? "Updating..."
        : isOpen
          ? "Close Voting"
          : "Open Voting"}
    </GradientButton>
  );
}
