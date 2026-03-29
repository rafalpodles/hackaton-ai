"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VoteCategory, ProjectWithTeam } from "@/lib/types";
import { castVotes } from "@/lib/actions/voting";
import VotingCategory from "./voting-category";
import VoteSubmitBar from "./vote-submit-bar";

const CATEGORIES: { key: VoteCategory; label: string; icon: string }[] = [
  { key: "best_overall", label: "Najlepszy projekt", icon: "\u25C6" },
  { key: "best_demo_ux", label: "Najlepsze demo / UX", icon: "\u25C7" },
  { key: "most_creative", label: "Najbardziej kreatywny", icon: "\u2726" },
];

interface VotingBoardProps {
  projects: ProjectWithTeam[];
  ownProjectId: string | null;
  hasVoted: boolean;
  votedFor?: Record<string, string>;
}

export default function VotingBoard({
  projects,
  ownProjectId,
  hasVoted,
  votedFor = {},
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
    // Build a map of project_id -> project for quick lookup
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-4">
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
            Głosy oddane
          </h2>
          <p className="text-on-surface-muted">
            Głosy zapisane! Wyniki poznasz wkrótce.
          </p>
        </div>

        <div className="mx-auto max-w-2xl space-y-4">
          <h3 className="font-space-grotesk text-sm font-semibold uppercase tracking-wider text-on-surface-muted">
            Twoje wybory
          </h3>
          {CATEGORIES.map((cat) => {
            const projectId = votedFor[cat.key];
            const project = projectId ? projectMap.get(projectId) : null;

            return (
              <div
                key={cat.key}
                className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4"
              >
                <span className="text-xl">{cat.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary-dim">
                    {cat.label}
                  </p>
                  <p className="truncate font-space-grotesk text-base font-bold text-on-surface">
                    {project?.name ?? "Nieznany projekt"}
                  </p>
                  {project?.team && project.team.length > 0 && (
                    <p className="truncate text-xs text-on-surface-muted">
                      {project.team.map((m) => m.display_name).join(", ")}
                    </p>
                  )}
                </div>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 text-primary"
                >
                  <circle cx="12" cy="12" r="10" fill="currentColor" />
                  <path
                    d="M8 12.5L10.5 15L16 9.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            );
          })}
        </div>
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

    try {
      const result = await castVotes(votes);

      if (result.error) {
        setError(result.error);
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } finally {
      setSubmitting(false);
    }
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
