"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateHackathon } from "@/lib/actions/hackathons";
import { START_PAGE_KEYS, START_PAGE_LABELS, type StartPageKey } from "@/lib/start-pages";

export default function StartPagesVisibility({
  hackathonId,
  slug,
  hiddenPages,
}: {
  hackathonId: string;
  slug: string;
  hiddenPages: string[];
}) {
  const [hidden, setHidden] = useState<string[]>(hiddenPages);
  const [isPending, startTransition] = useTransition();

  function toggle(key: StartPageKey) {
    const next = hidden.includes(key)
      ? hidden.filter((k) => k !== key)
      : [...hidden, key];
    setHidden(next);
    startTransition(() => updateHackathon(hackathonId, { hidden_start_pages: next }));
  }

  return (
    <ul className="space-y-2">
      {START_PAGE_KEYS.map((key) => {
        const isHidden = hidden.includes(key);
        return (
          <li
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border border-outline bg-surface/40 px-4 py-2.5"
          >
            <Link
              href={`/h/${slug}/${key}`}
              className="text-sm text-on-surface transition-colors hover:text-primary-dim"
            >
              {START_PAGE_LABELS[key]}
            </Link>
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={isPending}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-space-grotesk text-sm font-bold transition-colors disabled:opacity-50 ${
                isHidden
                  ? "bg-surface-high text-on-surface-muted hover:bg-surface-bright"
                  : "bg-primary/15 text-primary-dim hover:bg-primary/25"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${isHidden ? "bg-on-surface-muted/40" : "bg-primary-dim"}`}
              />
              {isHidden ? "Ukryta" : "Widoczna"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
