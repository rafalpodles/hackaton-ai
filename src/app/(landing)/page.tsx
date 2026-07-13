import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import { LandingTopBar } from "@/components/landing/garage/landing-top-bar";
import { LandingHero } from "@/components/landing/garage/landing-hero";
import { StatsRow } from "@/components/landing/garage/stats-row";
import { Ticker } from "@/components/landing/garage/ticker";
import { GarageHackathonCard } from "@/components/landing/garage/garage-hackathon-card";
import type { HackathonWithStats } from "@/lib/types";

export default async function LandingPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: hackathons } = await supabase
    .from("hackathons")
    .select("*")
    .order("created_at", { ascending: false });

  let participantHackathonIds = new Set<string>();
  if (user && hackathons?.length) {
    const { data: participations } = await supabase
      .from("hackathon_participants")
      .select("hackathon_id")
      .eq("user_id", user.id);
    participantHackathonIds = new Set(
      (participations ?? []).map((p) => p.hackathon_id)
    );
  }

  const hackathonIds = (hackathons ?? []).map((h) => h.id);

  const { data: projectCounts } = hackathonIds.length
    ? await supabase
        .from("projects")
        .select("hackathon_id")
        .in("hackathon_id", hackathonIds)
        .eq("is_submitted", true)
    : { data: [] };

  const { data: participantCounts } = hackathonIds.length
    ? await supabase
        .from("hackathon_participants")
        .select("hackathon_id")
        .in("hackathon_id", hackathonIds)
    : { data: [] };

  const projectCountMap = new Map<string, number>();
  for (const row of projectCounts ?? []) {
    projectCountMap.set(row.hackathon_id, (projectCountMap.get(row.hackathon_id) ?? 0) + 1);
  }
  const participantCountMap = new Map<string, number>();
  for (const row of participantCounts ?? []) {
    participantCountMap.set(
      row.hackathon_id,
      (participantCountMap.get(row.hackathon_id) ?? 0) + 1
    );
  }

  const hackathonsWithStats: HackathonWithStats[] = (hackathons ?? []).map((h) => ({
    ...h,
    project_count: projectCountMap.get(h.id) ?? 0,
    participant_count: participantCountMap.get(h.id) ?? 0,
  }));

  const activeHackathons = hackathonsWithStats.filter((h) => h.status !== "finished");
  const finishedHackathons = hackathonsWithStats.filter((h) => h.status === "finished");

  const totalParticipants = hackathonsWithStats.reduce((s, h) => s + h.participant_count, 0);
  const totalProjects = hackathonsWithStats.reduce((s, h) => s + h.project_count, 0);

  const heroStats = [
    { n: totalParticipants, label: "UCZESTNIKÓW" },
    { n: totalProjects, label: "PROJEKTÓW" },
    { n: 3, label: "KATEGORIE" },
    { n: 90, label: "SEKUND / IDEA" },
  ];

  const primaryHref =
    activeHackathons[0]?.slug
      ? `/h/${activeHackathons[0].slug}`
      : finishedHackathons[0]?.slug
        ? `/h/${finishedHackathons[0].slug}`
        : "/";

  const tickerText =
    hackathonsWithStats
      .map((h) => `◇ ${h.name} · ${h.project_count} projektów`)
      .join("   ") || "◇ Build something real. Ship it in one day.";

  return (
    <>
      <LandingTopBar
        email={user?.email}
        displayName={user?.display_name}
        isLoggedIn={!!user}
      />

      <LandingHero primaryHref={primaryHref} />
      <StatsRow stats={heroStats} />
      <Ticker text={tickerText} />

      <section className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,64px)] py-20">
        {activeHackathons.length > 0 && (
          <>
            <div className="mb-7 flex items-baseline gap-4">
              <h2
                className="font-chakra-petch font-bold text-on-surface"
                style={{ fontSize: "clamp(26px, 3vw, 40px)" }}
              >
                Aktywne i nadchodzące
              </h2>
              <span className="font-jetbrains-mono text-xs tracking-[0.14em] text-[#6f6f88]">
                {"// ACTIVE"}
              </span>
            </div>
            <div className="mb-[52px] flex flex-col gap-6">
              {activeHackathons.map((h) => (
                <GarageHackathonCard
                  key={h.id}
                  hackathon={h}
                  isParticipant={participantHackathonIds.has(h.id)}
                  isLoggedIn={!!user}
                  variant="active"
                />
              ))}
            </div>
          </>
        )}

        {finishedHackathons.length > 0 && (
          <>
            <div className="mb-7 flex items-baseline gap-4">
              <h2
                className="font-chakra-petch font-bold text-[#c9c9d6]"
                style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
              >
                Zakończone
              </h2>
              <span className="font-jetbrains-mono text-xs tracking-[0.14em] text-[#6f6f88]">
                {"// ARCHIVE"}
              </span>
            </div>
            <div className="flex flex-col gap-6">
              {finishedHackathons.map((h) => (
                <GarageHackathonCard
                  key={h.id}
                  hackathon={h}
                  isParticipant={participantHackathonIds.has(h.id)}
                  isLoggedIn={!!user}
                  variant="archive"
                />
              ))}
            </div>
          </>
        )}

        {hackathonsWithStats.length === 0 && (
          <p className="text-center font-jetbrains-mono text-on-surface-muted">
            Brak hackathonów.
          </p>
        )}

        {user?.role === "admin" && (
          <div className="mt-14 flex flex-wrap justify-center gap-3">
            <Link
              href="/admin/hackathons/new"
              className="rounded-[12px] px-5 py-[10px] font-chakra-petch text-sm font-bold text-white"
              style={{ background: "linear-gradient(120deg, #6366f1, #ff5a4d)" }}
            >
              + Nowy hackathon
            </Link>
            <Link
              href="/admin"
              className="rounded-[12px] border border-outline px-5 py-[10px] font-chakra-petch text-sm font-bold text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
            >
              Panel admina
            </Link>
          </div>
        )}
      </section>

      <footer className="border-t border-white/[0.06] p-10 text-center font-jetbrains-mono text-[11px] tracking-[0.2em] text-[#4a4a5c]">
        SPYROSOFT_HACKATHON_OS · 2026 · &lt;90s/&gt;
      </footer>
    </>
  );
}
