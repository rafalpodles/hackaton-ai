"use client";

import { useTransition, useState } from "react";
import Image from "next/image";
import { delegateHackathonAdmin, revokeHackathonAdmin } from "@/lib/actions/hackathons";

interface Participant {
  id: string;
  user_id: string;
  role: string;
  project_id: string | null;
  project_name: string | null;
  team_name: string | null;
  is_solo: boolean;
  display_name: string;
  email: string;
  avatar_url: string | null;
}

interface HackathonParticipantsTableProps {
  hackathonId: string;
  participants: Participant[];
  currentUserId: string;
}

export default function HackathonParticipantsTable({
  hackathonId,
  participants,
  currentUserId,
}: HackathonParticipantsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggleAdmin = (userId: string, isAdmin: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        if (isAdmin) {
          await revokeHackathonAdmin(hackathonId, userId);
        } else {
          await delegateHackathonAdmin(hackathonId, userId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd zmiany roli");
      }
    });
  };

  return (
    <>
      {error && (
        <p className="mb-4 rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">{error}</p>
      )}
      <div className="overflow-x-auto rounded-xl border border-outline bg-surface-low/60 backdrop-blur-md">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline">
              <th className="w-10 px-3 py-3 text-center font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">#</th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">Uczestnik</th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">Email</th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">Zespół</th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">Rola</th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">Projekt</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p, idx) => {
              const isAdmin = p.role === "admin";
              const isSelf = p.user_id === currentUserId;
              return (
                <tr key={p.id} className="border-b border-outline/50 last:border-b-0">
                  <td className="w-10 px-3 py-4 text-center font-mono text-xs text-on-surface-muted">{idx + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        <Image src={p.avatar_url} alt={p.display_name} width={32} height={32} className="rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-space-grotesk text-xs font-bold text-primary-dim">
                          {p.display_name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                      )}
                      <span className="font-space-grotesk text-sm font-semibold text-on-surface">{p.display_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-on-surface-muted">{p.email}</td>
                  <td className="px-5 py-4 text-sm">
                    {p.team_name ? (
                      <span className="text-on-surface">{p.team_name}</span>
                    ) : p.is_solo ? (
                      <span className="text-on-surface-muted italic">Solo</span>
                    ) : (
                      <span className="text-on-surface-muted/50">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {isSelf ? (
                      <span className="inline-block rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                        Admin (Ty)
                      </span>
                    ) : (
                      <button
                        disabled={isPending}
                        onClick={() => handleToggleAdmin(p.user_id, isAdmin)}
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          isAdmin
                            ? "bg-primary/15 text-primary-dim hover:bg-primary/25"
                            : "bg-surface-high text-on-surface-muted hover:bg-surface-bright"
                        }`}
                        title={isAdmin ? "Kliknij aby odebrać admina" : "Kliknij aby nadać admina"}
                      >
                        {isAdmin ? "Admin" : "Uczestnik"}
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {p.project_name ? (
                      <span className="text-on-surface">{p.project_name}</span>
                    ) : p.project_id ? (
                      <span className="inline-block rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">Ma projekt</span>
                    ) : (
                      <span className="text-on-surface-muted/50">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {participants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-on-surface-muted">Brak uczestników</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
