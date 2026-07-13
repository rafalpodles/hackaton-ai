"use client";

import { useEffect, useRef, useState } from "react";
import { useBooted, usePrefersReducedMotion } from "./use-motion";

export interface HeroStat {
  n: number;
  label: string;
}

function StatValue({ target, run }: { target: number; run: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  const started = useRef(false);

  useEffect(() => {
    if (!run || reduced || started.current) return;
    started.current = true;
    const start = performance.now();
    const dur = 1400;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [run, reduced, target]);

  return (
    <div
      className="font-chakra-petch font-bold leading-none"
      style={{
        fontSize: "clamp(28px, 4vw, 44px)",
        background: "linear-gradient(120deg, #fff, #c7c8ff)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {value}
    </div>
  );
}

export function StatsRow({ stats }: { stats: HeroStat[] }) {
  const run = useBooted();

  return (
    <div className="mx-auto mt-16 grid max-w-[820px] grid-cols-2 gap-[14px] px-[clamp(20px,5vw,64px)] sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-white/[0.09] bg-[rgba(14,14,21,.55)] px-4 py-[22px] backdrop-blur-[10px]"
        >
          <StatValue target={s.n} run={run} />
          <div className="mt-2 font-jetbrains-mono text-[11px] tracking-[0.14em] text-on-surface-dim">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
