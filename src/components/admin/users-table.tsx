"use client";

import Image from "next/image";
import type { Profile } from "@/lib/types";

interface UsersTableProps {
  users: (Profile & { project_name?: string | null })[];
}

export default function UsersTable({ users }: UsersTableProps) {
  return (
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
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="px-5 py-8 text-center text-sm text-on-surface-muted"
              >
                Brak użytkowników
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
