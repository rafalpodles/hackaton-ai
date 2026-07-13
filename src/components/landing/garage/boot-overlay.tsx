"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BOOTED_EVENT, BOOTED_KEY, usePrefersReducedMotion } from "./use-motion";

const LINES = [
  "> booting SPYROSOFT_HACKATHON_OS ...",
  "> mounting /garage ................ [OK]",
  "> loading vibe_coding_engine ...... [OK]",
  "> connecting AI providers ......... [OK]",
  "> indexing 22 projects ............ [OK]",
  "> counting votes .................. [OK]",
  "> ready. welcome, rpo.",
];

type Phase = "pending" | "running" | "hidden";

function markBooted() {
  try {
    localStorage.setItem(BOOTED_KEY, "1");
  } catch {}
  window.dispatchEvent(new Event(BOOTED_EVENT));
}

export function BootOverlay() {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("pending");
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setFading(true);
    markBooted();
    fadeRef.current = setTimeout(() => setPhase("hidden"), 620);
  }, []);

  useEffect(() => {
    let alreadyBooted = false;
    try {
      alreadyBooted = localStorage.getItem(BOOTED_KEY) === "1";
    } catch {}

    if (alreadyBooted) {
      setPhase("hidden");
      window.dispatchEvent(new Event(BOOTED_EVENT));
      return;
    }

    if (reduced) {
      // Skip the typewriter entirely for reduced-motion users.
      setPhase("hidden");
      markBooted();
      return;
    }

    setPhase("running");
    let li = 0;
    let ci = 0;
    timerRef.current = setInterval(() => {
      if (li >= LINES.length) {
        finish();
        return;
      }
      const line = LINES[li];
      const done = LINES.slice(0, li).join("\n");
      const cur = line.slice(0, ci + 1);
      setText((done ? done + "\n" : "") + cur + " █");
      setProgress(Math.min(100, Math.round(((li + ci / line.length) / LINES.length) * 100)));
      ci++;
      if (ci > line.length) {
        li++;
        ci = 0;
      }
    }, 26);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, [reduced, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "running") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, finish]);

  if (phase !== "running") return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-[600ms]"
      style={{ background: "#050507", opacity: fading ? 0 : 1 }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 2px, transparent 2px, transparent 4px)",
        }}
      />
      <div style={{ width: "min(680px, 86vw)" }}>
        <div className="mb-5 flex items-center gap-3">
          <div
            className="h-[34px] w-[34px] rounded-[9px]"
            style={{
              background: "linear-gradient(135deg, #6366f1, #ff5a4d)",
              boxShadow: "0 0 24px rgba(99,102,241,.7)",
            }}
          />
          <div className="font-jetbrains-mono text-xs tracking-[0.32em] text-[#6f6f88]">
            SPYROSOFT_HACKATHON_OS
          </div>
        </div>
        <pre
          className="m-0 min-h-[230px] whitespace-pre-wrap font-jetbrains-mono text-[13.5px] leading-[1.75] text-[#7bffea]"
          style={{ textShadow: "0 0 14px rgba(46,230,207,.35)" }}
        >
          {text}
        </pre>
        <div className="mt-[18px] h-[3px] overflow-hidden rounded-[3px] bg-[#16161f]">
          <div
            className="h-full transition-[width] duration-[250ms]"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #6366f1, #a855f7, #ff5a4d)",
            }}
          />
        </div>
        <button
          onClick={finish}
          className="mt-4 block w-full cursor-pointer text-right font-jetbrains-mono text-[11px] tracking-[0.2em] text-[#55556a]"
        >
          [ ESC / KLIKNIJ ABY POMINĄĆ ]
        </button>
      </div>
    </div>
  );
}
