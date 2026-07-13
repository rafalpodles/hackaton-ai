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
    <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(14,14,21,.6)]">
      <div className="flex items-center gap-4 border-b border-white/[0.07] px-6 py-[22px]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[rgba(139,140,245,.14)] font-jetbrains-mono text-base font-bold text-primary-dim">
          {prompt.number}
        </span>
        <div>
          <h3 className="font-chakra-petch text-xl font-bold text-on-surface">
            {prompt.title}
          </h3>
          <p className="text-sm text-on-surface-dim">{prompt.description}</p>
        </div>
      </div>

      <div className="relative">
        <pre className="overflow-x-auto whitespace-pre-wrap px-6 py-[22px] font-jetbrains-mono text-[13.5px] leading-[1.7] text-[#a8ffe9]">
          {prompt.prompt}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-4 top-4 rounded-lg bg-white/[0.06] px-3 py-[6px] text-xs text-[#c9c9d6] transition-colors hover:bg-[rgba(139,140,245,.2)] hover:text-primary-dim"
        >
          {copied ? "Skopiowano!" : "Kopiuj"}
        </button>
      </div>
    </div>
  );
}
