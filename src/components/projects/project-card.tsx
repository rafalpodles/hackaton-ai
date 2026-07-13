"use client";

import Image from "next/image";
import type { ProjectWithTeam } from "@/lib/types";
import { useTilt } from "@/components/landing/garage/use-motion";

interface ProjectCardProps {
  project: ProjectWithTeam;
  showAuthors?: boolean;
  onClick: () => void;
}

export function ProjectCard({ project, showAuthors = false, onClick }: ProjectCardProps) {
  const firstTag = project.tech_stack?.[0];
  const tilt = useTilt();
  const initial = project.team[0]?.display_name?.charAt(0)?.toUpperCase() ?? "?";
  const authorLine = project.team.map((m) => m.display_name).join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      style={tilt.style}
      className="flex w-full flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(14,14,21,.6)] text-left transition-[border-color] hover:border-[rgba(139,140,245,.5)]"
    >
      {/* Thumbnail */}
      <div
        className="relative flex aspect-video w-full items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1a26, #12121b)" }}
      >
        {project.thumbnail_url ? (
          <Image
            src={project.thumbnail_url}
            alt={project.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
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
        )}

        {firstTag && (
          <span className="absolute left-3 top-3 rounded-[7px] bg-[rgba(99,102,241,.85)] px-[10px] py-[5px] font-jetbrains-mono text-[10px] uppercase tracking-[0.12em] text-white">
            {firstTag}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate font-chakra-petch text-lg font-bold text-on-surface">
          {project.name}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[42px] text-sm leading-[1.5] text-on-surface-dim">
          {project.description}
        </p>

        {showAuthors && (
          <div className="mt-[14px] flex items-center gap-2 border-t border-white/[0.07] pt-[14px]">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #ff5a4d)" }}
            >
              {initial}
            </div>
            <span className="truncate text-[13px] text-on-surface-muted">{authorLine}</span>
          </div>
        )}
      </div>
    </button>
  );
}
