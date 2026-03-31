"use client";

import { useState } from "react";
import Image from "next/image";
import { removeMember } from "@/lib/actions/teams";
import type { Profile } from "@/lib/types";

type Member = Pick<Profile, "id" | "display_name" | "avatar_url" | "email">;

interface TeamMemberListProps {
  members: Member[];
  leaderId: string;
  isLeader: boolean;
  currentUserId: string;
}

export function TeamMemberList({
  members,
  leaderId,
  isLeader,
  currentUserId,
}: TeamMemberListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    try {
      await removeMember(memberId);
    } catch {
      setRemovingId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {members.map((member) => (
        <li
          key={member.id}
          className="flex items-center gap-3 rounded-lg border border-outline bg-surface-low/40 px-4 py-3"
        >
          {member.avatar_url ? (
            <Image
              src={member.avatar_url}
              alt={member.display_name}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary-dim">
              {member.display_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-on-surface">
              {member.display_name}
              {member.id === leaderId && (
                <span className="ml-2 text-xs font-normal text-primary-dim">
                  Lider
                </span>
              )}
              {member.id === currentUserId && (
                <span className="ml-2 text-xs font-normal text-on-surface-muted">
                  (Ty)
                </span>
              )}
            </p>
            <p className="truncate text-xs text-on-surface-muted">
              {member.email}
            </p>
          </div>
          {isLeader && member.id !== currentUserId && (
            <button
              type="button"
              onClick={() => handleRemove(member.id)}
              disabled={removingId === member.id}
              className="text-xs text-on-surface-muted hover:text-secondary transition-colors disabled:opacity-50"
            >
              {removingId === member.id ? "..." : "Usuń"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
