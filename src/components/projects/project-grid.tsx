"use client";

import { useState } from "react";
import type { ProjectWithTeam } from "@/lib/types";
import { ProjectCard } from "./project-card";
import { ProjectDetailModal } from "./project-detail-modal";

interface ProjectGridProps {
  projects: ProjectWithTeam[];
  showAuthors?: boolean;
}

export function ProjectGrid({ projects, showAuthors = false }: ProjectGridProps) {
  const [selectedProject, setSelectedProject] =
    useState<ProjectWithTeam | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            showAuthors={showAuthors}
            onClick={() => setSelectedProject(project)}
          />
        ))}
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          showAuthors={showAuthors}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
}
