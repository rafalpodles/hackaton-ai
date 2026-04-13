"use client";

import { useState, useTransition } from "react";
import { leaveTeam, deleteTeam } from "@/lib/actions/teams";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface TeamActionsProps {
  isLeader: boolean;
  hackathonId: string;
}

export function TeamActions({ isLeader, hackathonId }: TeamActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirmedAction() {
    setShowConfirm(false);
    startTransition(async () => {
      if (isLeader) {
        await deleteTeam(hackathonId);
      } else {
        await leaveTeam(hackathonId);
      }
    });
  }

  if (isLeader) {
    return (
      <>
        <GlassCard>
          <h2 className="font-space-grotesk text-lg font-semibold text-on-surface mb-4">
            Zarządzanie
          </h2>
          <GradientButton
            variant="ghost"
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
          >
            {isPending ? "Usuwanie..." : "Usuń zespół"}
          </GradientButton>
          <p className="mt-2 text-xs text-on-surface-muted">
            Usunięcie zespołu wyrzuci wszystkich członków i usunie niezatwierdzony projekt.
          </p>
        </GlassCard>

        {showConfirm && (
          <ConfirmDialog
            title="Usuń zespół"
            message="Czy na pewno chcesz usunąć zespół? Wszyscy członkowie zostaną wyrzuceni, a niezatwierdzony projekt zostanie usunięty. Tej operacji nie można cofnąć."
            confirmLabel="Usuń zespół"
            onConfirm={handleConfirmedAction}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <GradientButton
        variant="ghost"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
      >
        {isPending ? "Opuszczanie..." : "Opuść zespół"}
      </GradientButton>

      {showConfirm && (
        <ConfirmDialog
          title="Opuść zespół"
          message="Czy na pewno chcesz opuścić zespół? Wrócisz do onboardingu."
          confirmLabel="Opuść"
          onConfirm={handleConfirmedAction}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
