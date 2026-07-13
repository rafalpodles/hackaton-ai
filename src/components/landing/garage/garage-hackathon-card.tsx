"use client";

import Link from "next/link";
import { useTransition } from "react";
import { joinHackathon } from "@/lib/actions/hackathon-join";
import { useTilt } from "./use-motion";

interface GarageHackathonCardProps {
  hackathon: {
    id: string;
    name: string;
    slug: string;
    description: string;
    hackathon_date: string | null;
    status: string;
    project_count: number;
    participant_count: number;
  };
  isParticipant: boolean;
  isLoggedIn: boolean;
  variant: "active" | "archive";
}

const STATUS_META: Record<string, { dot: string; label: string }> = {
  upcoming: { dot: "#8b8cf5", label: "NADCHODZĄCY" },
  active: { dot: "#2ee6cf", label: "W TRAKCIE" },
  voting: { dot: "#ffc14d", label: "GŁOSOWANIE" },
  finished: { dot: "#8b8b9a", label: "ZAKOŃCZONY" },
};

function formatDatePl(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function plForm(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14)) return few;
  return many;
}

function metaLine(h: GarageHackathonCardProps["hackathon"]): string {
  const parts: string[] = [];
  if (h.hackathon_date) parts.push(formatDatePl(h.hackathon_date));
  parts.push(
    `${h.participant_count} ${plForm(h.participant_count, "uczestnik", "uczestników", "uczestników")}`
  );
  parts.push(
    `${h.project_count} ${plForm(h.project_count, "projekt", "projekty", "projektów")}`
  );
  return parts.join(" · ");
}

export function GarageHackathonCard({
  hackathon,
  isParticipant,
  isLoggedIn,
  variant,
}: GarageHackathonCardProps) {
  const tilt = useTilt();
  const [isPending, startTransition] = useTransition();
  const isFinished = hackathon.status === "finished";
  const status = STATUS_META[hackathon.status] ?? STATUS_META.upcoming;
  const href = `/h/${hackathon.slug}`;

  const cta = (() => {
    if (!isLoggedIn) {
      return { kind: "link" as const, href, label: isFinished ? "ZOBACZ WYNIKI" : "ZOBACZ PROJEKTY" };
    }
    if (isParticipant || isFinished) {
      return { kind: "link" as const, href, label: isFinished ? "ZOBACZ WYNIKI" : "WEJDŹ →" };
    }
    return { kind: "join" as const, label: isPending ? "DOŁĄCZANIE..." : "DOŁĄCZ" };
  })();

  const ctaGradient =
    "rounded-[12px] px-[26px] py-[15px] font-chakra-petch text-[15px] font-bold tracking-[0.08em] text-white";
  const ctaOutline =
    "rounded-[12px] border border-white/[0.16] bg-white/[0.04] px-6 py-[13px] font-chakra-petch text-[14px] font-bold tracking-[0.08em] text-[#e7e7f0] transition-colors hover:border-white/40";

  const ctaClass = variant === "active" ? ctaGradient : ctaOutline;
  const ctaStyle =
    variant === "active"
      ? { background: "linear-gradient(120deg, #6366f1, #ff5a4d)" }
      : undefined;

  const ctaNode =
    cta.kind === "join" ? (
      <button
        onClick={() => startTransition(() => joinHackathon(hackathon.id))}
        disabled={isPending}
        className={`${ctaClass} cursor-pointer disabled:opacity-60`}
        style={ctaStyle}
      >
        {cta.label}
      </button>
    ) : (
      <Link href={cta.href} className={ctaClass} style={ctaStyle}>
        {cta.label}
      </Link>
    );

  if (variant === "active") {
    return (
      <div
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        style={{
          ...tilt.style,
          background:
            "linear-gradient(135deg, rgba(99,102,241,.16), rgba(255,90,77,.07))",
        }}
        className="relative overflow-hidden rounded-[22px] border border-white/10 p-[clamp(28px,4vw,48px)] transition-[border-color] hover:border-[rgba(139,140,245,.5)]"
      >
        <div
          className="absolute -right-[60px] -top-[60px] h-[280px] w-[280px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,90,77,.3), transparent 65%)",
            filter: "blur(20px)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-7">
          <div>
            <div
              className="mb-4 inline-flex items-center gap-2 font-jetbrains-mono text-xs tracking-[0.2em]"
              style={{ color: status.dot }}
            >
              <span
                className="gos-pulse-dot h-[7px] w-[7px] rounded-full"
                style={{ background: status.dot }}
              />
              {status.label}
            </div>
            <h3
              className="font-chakra-petch font-bold leading-none text-on-surface"
              style={{ fontSize: "clamp(30px, 4vw, 52px)" }}
            >
              {hackathon.name}
            </h3>
            <div className="mt-[14px] font-jetbrains-mono text-[13px] tracking-[0.1em] text-on-surface-muted">
              {metaLine(hackathon)}
            </div>
          </div>
          {ctaNode}
        </div>
      </div>
    );
  }

  return (
    <div
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      style={{ ...tilt.style, background: "rgba(14,14,21,.6)" }}
      className="relative overflow-hidden rounded-[22px] border border-white/[0.09] p-[clamp(26px,3.5vw,42px)] transition-[border-color] hover:border-white/[0.22]"
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-[14px] font-jetbrains-mono text-xs tracking-[0.2em] text-[#6f6f88]">
            ■ {status.label}
          </div>
          <h3
            className="font-chakra-petch font-bold leading-none text-on-surface"
            style={{ fontSize: "clamp(26px, 3.5vw, 44px)" }}
          >
            {hackathon.name}
          </h3>
          <div className="mt-[14px] font-jetbrains-mono text-[13px] tracking-[0.1em] text-on-surface-muted">
            {metaLine(hackathon)}
          </div>
        </div>
        {ctaNode}
      </div>
    </div>
  );
}
