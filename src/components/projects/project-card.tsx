"use client";

import Image from "next/image";
import type { ProjectWithTeam } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectWithTeam;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const firstTag = project.tech_stack?.[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-outline bg-surface-low text-left transition-all duration-200 hover:border-primary/30 hover:shadow-[0_0_24px_rgba(70,70,204,0.15)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface-high">
        {project.thumbnail_url ? (
          <Image
            src={project.thumbnail_url}
            alt={project.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-12 w-12 text-on-surface-muted/40"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
        )}

        {firstTag && (
          <span className="absolute left-2 top-2 rounded bg-primary/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {firstTag}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="truncate font-space-grotesk text-base font-bold text-on-surface">
          {project.name}
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-on-surface-muted">
          {project.description}
        </p>

        {/* Team */}
        <div className="mt-auto flex items-center gap-2 pt-3">
          <div className="flex -space-x-1.5">
            {project.team.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-surface-low bg-surface-high text-[10px] font-bold uppercase text-primary-dim"
                title={member.display_name}
              >
                {member.display_name?.charAt(0) ?? "?"}
              </div>
            ))}
          </div>
          <span className="truncate text-xs text-on-surface-muted">
            {project.team.map((m) => m.display_name).join(", ")}
          </span>
        </div>
      </div>
    </button>
  );
}
