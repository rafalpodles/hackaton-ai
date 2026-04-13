"use client";

import { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import type { Profile } from "@/lib/types";
import { generateOpenRouterKey, deleteOpenRouterKey, toggleUserRole } from "@/lib/actions/admin";
import ConfirmDialog from "@/components/ui/confirm-dialog";

type UserSortKey = "display_name" | "email" | "role" | "last_sign_in_at" | "confirmed_at";
type SortDir = "asc" | "desc";

interface UsersTableProps {
  currentUserId: string;
  users: (Profile & {
    project_name?: string | null;
    team_name?: string | null;
    key_usage?: number | null;
    key_limit?: number | null;
    confirmed_at?: string | null;
    last_sign_in_at?: string | null;
  })[];
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`ml-1 inline h-3 w-3 ${active ? "text-primary" : "text-on-surface-muted/30"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      {dir === "asc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4 4 4M12 3v18" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l-4 4-4-4M12 21V3" />
      )}
    </svg>
  );
}

export default function UsersTable({ currentUserId, users }: UsersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [expDays, setExpDays] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<UserSortKey>("display_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: UserSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getLimit = (userId: string) => limits[userId] ?? 5;
  const getExpDays = (userId: string) => expDays[userId] ?? 10;

  const filteredUsers = useMemo(() => {
    let list = search.trim()
      ? users.filter((u) => {
          const q = search.toLowerCase();
          return (
            u.display_name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.team_name?.toLowerCase().includes(q) ||
            u.project_name?.toLowerCase().includes(q)
          );
        })
      : [...users];

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "display_name") {
        cmp = (a.display_name ?? "").localeCompare(b.display_name ?? "", "pl");
      } else if (sortKey === "email") {
        cmp = (a.email ?? "").localeCompare(b.email ?? "", "pl");
      } else if (sortKey === "role") {
        cmp = (a.role ?? "").localeCompare(b.role ?? "");
      } else if (sortKey === "last_sign_in_at") {
        const aTime = a.last_sign_in_at ?? "";
        const bTime = b.last_sign_in_at ?? "";
        cmp = aTime.localeCompare(bTime);
      } else if (sortKey === "confirmed_at") {
        const aTime = a.confirmed_at ?? "";
        const bTime = b.confirmed_at ?? "";
        cmp = aTime.localeCompare(bTime);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [users, search, sortKey, sortDir]);

  const handleToggleRole = (userId: string, currentRole: string) => {
    setError(null);
    const newRole = currentRole === "admin" ? "participant" : "admin";
    startTransition(async () => {
      try {
        await toggleUserRole(userId, newRole);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd zmiany roli");
      }
    });
  };

  const handleGenerate = (userId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await generateOpenRouterKey(userId, getLimit(userId), getExpDays(userId));
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

      <div className="relative mb-4">
        <svg
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-muted/50"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj po nazwie, emailu, zespole..."
          className="w-full rounded-xl border border-outline bg-surface-low/60 py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none focus:ring-0"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-muted/50 hover:text-on-surface"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline bg-surface-low/60 backdrop-blur-md">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline">
              <th className="w-10 px-3 py-3 text-center font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                #
              </th>
              <th
                className="cursor-pointer select-none px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted hover:text-on-surface"
                onClick={() => toggleSort("display_name")}
              >
                Użytkownik
                <SortIcon active={sortKey === "display_name"} dir={sortKey === "display_name" ? sortDir : "asc"} />
              </th>
              <th
                className="cursor-pointer select-none px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted hover:text-on-surface"
                onClick={() => toggleSort("email")}
              >
                Email
                <SortIcon active={sortKey === "email"} dir={sortKey === "email" ? sortDir : "asc"} />
              </th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Projekt
              </th>
              <th
                className="cursor-pointer select-none px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted hover:text-on-surface"
                onClick={() => toggleSort("last_sign_in_at")}
              >
                Status / Logowanie
                <SortIcon active={sortKey === "last_sign_in_at"} dir={sortKey === "last_sign_in_at" ? sortDir : "asc"} />
              </th>
              <th
                className="cursor-pointer select-none px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted hover:text-on-surface"
                onClick={() => toggleSort("role")}
              >
                Rola
                <SortIcon active={sortKey === "role"} dir={sortKey === "role" ? sortDir : "asc"} />
              </th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Klucz API
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, idx) => {
              const hasKeyRequest = user.api_key_requested && !user.openrouter_api_key;
              return (
              <tr
                key={user.id}
                className={`border-b border-outline/50 last:border-b-0 ${
                  hasKeyRequest ? "bg-yellow-500/5" : ""
                }`}
              >
                <td className="w-10 px-3 py-4 text-center font-mono text-xs text-on-surface-muted">
                  {idx + 1}
                </td>
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
                  {user.team_name ? (
                    <span className="text-sm text-on-surface">
                      {user.team_name}
                    </span>
                  ) : (
                    <span className="text-sm text-on-surface-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {user.confirmed_at ? (
                    <div>
                      <span className="inline-block rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                        Aktywny
                      </span>
                      {user.last_sign_in_at && (
                        <p className="mt-1 text-[10px] text-on-surface-muted">
                          {new Date(user.last_sign_in_at).toLocaleDateString("pl-PL", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="inline-block rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">
                      Oczekuje
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {user.id === currentUserId ? (
                    <span className="inline-block rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                      Admin (Ty)
                    </span>
                  ) : (
                    <button
                      disabled={isPending}
                      onClick={() => handleToggleRole(user.id, user.role)}
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        user.role === "admin"
                          ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                          : "bg-surface-high text-on-surface-muted hover:bg-surface-bright"
                      }`}
                      title={user.role === "admin" ? "Kliknij aby usunąć admina" : "Kliknij aby nadać admina"}
                    >
                      {user.role === "admin" ? "Admin" : "Uczestnik"}
                    </button>
                  )}
                </td>
                <td className="px-5 py-4">
                  {user.openrouter_api_key ? (
                    <div className="space-y-2">
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
                      {user.key_limit != null && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-high">
                            <div
                              className={`h-full rounded-full transition-all ${
                                (user.key_usage ?? 0) / user.key_limit > 0.8
                                  ? "bg-secondary"
                                  : "bg-gradient-to-r from-primary to-primary-dim"
                              }`}
                              style={{
                                width: `${Math.min(
                                  ((user.key_usage ?? 0) / user.key_limit) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="shrink-0 font-mono text-[10px] text-on-surface-muted">
                            ${(user.key_usage ?? 0).toFixed(2)} / ${user.key_limit}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {hasKeyRequest && (
                        <span className="inline-block rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">
                          Prośba o klucz
                        </span>
                      )}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded bg-surface-high px-2 py-1" title="Limit wydatków ($)">
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
                      <div className="flex items-center gap-1 rounded bg-surface-high px-2 py-1" title="Ważność klucza (dni)">
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={getExpDays(user.id)}
                          onChange={(e) =>
                            setExpDays((prev) => ({
                              ...prev,
                              [user.id]: Number(e.target.value),
                            }))
                          }
                          className="w-10 border-none bg-transparent text-center font-mono text-xs text-on-surface focus:outline-none focus:ring-0"
                        />
                        <span className="text-xs text-on-surface-muted">dni</span>
                      </div>
                      <button
                        disabled={isPending}
                        onClick={() => handleGenerate(user.id)}
                        className="rounded-md bg-primary/15 px-3 py-1 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-primary-dim transition-colors hover:bg-primary/25 disabled:opacity-50"
                      >
                        {isPending ? "..." : "Generuj"}
                      </button>
                    </div>
                    </div>
                  )}
                </td>
              </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
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
