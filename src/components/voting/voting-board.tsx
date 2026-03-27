"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VoteCategory, ProjectWithTeam } from "@/lib/types";
import { castVotes } from "@/lib/actions/voting";
import VotingCategory from "./voting-category";
import VoteSubmitBar from "./vote-submit-bar";

const CATEGORIES: { key: VoteCategory; label: string; icon: string }[] = [
  { key: "best_overall", label: "Best Overall", icon: "\u25C6" },
  { key: "best_demo_ux", label: "Best Demo/UX", icon: "\u25C7" },
  { key: "most_creative", label: "Most Creative", icon: "\u2726" },
];

interface VotingBoardProps {
  projects: ProjectWithTeam[];
  ownProjectId: string | null;
  hasVoted: boolean;
}

export default function VotingBoard({
  projects,
  ownProjectId,
  hasVoted,
}: VotingBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selections, setSelections] = useState<
    Record<VoteCategory, string | null>
  >({
    best_overall: null,
    best_demo_ux: null,
    most_creative: null,
  });

  if (hasVoted) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="text-primary"
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="font-space-grotesk text-2xl font-bold text-on-surface">
          Votes Submitted
        </h2>
        <p className="text-on-surface-muted">
          Your votes have been recorded. Results will be revealed soon.
        </p>
      </div>
    );
  }

  function handleSelect(category: VoteCategory, projectId: string) {
    setSelections((prev) => ({
      ...prev,
      [category]: prev[category] === projectId ? null : projectId,
    }));
    setError(null);
  }

  async function handleSubmit() {
    const votes = Object.entries(selections)
      .filter(([, pid]) => pid !== null)
      .map(([category, project_id]) => ({
        category: category as VoteCategory,
        project_id: project_id!,
      }));

    if (votes.length !== 3) return;

    setSubmitting(true);
    setError(null);

    const result = await castVotes(votes);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 pb-24 lg:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <VotingCategory
            key={cat.key}
            category={cat.key}
            label={cat.label}
            icon={cat.icon}
            projects={projects}
            selectedProjectId={selections[cat.key]}
            ownProjectId={ownProjectId}
            onSelect={(pid) => handleSelect(cat.key, pid)}
          />
        ))}
      </div>

      <VoteSubmitBar
        selections={selections}
        onSubmit={handleSubmit}
        submitting={submitting || isPending}
      />
    </>
  );
}
