"use client";

import { useState } from "react";
import { requestJoinTeam } from "@/lib/actions/teams";
import { GradientButton } from "@/components/ui/gradient-button";
import type { TeamWithMembers } from "@/lib/types";

interface JoinTeamListProps {
  teams: TeamWithMembers[];
}

export function JoinTeamList({ teams }: JoinTeamListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  if (teams.length === 0) {
    return (
      <p className="text-on-surface-muted text-sm">
        Brak zespołów. Załóż nowy!
      </p>
    );
  }

  async function handleRequest(teamId: string) {
    setLoadingId(teamId);
    setError(null);
    try {
      await requestJoinTeam(teamId);
      setSuccessId(teamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać prośby");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-2 text-sm text-secondary">
          {error}
        </p>
      )}
      {successId && (
        <p className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary-dim">
          Prośba wysłana! Czekaj na akceptację lidera.
        </p>
      )}
      <ul className="space-y-4">
        {teams.map((team) => (
          <li
            key={team.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-outline bg-surface-low/40 px-5 py-4"
          >
            <div className="min-w-0">
              <p className="font-space-grotesk font-semibold text-on-surface truncate">
                {team.name}
              </p>
              <p className="text-on-surface-muted text-xs mt-1">
                {team.members.length}/5 —{" "}
                {team.members.length > 0
                  ? team.members.map((m) => m.display_name).join(", ")
                  : "Brak członków"}
              </p>
            </div>
            {team.members.length >= 5 ? (
              <span className="text-xs text-on-surface-muted">Pełny</span>
            ) : successId === team.id ? (
              <span className="text-xs text-primary-dim">Wysłano</span>
            ) : (
              <GradientButton
                variant="ghost"
                disabled={loadingId !== null || successId !== null}
                onClick={() => handleRequest(team.id)}
              >
                {loadingId === team.id ? "Wysyłanie..." : "Dołącz"}
              </GradientButton>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
