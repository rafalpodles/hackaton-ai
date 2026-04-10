"use client";

import { useState, useEffect } from "react";

interface CountdownBannerProps {
  hackathonDate: string;
  submissionDeadline?: string;
  votingOpen?: boolean;
}

function formatTimeLeft(diff: number) {
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

type BannerState = "countdown" | "live" | "voting" | "ended";

export function CountdownBanner({ hackathonDate, submissionDeadline, votingOpen }: CountdownBannerProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>("");
  const [state, setState] = useState<BannerState>("countdown");

  useEffect(() => {
    function update() {
      const now = Date.now();
      const hackathonDiff = new Date(hackathonDate).getTime() - now;

      if (hackathonDiff > 0) {
        setTimeLeft(formatTimeLeft(hackathonDiff));
        setState("countdown");
        return;
      }

      // Hackathon started — check submission deadline and voting
      if (submissionDeadline) {
        const deadlineDiff = new Date(submissionDeadline).getTime() - now;
        if (deadlineDiff <= 0) {
          setState(votingOpen ? "voting" : "ended");
          setTimeLeft(null);
          return;
        }
      }

      setState("live");
      setTimeLeft(null);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [hackathonDate, submissionDeadline, votingOpen]);

  if (timeLeft === "") return null; // initial render

  return (
    <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-outline px-4 py-2">
      {state === "voting" ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
          </span>
          <span className="font-space-grotesk text-xs font-bold uppercase tracking-[0.15em] text-amber-400">
            Hackathon zakończony — czas na głosowanie!
          </span>
        </>
      ) : state === "ended" ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gray-400" />
          </span>
          <span className="font-space-grotesk text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
            Hackathon zakończony
          </span>
        </>
      ) : state === "live" ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
          </span>
          <span className="font-space-grotesk text-xs font-bold uppercase tracking-[0.15em] text-green-400">
            Hackathon trwa!
          </span>
        </>
      ) : (
        <>
          <span className="font-space-grotesk text-[10px] uppercase tracking-[0.2em] text-on-surface-muted">
            Hackathon za
          </span>
          <span className="font-mono text-sm font-bold text-primary-dim">
            {timeLeft}
          </span>
        </>
      )}
    </div>
  );
}
