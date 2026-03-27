"use client";

import type { VoteCategory } from "@/lib/types";
import { GradientButton } from "@/components/ui/gradient-button";

interface VoteSubmitBarProps {
  selections: Record<VoteCategory, string | null>;
  onSubmit: () => void;
  submitting: boolean;
}

export default function VoteSubmitBar({
  selections,
  onSubmit,
  submitting,
}: VoteSubmitBarProps) {
  const count = Object.values(selections).filter(Boolean).length;
  const allSelected = count === 3;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline bg-surface-low/80 backdrop-blur-md lg:left-60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Counter */}
        <div className="flex items-center gap-3">
          <span className="font-space-grotesk text-sm text-on-surface-muted">
            Selections Made
          </span>
          <span className="font-space-grotesk text-xl font-bold tabular-nums text-on-surface">
            {String(count).padStart(2, "0")} / 03
          </span>
        </div>

        {/* Ready indicator + Submit */}
        <div className="flex items-center gap-4">
          {allSelected && (
            <span className="flex items-center gap-2 text-sm text-primary">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              Ready to transmit
            </span>
          )}

          <GradientButton
            disabled={!allSelected || submitting}
            onClick={onSubmit}
          >
            {submitting ? "Transmitting..." : "Submit Votes"}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
