"use client";

import { useTransition } from "react";
import { toggleSubmissions } from "@/lib/actions/admin";
import { GradientButton } from "@/components/ui/gradient-button";

export default function SubmissionToggle({ isOpen }: { isOpen: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => toggleSubmissions(!isOpen));
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
