"use client";

import { useState, useCallback, useTransition } from "react";
import type { Project } from "@/lib/types";
import { updateProject, submitProject } from "@/lib/actions/projects";
import { FileUploadZone } from "./file-upload-zone";

interface SubmissionFormProps {
  project: Project;
}

export function SubmissionForm({ project }: SubmissionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [ideaOrigin, setIdeaOrigin] = useState(project.idea_origin ?? "");
  const [journey, setJourney] = useState(project.journey ?? "");
  const [techStack, setTechStack] = useState<string[]>(
    project.tech_stack ?? []
  );
  const [tagInput, setTagInput] = useState("");

  const [videoUrl, setVideoUrl] = useState(project.video_url);
  const [videoDuration, setVideoDuration] = useState(project.video_duration);
  const [thumbnailUrl, setThumbnailUrl] = useState(project.thumbnail_url);
  const [pdfUrl, setPdfUrl] = useState(project.pdf_url);

  const save = useCallback(
    (data: Parameters<typeof updateProject>[1]) => {
      startTransition(async () => {
        try {
          await updateProject(project.id, data);
        } catch {
          // Silently fail on auto-save
        }
      });
    },
    [project.id]
  );

  const handleSubmit = () => {
    setSubmitError(null);

    // Client-side validation before calling server action
    if (!name.trim()) {
      setSubmitError("Project name is required.");
      return;
    }
    if (!description.trim()) {
      setSubmitError("Project description is required.");
      return;
    }
    if (!videoUrl) {
      setSubmitError("Demo video is required.");
      return;
    }

    startTransition(async () => {
      try {
        await submitProject(project.id);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Submission failed"
        );
      }
    });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !techStack.includes(tag)) {
      const next = [...techStack, tag];
      setTechStack(next);
      save({ tech_stack: next });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    const next = techStack.filter((t) => t !== tag);
    setTechStack(next);
    save({ tech_stack: next });
  };

  return (
    <div className="relative">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none fixed -left-20 top-40 h-80 w-80 rounded-full bg-secondary/5 blur-[100px]" />

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-12">
          <h1 className="font-space-grotesk text-5xl font-extrabold tracking-tighter text-on-surface">
            PROJECT SUBMISSION
          </h1>
          <p className="mt-2 max-w-2xl text-lg font-light text-on-surface-muted">
            Document your build, showcase your journey, and submit your project
            for the hackathon.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left column — Form fields */}
          <div className="space-y-10 lg:col-span-7">
            {/* Project name */}
            <div className="space-y-2">
              <label className="font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-primary-dim">
                Project Identity
              </label>
              <h2 className="font-space-grotesk text-2xl font-bold text-on-surface">
                What&apos;s your project called?
              </h2>
              <div className="group relative">
                <input
                  className="w-full border-none bg-black p-6 text-lg text-on-surface placeholder:text-on-surface-muted/30 focus:outline-none focus:ring-0"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => save({ name })}
                  placeholder="Enter your project name..."
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-primary to-secondary transition-transform duration-500 group-focus-within:scale-x-100" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="font-space-grotesk text-2xl font-bold text-on-surface">
                What does your project do?
              </h2>
              <div className="group relative">
                <textarea
                  className="min-h-[140px] w-full resize-none border-none bg-black p-6 text-lg leading-relaxed text-on-surface placeholder:text-on-surface-muted/30 focus:outline-none focus:ring-0"
                  maxLength={280}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => save({ description })}
                  placeholder="Describe the core utility and problem solved..."
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-primary to-secondary transition-transform duration-500 group-focus-within:scale-x-100" />
              </div>
              <p className="text-right font-space-grotesk text-[10px] tracking-widest text-on-surface-muted">
                {description.length} / 280
              </p>
            </div>

            {/* Idea Origin */}
            <div className="space-y-2">
              <h2 className="font-space-grotesk text-2xl font-bold text-on-surface">
                How did you get the idea?
              </h2>
              <div className="group relative">
                <textarea
                  className="min-h-[140px] w-full resize-none border-none bg-black p-6 text-lg leading-relaxed text-on-surface placeholder:text-on-surface-muted/30 focus:outline-none focus:ring-0"
                  value={ideaOrigin}
                  onChange={(e) => setIdeaOrigin(e.target.value)}
                  onBlur={() => save({ idea_origin: ideaOrigin })}
                  placeholder="Tell us about the 'Eureka' moment..."
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-primary to-secondary transition-transform duration-500 group-focus-within:scale-x-100" />
              </div>
            </div>

            {/* Journey */}
            <div className="space-y-2">
              <h2 className="font-space-grotesk text-2xl font-bold text-on-surface">
                What was your journey?
              </h2>
              <div className="group relative">
                <textarea
                  className="min-h-[140px] w-full resize-none border-none bg-black p-6 text-lg leading-relaxed text-on-surface placeholder:text-on-surface-muted/30 focus:outline-none focus:ring-0"
                  value={journey}
                  onChange={(e) => setJourney(e.target.value)}
                  onBlur={() => save({ journey })}
                  placeholder="Challenges, pivots, and breakthroughs..."
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-primary to-secondary transition-transform duration-500 group-focus-within:scale-x-100" />
              </div>
            </div>

            {/* Tech Stack */}
            <div className="space-y-4">
              <h2 className="font-space-grotesk text-2xl font-bold text-on-surface">
                Tech stack used
              </h2>
              <div className="flex flex-wrap gap-3 bg-black p-6">
                {techStack.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-space-grotesk text-xs uppercase tracking-wider text-primary-dim"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-primary-dim/60 transition hover:text-secondary"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                <input
                  className="w-32 border-none bg-transparent font-space-grotesk text-sm tracking-widest text-on-surface-muted placeholder:text-on-surface-muted/30 focus:outline-none focus:ring-0"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tech..."
                />
              </div>
            </div>
          </div>

          {/* Right column — Asset uploads */}
          <div className="space-y-8 lg:col-span-5">
            <div className="space-y-6">
              <label className="font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-primary-dim">
                Proof of Build
              </label>

              {/* Video upload */}
              <FileUploadZone
                bucket="videos"
                projectId={project.id}
                path="demo"
                accept="video/*"
                label="Demo Video"
                hint="MP4, MOV — max 60 seconds, up to 50MB"
                maxSizeMb={50}
                maxDurationSec={60}
                currentUrl={videoUrl}
                onUploadComplete={(url, duration) => {
                  setVideoUrl(url);
                  if (duration) setVideoDuration(Math.round(duration));
                  save({
                    video_url: url,
                    video_duration: duration
                      ? Math.round(duration)
                      : undefined,
                  });
                }}
              />

              {/* PDF upload */}
              <FileUploadZone
                bucket="presentations"
                projectId={project.id}
                path="presentation"
                accept="application/pdf"
                label="Presentation"
                hint="PDF up to 20MB"
                maxSizeMb={20}
                currentUrl={pdfUrl}
                onUploadComplete={(url) => {
                  setPdfUrl(url);
                  save({ pdf_url: url });
                }}
              />

              {/* Thumbnail upload */}
              <FileUploadZone
                bucket="thumbnails"
                projectId={project.id}
                path="thumb"
                accept="image/*"
                label="Thumbnail"
                hint="Project thumbnail image, up to 5MB"
                maxSizeMb={5}
                currentUrl={thumbnailUrl}
                onUploadComplete={(url) => {
                  setThumbnailUrl(url);
                  save({ thumbnail_url: url });
                }}
              />

              {/* Info box */}
              <div className="flex gap-4 rounded-lg bg-surface-high/50 p-6">
                <svg className="h-5 w-5 shrink-0 text-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <div>
                  <p className="font-space-grotesk text-sm font-bold tracking-tight text-on-surface">
                    SUBMISSION GUIDELINE
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">
                    Ensure your video shows a live demo of your project.
                    Name, description, and video are required to submit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit section */}
        <div className="mt-16">
          {/* Warning */}
          <div className="mb-6 rounded-lg bg-secondary/5 p-4">
            <p className="text-xs text-secondary-dim">
              <strong>Warning:</strong> After submitting you will not be able to
              edit your project. Make sure all information is correct.
            </p>
          </div>

          {submitError && (
            <p className="mb-4 font-space-grotesk text-sm font-semibold text-secondary">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="group flex h-20 w-full items-center justify-center gap-4 bg-gradient-to-br from-primary via-primary to-secondary transition-all hover:shadow-[0_0_40px_rgba(164,165,255,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-space-grotesk text-xl font-extrabold tracking-[0.2em] text-white">
              {isPending ? "SUBMITTING..." : "SUBMIT PROJECT"}
            </span>
            {!isPending && (
              <svg className="h-6 w-6 text-white transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            )}
          </button>
          <p className="mt-4 text-center font-space-grotesk text-[10px] uppercase tracking-widest text-on-surface-muted">
            By submitting, you confirm all information is accurate.
          </p>
        </div>
      </div>
    </div>
  );
}
