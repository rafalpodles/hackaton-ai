"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProjectWithTeam } from "@/lib/types";
import { VideoFeedItem } from "@/components/feed/video-feed-item";
import { ProjectDetailModal } from "@/components/projects/project-detail-modal";
import { GradientButton } from "@/components/ui/gradient-button";

interface VideoFeedProps {
  projects: ProjectWithTeam[];
}

export function VideoFeed({ projects }: VideoFeedProps) {
  const [selectedProject, setSelectedProject] =
    useState<ProjectWithTeam | null>(null);

  return (
    <>
      <div className="h-screen snap-y snap-mandatory overflow-y-scroll">
        {projects.map((project, i) => (
          <VideoFeedItem
            key={project.id}
            project={project}
            index={i}
            total={projects.length}
            onViewDetails={() => setSelectedProject(project)}
          />
        ))}

        {/* End slide */}
        <div className="flex h-screen snap-start flex-col items-center justify-center gap-6">
          <h2 className="font-space-grotesk text-3xl font-bold text-on-surface">
            To wszystko!
          </h2>
          <p className="text-on-surface-muted">
            To już wszystkie projekty. Czas głosować!
          </p>
          <Link href="/vote">
            <GradientButton>Głosuj &rarr;</GradientButton>
          </Link>
        </div>
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
}
