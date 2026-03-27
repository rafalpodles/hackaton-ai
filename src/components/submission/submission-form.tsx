"use client";

import { useState, useCallback, useTransition } from "react";
import type { Project } from "@/lib/types";
import { updateProject, submitProject } from "@/lib/actions/projects";
import { GradientButton } from "@/components/ui/gradient-button";
import { SubmissionStepper } from "./submission-stepper";
import { FileUploadZone } from "./file-upload-zone";

const TOTAL_STEPS = 4;

interface SubmissionFormProps {
  project: Project;
}

export function SubmissionForm({ project }: SubmissionFormProps) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Local form state
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

  // Auto-save helper
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

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    setSubmitError(null);
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

  // --- Tag helpers ---
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

  // --- Input class helpers ---
  const inputClass =
    "w-full rounded-md border border-outline bg-surface-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-muted focus:border-primary-dim focus:outline-none transition";
  const labelClass =
    "block mb-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-muted";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SubmissionStepper currentStep={step} totalSteps={TOTAL_STEPS} />

      {/* ===== STEP 0: Basic Info ===== */}
      {step === 0 && (
        <div className="space-y-6 rounded-xl border border-outline bg-surface-low p-6">
          <h2 className="font-space-grotesk text-lg font-bold text-on-surface">
            Basic Info
          </h2>

          <div>
            <label className={labelClass}>Project Name</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => save({ name })}
              placeholder="Enter your project name"
            />
          </div>

          <div className="flex justify-end">
            <GradientButton onClick={next} disabled={!name.trim()}>
              Next &rarr;
            </GradientButton>
          </div>
        </div>
      )}

      {/* ===== STEP 1: Deep Dive ===== */}
      {step === 1 && (
        <div className="space-y-6 rounded-xl border border-outline bg-surface-low p-6">
          <h2 className="font-space-grotesk text-lg font-bold text-on-surface">
            Deep Dive
          </h2>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-none`}
              maxLength={280}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => save({ description })}
              placeholder="Describe your project (max 280 chars)"
            />
            <p className="mt-1 text-right text-xs text-on-surface-muted">
              {description.length} / 280
            </p>
          </div>

          {/* Idea Origin */}
          <div>
            <label className={labelClass}>Idea Origin</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-none`}
              value={ideaOrigin}
              onChange={(e) => setIdeaOrigin(e.target.value)}
              onBlur={() => save({ idea_origin: ideaOrigin })}
              placeholder="Where did the idea come from?"
            />
          </div>

          {/* Journey */}
          <div>
            <label className={labelClass}>Journey</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-none`}
              value={journey}
              onChange={(e) => setJourney(e.target.value)}
              onBlur={() => save({ journey })}
              placeholder="How did the project evolve?"
            />
          </div>

          {/* Tech Stack Tags */}
          <div>
            <label className={labelClass}>Tech Stack</label>
            <div className="flex gap-2">
              <input
                className={`${inputClass} flex-1`}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a technology and press Enter"
              />
              <GradientButton variant="ghost" onClick={addTag} type="button">
                Add
              </GradientButton>
            </div>
            {techStack.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {techStack.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-outline bg-surface-high px-3 py-1 text-xs text-on-surface"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-on-surface-muted hover:text-secondary transition cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <GradientButton variant="ghost" onClick={prev}>
              &larr; Back
            </GradientButton>
            <GradientButton onClick={next}>Next &rarr;</GradientButton>
          </div>
        </div>
      )}

      {/* ===== STEP 2: Proof of Build ===== */}
      {step === 2 && (
        <div className="space-y-6 rounded-xl border border-outline bg-surface-low p-6">
          <h2 className="font-space-grotesk text-lg font-bold text-on-surface">
            Proof of Build
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: Video + Thumbnail */}
            <div className="space-y-4">
              <FileUploadZone
                bucket="videos"
                projectId={project.id}
                path="demo"
                accept="video/*"
                label="Demo Video"
                hint="Max 60 seconds, drag & drop or click"
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
              <FileUploadZone
                bucket="thumbnails"
                projectId={project.id}
                path="thumb"
                accept="image/*"
                label="Thumbnail"
                hint="Project thumbnail image"
                maxSizeMb={5}
                currentUrl={thumbnailUrl}
                onUploadComplete={(url) => {
                  setThumbnailUrl(url);
                  save({ thumbnail_url: url });
                }}
              />
            </div>

            {/* Right: PDF */}
            <div>
              <FileUploadZone
                bucket="presentations"
                projectId={project.id}
                path="presentation"
                accept="application/pdf"
                label="Presentation PDF"
                hint="Upload your project presentation"
                maxSizeMb={20}
                currentUrl={pdfUrl}
                onUploadComplete={(url) => {
                  setPdfUrl(url);
                  save({ pdf_url: url });
                }}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <GradientButton variant="ghost" onClick={prev}>
              &larr; Back
            </GradientButton>
            <GradientButton onClick={next}>Next &rarr;</GradientButton>
          </div>
        </div>
      )}

      {/* ===== STEP 3: Review & Submit ===== */}
      {step === 3 && (
        <div className="space-y-6 rounded-xl border border-outline bg-surface-low p-6">
          <h2 className="font-space-grotesk text-lg font-bold text-on-surface">
            Review &amp; Submit
          </h2>

          {/* Read-only summary */}
          <div className="space-y-4 rounded-lg border border-outline bg-surface p-5 text-sm">
            <Row label="Name" value={name} />
            <Row label="Description" value={description} />
            <Row label="Idea Origin" value={ideaOrigin} />
            <Row label="Journey" value={journey} />
            <Row
              label="Tech Stack"
              value={techStack.length > 0 ? techStack.join(", ") : "\u2014"}
            />
            <Row
              label="Demo Video"
              value={
                videoUrl
                  ? `Uploaded \u2713${videoDuration ? ` (${videoDuration}s)` : ""}`
                  : "Not uploaded"
              }
            />
            <Row
              label="Thumbnail"
              value={thumbnailUrl ? "Uploaded \u2713" : "Not uploaded"}
            />
            <Row
              label="Presentation"
              value={pdfUrl ? "Uploaded \u2713" : "Not uploaded"}
            />
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4 text-xs text-secondary-dim">
            <strong>Warning:</strong> After submitting you will not be able to
            edit your project. Please make sure all information is correct.
          </div>

          {submitError && (
            <p className="text-sm font-semibold text-secondary">{submitError}</p>
          )}

          <div className="flex justify-between">
            <GradientButton variant="ghost" onClick={prev}>
              &larr; Back
            </GradientButton>
            <GradientButton
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Submitting..." : "Submit Project"}
            </GradientButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small helper for read-only rows */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-28 shrink-0 font-semibold uppercase tracking-wider text-on-surface-muted">
        {label}
      </span>
      <span className="text-on-surface">{value || "\u2014"}</span>
    </div>
  );
}
