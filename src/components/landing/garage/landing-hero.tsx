"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BOOTED_KEY, useMagnetic, usePrefersReducedMotion } from "./use-motion";

function MagneticPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  const magnetic = useMagnetic();
  return (
    <Link
      href={href}
      onPointerMove={magnetic.onPointerMove}
      onPointerLeave={magnetic.onPointerLeave}
      style={magnetic.style}
      className="relative overflow-hidden rounded-[14px] px-[34px] py-[17px] font-chakra-petch text-[15px] font-bold tracking-[0.08em] text-white"
    >
      <span
        className="pointer-events-none absolute left-0 top-0 h-full w-[40%]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)",
          animation: "sheen 4s ease-in-out infinite",
        }}
      />
      <span
        className="pointer-events-none absolute inset-0 -z-10 rounded-[14px]"
        style={{
          background: "linear-gradient(120deg, #6366f1, #a855f7, #ff5a4d)",
          boxShadow: "0 16px 40px -12px rgba(129,90,241,.7)",
        }}
      />
      {children}
    </Link>
  );
}

function ReplayBootButton() {
  const magnetic = useMagnetic();
  const replay = () => {
    try {
      localStorage.removeItem(BOOTED_KEY);
    } catch {}
    window.location.reload();
  };
  return (
    <button
      onClick={replay}
      onPointerMove={magnetic.onPointerMove}
      onPointerLeave={magnetic.onPointerLeave}
      style={magnetic.style}
      className="cursor-pointer rounded-[14px] border border-white/[0.14] bg-white/[0.04] px-[30px] py-[17px] font-jetbrains-mono text-[13px] font-medium tracking-[0.12em] text-[#e7e7f0] transition-colors hover:bg-white/[0.09]"
    >
      ↻ REBOOT_INTRO
    </button>
  );
}

export function LandingHero({ primaryHref }: { primaryHref: string }) {
  const reduced = usePrefersReducedMotion();
  const glitchRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced) return;
    const el = glitchRef.current;
    if (!el) return;
    const id = setInterval(() => {
      el.style.animation = "glitchClip .35s steps(2) 1";
      setTimeout(() => {
        el.style.animation = "";
      }, 360);
    }, 4200);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section className="mx-auto max-w-[1400px] px-[clamp(20px,5vw,64px)] pt-[clamp(24px,6vh,80px)] text-center">
      <div className="mb-[34px] inline-flex items-center gap-[10px] rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-[7px] font-jetbrains-mono text-[11.5px] tracking-[0.22em] text-[#b9b9c8] backdrop-blur-[8px]">
        v2.0 · BUILD REAL THINGS WITH AI
      </div>
      <h1
        className="m-0 font-chakra-petch font-bold leading-[0.86] tracking-[-0.02em]"
        style={{ fontSize: "clamp(46px, 13vw, 190px)" }}
      >
        <span
          ref={glitchRef}
          className="relative inline-block"
          style={{
            background: "linear-gradient(115deg, #6366f1, #a855f7, #ff5a4d)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          SPYROSOFT
        </span>
        <span
          className="block"
          style={{
            background: "linear-gradient(115deg, #ffffff 20%, #c7c8ff 45%, #ff9d90 80%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          HACKATHONS
        </span>
      </h1>
      <p
        className="mx-auto mt-[30px] max-w-[560px] leading-[1.6] text-on-surface-muted"
        style={{ fontSize: "clamp(16px, 1.5vw, 20px)" }}
      >
        Dołącz do hackathonu, zbuduj coś niesamowitego i rywalizuj z najlepszymi.{" "}
        <span className="text-[#6f6f88]">/ Build something real. Ship it in one day.</span>
      </p>
      <div className="mt-[44px] flex flex-wrap justify-center gap-4">
        <MagneticPrimary href={primaryHref}>&gt; WEJDŹ DO HACKATHONU</MagneticPrimary>
        <ReplayBootButton />
      </div>
    </section>
  );
}
