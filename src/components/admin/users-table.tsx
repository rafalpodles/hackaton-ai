"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { Profile } from "@/lib/types";
import { generateOpenRouterKey, deleteOpenRouterKey } from "@/lib/actions/admin";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface UsersTableProps {
  users: (Profile & { project_name?: string | null })[];
}

export default function UsersTable({ users }: UsersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const getLimit = (userId: string) => limits[userId] ?? 5;

  const handleGenerate = (userId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await generateOpenRouterKey(userId, getLimit(userId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd generowania klucza");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteOpenRouterKey(deleteTarget.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd usuwania klucza");
      }
      setDeleteTarget(null);
    });
  };

  return (
    <>
      {error && (
        <p className="mb-4 rounded-lg bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-outline bg-surface-low/60 backdrop-blur-md">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline">
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Użytkownik
              </th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Email
              </th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Projekt
              </th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Rola
              </th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Klucz API
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-outline/50 last:border-b-0"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.display_name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-space-grotesk text-xs font-bold text-primary-dim">
                        {user.display_name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                    <span className="font-space-grotesk text-sm font-semibold text-on-surface">
                      {user.display_name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-on-surface-muted">
                  {user.email}
                </td>
                <td className="px-5 py-4">
                  {user.project_name ? (
                    <span className="text-sm text-on-surface">
                      {user.project_name}
                    </span>
                  ) : (
                    <span className="text-sm text-on-surface-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-primary/15 text-primary-dim"
                        : "bg-surface-high text-on-surface-muted"
                    }`}
                  >
                    {user.role === "admin" ? "Admin" : "Uczestnik"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {user.openrouter_api_key ? (
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-surface-high px-2 py-1 font-mono text-xs text-primary-dim">
                        {user.openrouter_api_key.slice(0, 12)}...
                      </code>
                      <button
                        disabled={isPending}
                        onClick={() =>
                          setDeleteTarget({
                            id: user.id,
                            name: user.display_name,
                          })
                        }
                        className="rounded-md px-2 py-1 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50"
                      >
                        Usuń
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded bg-surface-high px-2 py-1">
                        <span className="text-xs text-on-surface-muted">$</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={getLimit(user.id)}
                          onChange={(e) =>
                            setLimits((prev) => ({
                              ...prev,
                              [user.id]: Number(e.target.value),
                            }))
                          }
                          className="w-12 border-none bg-transparent text-center font-mono text-xs text-on-surface focus:outline-none focus:ring-0"
                        />
                      </div>
                      <button
                        disabled={isPending}
                        onClick={() => handleGenerate(user.id)}
                        className="rounded-md bg-primary/15 px-3 py-1 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-primary-dim transition-colors hover:bg-primary/25 disabled:opacity-50"
                      >
                        {isPending ? "..." : "Generuj"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-sm text-on-surface-muted"
                >
                  Brak użytkowników
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Usuń klucz API"
          message={`Czy na pewno chcesz usunąć klucz API dla "${deleteTarget.name}"? Klucz zostanie odwołany w OpenRouter.`}
          confirmLabel="Usuń"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
