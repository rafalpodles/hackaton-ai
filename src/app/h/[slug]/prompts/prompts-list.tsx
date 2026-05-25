"use client";

import { useState } from "react";
import type { UsefulPrompt } from "@/lib/types";

export default function PromptsList({ prompts }: { prompts: UsefulPrompt[] }) {
  return (
    <div className="flex flex-col gap-4">
      {prompts.map((p) => (
        <PromptCard key={p.id} prompt={p} />
      ))}
    </div>
  );
}

function PromptCard({ prompt }: { prompt: UsefulPrompt }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-outline bg-surface-high/30 overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-space-grotesk text-sm font-bold text-primary-dim">
            {prompt.number}
          </span>
          <div>
            <h3 className="font-space-grotesk text-base font-bold text-on-surface">
              {prompt.title}
            </h3>
            <p className="text-xs text-on-surface-muted">{prompt.description}</p>
          </div>
        </div>
      </div>

      <div className="relative border-t border-outline/50 bg-surface/50">
        <pre className="overflow-x-auto px-5 py-4 text-sm text-on-surface-muted whitespace-pre-wrap leading-relaxed">
          {prompt.prompt}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-3 top-3 rounded-md bg-surface-high px-3 py-1.5 text-xs font-medium text-on-surface-muted transition-colors hover:bg-primary/20 hover:text-primary-dim"
        >
          {copied ? "Skopiowano!" : "Kopiuj"}
        </button>
      </div>
    </div>
  );
}
