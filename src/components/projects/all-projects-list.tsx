"use client";

import { useState } from "react";
import Image from "next/image";
import type { Profile, Project } from "@/lib/types";
import { ProjectDetailModal } from "./project-detail-modal";

interface ProjectListItem extends Project {
  team_name: string | null;
  members: Pick<Profile, "id" | "display_name" | "avatar_url">[];
  is_solo: boolean;
  solo_user: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
}

interface AllProjectsListProps {
  projects: ProjectListItem[];
}

export function AllProjectsList({ projects }: AllProjectsListProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectListItem | null>(null);

  return (
    <>
      <div className="space-y-4">
        {projects.map((project) => {
          const isClickable = project.is_submitted;

          return (
            <div
              key={project.id}
              onClick={isClickable ? () => setSelectedProject(project) : undefined}
              className={`flex gap-4 rounded-xl border border-outline bg-surface-high/30 p-4 transition-colors sm:gap-5 sm:p-5 ${
                isClickable
                  ? "cursor-pointer hover:border-primary/30 hover:bg-surface-high/50"
                  : ""
              }`}
            >
              {/* Thumbnail */}
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-high sm:h-24 sm:w-36">
                {project.thumbnail_url ? (
                  <Image
                    src={project.thumbnail_url}
                    alt={project.name}
                    width={144}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg
                      className="h-8 w-8 text-on-surface-muted/20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-space-grotesk text-base font-bold text-on-surface truncate sm:text-lg">
                      {project.name}
                    </h3>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      project.is_submitted
                        ? "bg-green-500/15 text-green-400"
                        : "bg-surface-high text-on-surface-muted"
                    }`}
                  >
                    {project.is_submitted ? "Zatwierdzony" : "W trakcie"}
                  </span>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-on-surface-muted leading-relaxed">
                    {project.description}
                  </p>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {selectedProject && selectedProject.is_submitted && (
        <ProjectDetailModal
          project={{
            ...selectedProject,
            team: selectedProject.members,
          }}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
}
