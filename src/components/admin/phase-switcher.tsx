"use client";

import { useState, useTransition } from "react";
import type { Phase } from "@/lib/types";
import { setPhase } from "@/lib/actions/admin";
import ConfirmDialog from "@/components/ui/confirm-dialog";

const phases: { key: Phase; label: string }[] = [
  { key: "submission", label: "Submission" },
  { key: "browsing", label: "Browsing" },
  { key: "voting", label: "Voting" },
  { key: "results", label: "Results" },
];

interface PhaseSwitcherProps {
  currentPhase: Phase;
}

export default function PhaseSwitcher({ currentPhase }: PhaseSwitcherProps) {
  const [confirmTarget, setConfirmTarget] = useState<Phase | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentIndex = phases.findIndex((p) => p.key === currentPhase);

  const handleConfirm = () => {
    if (!confirmTarget) return;
    startTransition(async () => {
      await setPhase(confirmTarget);
      setConfirmTarget(null);
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {phases.map((phase, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;
          const isNext = index === currentIndex + 1;
          const isFuture = index > currentIndex + 1;

          let className =
            "rounded-full px-4 py-2 font-space-grotesk text-xs font-bold uppercase tracking-wider transition-all ";

          if (isCurrent) {
            className +=
              "bg-gradient-to-r from-primary to-secondary text-white";
          } else if (isPast) {
            className += "bg-primary/15 text-primary-dim";
          } else if (isNext) {
            className +=
              "cursor-pointer border border-outline text-on-surface-muted hover:border-primary-dim hover:text-primary-dim";
          } else if (isFuture) {
            className +=
              "cursor-not-allowed border border-outline/50 text-on-surface-muted/40 opacity-40";
          }

          return (
            <button
              key={phase.key}
              disabled={!isNext || isPending}
              onClick={() => isNext && setConfirmTarget(phase.key)}
              className={className}
            >
              {phase.label}
            </button>
          );
        })}
      </div>

      {confirmTarget && (
        <ConfirmDialog
          title="Change Phase"
          message={`Are you sure you want to advance to the "${confirmTarget}" phase? This action cannot be undone.`}
          confirmLabel="Advance"
          onConfirm={handleConfirm}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </>
  );
}
