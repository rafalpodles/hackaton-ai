"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { joinHackathon } from "@/lib/actions/hackathon-join";
import { useTransition } from "react";

interface HackathonTileProps {
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
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  upcoming: { label: "Nadchodzący", className: "text-primary" },
  active: { label: "W trakcie", className: "text-green-400" },
  voting: { label: "Głosowanie", className: "text-amber-400" },
  finished: { label: "Zakończony", className: "text-on-surface-muted" },
};

function formatDatePl(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function HackathonTile({
  hackathon,
  isParticipant,
  isLoggedIn,
}: HackathonTileProps) {
  const [isPending, startTransition] = useTransition();
  const isFinished = hackathon.status === "finished";
  const statusMeta = STATUS_LABELS[hackathon.status] ?? STATUS_LABELS.upcoming;

  function handleJoin() {
    startTransition(async () => {
      await joinHackathon(hackathon.id);
    });
  }

  const renderAction = () => {
    if (!isLoggedIn) {
      if (isFinished) {
        return (
          <Link
            href={`/h/${hackathon.slug}`}
            className="inline-block font-space-grotesk font-bold text-sm tracking-wide uppercase rounded-md px-6 py-3 border border-outline text-on-surface-muted hover:border-primary-dim hover:text-primary transition-all duration-200"
          >
            Przeglądaj projekty
          </Link>
        );
      }
      return (
        <Link href="/register">
          <GradientButton variant="primary">Zarejestruj się</GradientButton>
        </Link>
      );
    }

    if (isParticipant) {
      return (
        <Link href={`/h/${hackathon.slug}`}>
          <GradientButton variant="primary">
            {isFinished ? "Zobacz wyniki" : "Wejdź"}
          </GradientButton>
        </Link>
      );
    }

    if (isFinished) {
      return (
        <Link
          href={`/h/${hackathon.slug}`}
          className="inline-block font-space-grotesk font-bold text-sm tracking-wide uppercase rounded-md px-6 py-3 border border-outline text-on-surface-muted hover:border-primary-dim hover:text-primary transition-all duration-200"
        >
          Przeglądaj projekty
        </Link>
      );
    }

    return (
      <GradientButton
        variant="primary"
        onClick={handleJoin}
        disabled={isPending}
      >
        {isPending ? "Dołączanie..." : "Dołącz"}
      </GradientButton>
    );
  };

  return (
    <GlassCard className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-space-grotesk font-bold uppercase tracking-wider ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          </div>
          <h2 className="font-space-grotesk text-xl font-bold text-on-surface leading-tight">
            {hackathon.name}
          </h2>
          {hackathon.hackathon_date && (
            <p className="mt-1 text-sm text-on-surface-muted">
              {formatDatePl(hackathon.hackathon_date)}
            </p>
          )}
        </div>
      </div>

      <p className="text-on-surface-muted text-sm leading-relaxed line-clamp-3">
        {hackathon.description}
      </p>

      <div className="flex items-center gap-6 text-sm text-on-surface-muted">
        <span>
          <span className="text-on-surface font-semibold">
            {hackathon.participant_count}
          </span>{" "}
          uczestników
        </span>
        <span>
          <span className="text-on-surface font-semibold">
            {hackathon.project_count}
          </span>{" "}
          projektów
        </span>
      </div>

      <div className="pt-2">{renderAction()}</div>
    </GlassCard>
  );
}
