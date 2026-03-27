"use client";

import { useState } from "react";
import { joinProject } from "@/lib/actions/projects";
import { GradientButton } from "@/components/ui/gradient-button";
import type { ProjectWithTeam } from "@/lib/types";

interface JoinProjectListProps {
  projects: ProjectWithTeam[];
}

export function JoinProjectList({ projects }: JoinProjectListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <p className="text-on-surface-muted text-sm">
        No projects available to join yet.
      </p>
    );
  }

  async function handleJoin(projectId: string) {
    setLoadingId(projectId);
    setError(null);
    try {
      await joinProject(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join project");
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
    <ul className="space-y-4">
      {projects.map((project) => (
        <li
          key={project.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-outline bg-surface-low/40 px-5 py-4"
        >
          <div className="min-w-0">
            <p className="font-space-grotesk font-semibold text-on-surface truncate">
              {project.name}
            </p>
            <p className="text-on-surface-muted text-xs mt-1">
              {project.team.length > 0
                ? project.team.map((m) => m.display_name).join(", ")
                : "No members yet"}
            </p>
          </div>
          <GradientButton
            variant="ghost"
            disabled={loadingId !== null}
            onClick={() => handleJoin(project.id)}
          >
            {loadingId === project.id ? "Joining..." : "Join \u2192"}
          </GradientButton>
        </li>
      ))}
    </ul>
    </div>
  );
}
