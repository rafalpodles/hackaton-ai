"use client";

import { useState, useEffect } from "react";
import type { ProjectWithTeam } from "@/lib/types";
import { VideoPlayer } from "@/components/ui/video-player";

interface ProjectDetailModalProps {
  project: ProjectWithTeam;
  onClose: () => void;
}

type View = "video" | "presentation";

export function ProjectDetailModal({
  project,
  onClose,
}: ProjectDetailModalProps) {
  const [view, setView] = useState<View>("video");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative mx-4 flex h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-outline bg-surface-low shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-high/80 text-on-surface-muted transition-colors hover:text-on-surface"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="grid flex-1 overflow-hidden md:grid-cols-[1fr,400px]">
          {/* Left: Video or PDF preview */}
          <div className="flex flex-col bg-surface">
            {/* View toggle */}
            <div className="flex items-center gap-2 border-b border-outline px-6 py-3">
              <div className="flex gap-1 rounded-lg bg-surface-high p-1">
                <button
                  type="button"
                  onClick={() => setView("video")}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    view === "video"
                      ? "bg-primary/20 text-primary-dim"
                      : "text-on-surface-muted hover:text-on-surface"
                  }`}
                >
                  Demo Video
                </button>
                <button
                  type="button"
                  onClick={() => setView("presentation")}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    view === "presentation"
                      ? "bg-primary/20 text-primary-dim"
                      : "text-on-surface-muted hover:text-on-surface"
                  }`}
                >
                  Presentation
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex flex-1 items-center justify-center p-6">
              {view === "video" ? (
                project.video_url ? (
                  <VideoPlayer
                    src={project.video_url}
                    className="aspect-video w-full max-h-full rounded-lg"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-surface-high">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-16 w-16 text-on-surface-muted/30"
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
                      <p className="mt-2 text-sm text-on-surface-muted">No video uploaded</p>
                    </div>
                  </div>
                )
              ) : project.pdf_url ? (
                <iframe
                  src={project.pdf_url}
                  className="h-full w-full rounded-lg border border-outline"
                  title={`${project.name} — Presentation`}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-surface-high">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-16 w-16 text-on-surface-muted/30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-on-surface-muted">No presentation uploaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Project info */}
          <div className="flex flex-col gap-4 overflow-y-auto border-l border-outline p-6">
            <h2 id="project-detail-title" className="font-space-grotesk text-2xl font-bold text-on-surface">
              {project.name}
            </h2>

            {/* Tech tags */}
            {(project.tech_stack ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(project.tech_stack ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-outline bg-surface-high px-3 py-1 text-xs font-medium text-primary-dim"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Team */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {project.team.map((member) => (
                  <div
                    key={member.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-low bg-surface-high text-xs font-bold uppercase text-primary-dim"
                    title={member.display_name}
                  >
                    {member.display_name?.charAt(0) ?? "?"}
                  </div>
                ))}
              </div>
              <span className="text-sm text-on-surface-muted">
                {project.team.map((m) => m.display_name).join(", ")}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-outline" />

            {/* Project details */}
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-on-surface-muted">
              {project.description && (
                <div>
                  <h4 className="mb-1 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-on-surface">
                    Description
                  </h4>
                  <p>{project.description}</p>
                </div>
              )}
              {project.idea_origin && (
                <div>
                  <h4 className="mb-1 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-on-surface">
                    Idea Origin
                  </h4>
                  <p>{project.idea_origin}</p>
                </div>
              )}
              {project.journey && (
                <div>
                  <h4 className="mb-1 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-on-surface">
                    Journey
                  </h4>
                  <p>{project.journey}</p>
                </div>
              )}
            </div>

            {/* Download PDF link if available */}
            {project.pdf_url && (
              <>
                <div className="h-px bg-outline" />
                <a
                  href={project.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary-dim transition-colors hover:bg-primary/20"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Download PDF
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
