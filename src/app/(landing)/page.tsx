import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import { HackathonTile } from "@/components/landing/hackathon-tile";
import type { HackathonWithStats } from "@/lib/types";

export default async function LandingPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  // Query all hackathons ordered by created_at DESC
  const { data: hackathons } = await supabase
    .from("hackathons")
    .select("*")
    .order("created_at", { ascending: false });

  if (!hackathons || hackathons.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-space-grotesk text-4xl font-bold text-on-surface mb-4">
          Hackathony Spyrosoft
        </h1>
        <p className="text-on-surface-muted">Brak hackathonów.</p>
      </div>
    );
  }

  // Get participant IDs for current user
  let participantHackathonIds = new Set<string>();
  if (user) {
    const { data: participations } = await supabase
      .from("hackathon_participants")
      .select("hackathon_id")
      .eq("user_id", user.id);
    participantHackathonIds = new Set(
      (participations ?? []).map((p) => p.hackathon_id)
    );
  }

  // Get stats per hackathon: project count and participant count
  const hackathonIds = hackathons.map((h) => h.id);

  const { data: projectCounts } = await supabase
    .from("projects")
    .select("hackathon_id")
    .in("hackathon_id", hackathonIds)
    .eq("is_submitted", true);

  const { data: participantCounts } = await supabase
    .from("hackathon_participants")
    .select("hackathon_id")
    .in("hackathon_id", hackathonIds);

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

  const hackathonsWithStats: HackathonWithStats[] = hackathons.map((h) => ({
    ...h,
    project_count: projectCountMap.get(h.id) ?? 0,
    participant_count: participantCountMap.get(h.id) ?? 0,
  }));

  const activeHackathons = hackathonsWithStats.filter(
    (h) => h.status !== "finished"
  );
  const finishedHackathons = hackathonsWithStats.filter(
    (h) => h.status === "finished"
  );

  return (
    <div className="py-8">
      <div className="mb-12 text-center">
        <h1 className="font-space-grotesk text-4xl font-bold text-on-surface mb-3">
          Hackathony Spyrosoft
        </h1>
        <p className="text-on-surface-muted text-lg max-w-2xl mx-auto">
          Dołącz do hackathonu, zbuduj coś niesamowitego i rywalizuj z najlepszymi.
        </p>
      </div>

      {activeHackathons.length > 0 && (
        <section className="mb-12">
          <h2 className="font-space-grotesk text-2xl font-bold text-on-surface mb-6">
            Aktywne i nadchodzące
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {activeHackathons.map((hackathon) => (
              <HackathonTile
                key={hackathon.id}
                hackathon={hackathon}
                isParticipant={participantHackathonIds.has(hackathon.id)}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </section>
      )}

      {finishedHackathons.length > 0 && (
        <section>
          <h2 className="font-space-grotesk text-2xl font-bold text-on-surface mb-6">
            Zakończone
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {finishedHackathons.map((hackathon) => (
              <HackathonTile
                key={hackathon.id}
                hackathon={hackathon}
                isParticipant={participantHackathonIds.has(hackathon.id)}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
