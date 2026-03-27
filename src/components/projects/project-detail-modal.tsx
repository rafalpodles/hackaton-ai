"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  // Smart default: show video if available, otherwise PDF
  const defaultView: View = project.video_url
    ? "video"
    : project.pdf_url
      ? "presentation"
      : "video";

  const [view, setView] = useState<View>(defaultView);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const techStack = project.tech_stack ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm backdrop-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative mx-4 flex h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-outline bg-surface-low shadow-2xl modal-enter modal-glow">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-outline bg-surface/80 text-on-surface-muted backdrop-blur-md transition-all duration-200 hover:border-secondary/30 hover:bg-surface-high hover:text-secondary hover:scale-105"
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

        <div className="grid flex-1 overflow-hidden md:grid-cols-[3fr,2fr]">
          {/* Left: Video or PDF preview */}
          <div className="flex flex-col bg-surface">
            {/* Segmented toggle */}
            <div className="flex items-center px-6 py-4">
              <div className="relative flex rounded-xl bg-surface-high/80 p-1">
                {/* Sliding indicator */}
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-primary transition-transform duration-300 ease-out ${
                    view === "presentation"
                      ? "translate-x-[calc(100%+4px)]"
                      : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setView("video")}
                  className={`relative z-10 flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-colors duration-300 ${
                    view === "video"
                      ? "text-white"
                      : "text-on-surface-muted hover:text-on-surface"
                  }`}
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
                      d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                  Demo
                </button>
                <button
                  type="button"
                  onClick={() => setView("presentation")}
                  className={`relative z-10 flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-colors duration-300 ${
                    view === "presentation"
                      ? "text-white"
                      : "text-on-surface-muted hover:text-on-surface"
                  }`}
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
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                  Slides
                </button>
              </div>
            </div>

            {/* Content area with crossfade */}
            <div className="flex flex-1 items-center justify-center p-4">
              <div key={view} className="flex h-full w-full items-center justify-center content-fade-in">
                {view === "video" ? (
                  project.video_url ? (
                    <VideoPlayer
                      src={project.video_url}
                      autoPlay
                      className="aspect-video w-full max-h-full rounded-lg"
                    />
                  ) : (
                    <EmptyState
                      icon="video"
                      text="No video uploaded"
                    />
                  )
                ) : project.pdf_url ? (
                  <iframe
                    src={project.pdf_url}
                    className="h-full w-full rounded-lg border border-outline"
                    title={`${project.name} — Presentation`}
                  />
                ) : (
                  <EmptyState
                    icon="pdf"
                    text="No presentation uploaded"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: Project info */}
          <div className="flex flex-col gap-5 overflow-y-auto border-l border-outline p-6">
            {/* Title with accent */}
            <div className="space-y-2">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-secondary" />
              <h2
                id="project-detail-title"
                className="font-space-grotesk text-3xl font-bold leading-tight text-on-surface"
              >
                {project.name}
              </h2>
            </div>

            {/* Team */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {project.team.map((member) => (
                  member.avatar_url ? (
                    <Image
                      key={member.id}
                      src={member.avatar_url}
                      alt={member.display_name}
                      width={36}
                      height={36}
                      className="rounded-full border-2 border-surface-low object-cover transition-transform hover:z-10 hover:scale-110"
                      title={member.display_name}
                    />
                  ) : (
                    <div
                      key={member.id}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface-low bg-gradient-to-br from-primary/30 to-secondary/20 text-xs font-bold uppercase text-primary-dim ring-1 ring-primary/20 transition-transform hover:z-10 hover:scale-110"
                      title={member.display_name}
                    >
                      {member.display_name?.charAt(0) ?? "?"}
                    </div>
                  )
                ))}
              </div>
              <span className="text-sm text-on-surface-muted">
                {project.team.map((m) => m.display_name).join(", ")}
              </span>
            </div>

            {/* Description — no header needed, it's obvious */}
            {project.description && (
              <div className="rounded-lg bg-surface-high/50 p-4">
                <p className="text-sm leading-relaxed text-on-surface-muted">
                  {project.description}
                </p>
              </div>
            )}

            {/* Idea Origin */}
            {project.idea_origin && (
              <div className="rounded-lg bg-surface-high/50 p-4">
                <h4 className="mb-2 flex items-center gap-2 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-primary-dim">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  The Spark
                </h4>
                <p className="text-sm leading-relaxed text-on-surface-muted">
                  {project.idea_origin}
                </p>
              </div>
            )}

            {/* Journey */}
            {project.journey && (
              <div className="rounded-lg bg-surface-high/50 p-4">
                <h4 className="mb-2 flex items-center gap-2 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-primary-dim">
                  <span className="h-1 w-1 rounded-full bg-secondary" />
                  The Build
                </h4>
                <p className="text-sm leading-relaxed text-on-surface-muted">
                  {project.journey}
                </p>
              </div>
            )}

            {/* Tech stack — at the bottom */}
            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {techStack.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary-dim transition-colors hover:border-primary/40 hover:bg-primary/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Download PDF */}
            {project.pdf_url && (
              <a
                href={project.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 text-sm font-semibold text-primary-dim transition-all duration-200 hover:border-primary/40 hover:from-primary/20 hover:to-primary/10 hover:shadow-lg hover:shadow-primary/10"
              >
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
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
                Download Presentation
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: "video" | "pdf"; text: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-surface-high">
      <div className="text-center">
        <svg
          className="mx-auto h-16 w-16 text-on-surface-muted/30"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          {icon === "video" ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          )}
        </svg>
        <p className="mt-2 text-sm text-on-surface-muted">{text}</p>
      </div>
    </div>
  );
}
