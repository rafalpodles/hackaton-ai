"use client";

import Image from "next/image";
import type { VoteCategory, ProjectWithTeam } from "@/lib/types";

interface VotingCategoryProps {
  category: VoteCategory;
  label: string;
  icon: string;
  projects: ProjectWithTeam[];
  selectedProjectId: string | null;
  ownProjectId: string | null;
  onSelect: (projectId: string) => void;
}

export default function VotingCategory({
  label,
  icon,
  projects,
  selectedProjectId,
  ownProjectId,
  onSelect,
}: VotingCategoryProps) {
  return (
    <div className="rounded-xl border border-outline bg-surface-low p-5">
      <h3 className="mb-4 flex items-center gap-2 font-space-grotesk text-lg font-bold text-on-surface">
        <span className="text-xl">{icon}</span>
        {label}
      </h3>

      <div className="flex flex-col gap-2">
        {projects.map((project) => {
          const isOwn = ownProjectId === project.id;
          const isSelected = selectedProjectId === project.id;

          return (
            <button
              key={project.id}
              type="button"
              disabled={isOwn}
              onClick={() => onSelect(project.id)}
              className={`relative flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-200 ${
                isOwn
                  ? "cursor-not-allowed border-outline/50 opacity-40"
                  : isSelected
                    ? "border-primary bg-primary/15 shadow-[0_0_12px_rgba(70,70,204,0.25)]"
                    : "cursor-pointer border-outline/60 bg-surface-low hover:border-outline hover:bg-surface-mid"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-surface-mid">
                {project.thumbnail_url ? (
                  <Image
                    src={project.thumbnail_url}
                    alt={project.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-on-surface-muted">
                    {project.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-space-grotesk text-sm font-semibold text-on-surface">
                  {project.name}
                </p>
                <p className="truncate text-xs text-on-surface-muted">
                  {project.description}
                </p>
              </div>

              {/* Own project label */}
              {isOwn && (
                <span className="flex-shrink-0 rounded bg-surface-mid px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-on-surface-muted">
                  Your project
                </span>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <span className="flex-shrink-0 text-primary">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <circle cx="10" cy="10" r="10" fill="currentColor" />
                    <path
                      d="M6 10.5L8.5 13L14 7.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
