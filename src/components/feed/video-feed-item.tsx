"use client";

import { useRef, useEffect } from "react";
import type { ProjectWithTeam } from "@/lib/types";

interface VideoFeedItemProps {
  project: ProjectWithTeam;
  index: number;
  total: number;
  onViewDetails: () => void;
}

export function VideoFeedItem({
  project,
  index,
  total,
  onViewDetails,
}: VideoFeedItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const projectNumber = String(index + 1).padStart(2, "0");

  return (
    <div
      ref={containerRef}
      className="flex h-screen snap-start flex-col items-center justify-center px-6"
    >
      {/* Counter */}
      <div className="absolute right-6 top-6 rounded-full bg-surface-high/80 px-3 py-1 text-sm font-medium text-on-surface-muted backdrop-blur-sm">
        {index + 1} / {total}
      </div>

      {/* Video */}
      <div className="w-full max-w-4xl">
        {project.video_url ? (
          <video
            ref={videoRef}
            src={project.video_url}
            controls
            muted
            playsInline
            preload={index < 2 ? "auto" : "metadata"}
            className="aspect-video w-full rounded-xl bg-black"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-surface-high">
            <svg
              className="h-16 w-16 text-on-surface-muted/30"
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
      </div>

      {/* Info below video */}
      <div className="mt-4 flex w-full max-w-4xl items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-primary-dim">
            Project #{projectNumber}
          </p>
          <h2 className="font-space-grotesk text-2xl font-bold text-on-surface">
            {project.name}
          </h2>
          {project.description && (
            <p className="mt-1 line-clamp-2 text-sm text-on-surface-muted">
              {project.description}
            </p>
          )}
          {project.team.length > 0 && (
            <p className="mt-2 text-sm text-secondary">
              {project.team.map((m) => m.display_name).join(", ")}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="shrink-0 text-sm font-medium text-primary-dim transition-colors hover:text-on-surface"
        >
          View Full Project Details &rarr;
        </button>
      </div>
    </div>
  );
}
