"use client";

import { useState } from "react";
import { Markdown } from "@/components/ui/markdown";
import type { HackathonGuideStep } from "@/lib/types";

interface CustomGuideStepProps {
  step: HackathonGuideStep;
  displayNumber: number;
}

export function CustomGuideStep({ step, displayNumber }: CustomGuideStepProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl overflow-hidden border transition-all duration-200 ${
        expanded
          ? "bg-surface-low/80 border-primary/20"
          : "bg-surface-low/60 border-outline"
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors duration-150 hover:bg-surface-high/30"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        {/* Step number */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-space-grotesk text-xs font-bold ${
            expanded
              ? "bg-primary/20 text-primary-dim"
              : "bg-surface-high text-on-surface-muted"
          }`}
        >
          {displayNumber}
        </div>

        {/* Title + badge */}
        <span className="flex-1 min-w-0 font-space-grotesk text-sm font-semibold text-on-surface">
          {step.title}
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary mr-2">
          hackathon
        </span>

        {/* Chevron */}
        <svg
          className={`flex-shrink-0 w-4 h-4 text-on-surface-muted transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-5 pb-5 pt-1">
          <Markdown>{step.content_md}</Markdown>
        </div>
      )}
    </div>
  );
}
