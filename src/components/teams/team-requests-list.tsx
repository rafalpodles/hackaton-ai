"use client";

import { useState } from "react";
import { approveRequest, rejectRequest } from "@/lib/actions/teams";
import type { TeamRequestWithUser } from "@/lib/types";

interface TeamRequestsListProps {
  requests: TeamRequestWithUser[];
}

export function TeamRequestsList({ requests }: TeamRequestsListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function handleApprove(requestId: string) {
    setProcessingId(requestId);
    try {
      await approveRequest(requestId);
    } catch {
      setProcessingId(null);
    }
  }

  async function handleReject(requestId: string) {
    setProcessingId(requestId);
    try {
      await rejectRequest(requestId);
    } catch {
      setProcessingId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {requests.map((req) => (
        <li
          key={req.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-outline bg-surface-low/40 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">
              {req.user.display_name}
            </p>
            <p className="truncate text-xs text-on-surface-muted">
              {req.user.email}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleApprove(req.id)}
              disabled={processingId !== null}
              className="rounded-md bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary-dim hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              {processingId === req.id ? "..." : "Akceptuj"}
            </button>
            <button
              type="button"
              onClick={() => handleReject(req.id)}
              disabled={processingId !== null}
              className="rounded-md bg-surface-high px-3 py-1.5 text-xs text-on-surface-muted hover:text-secondary transition-colors disabled:opacity-50"
            >
              Odrzuć
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
