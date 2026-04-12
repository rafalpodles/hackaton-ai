"use client";

import { useTransition } from "react";
import { toggleSubmissions } from "@/lib/actions/admin";
import { GradientButton } from "@/components/ui/gradient-button";

export default function SubmissionToggle({
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
    <GradientButton onClick={handleToggle} disabled={isPending}>
      {isPending
        ? "Aktualizacja..."
        : isOpen
          ? "Zamknij zgłoszenia"
          : "Otwórz zgłoszenia"}
    </GradientButton>
  );
}
