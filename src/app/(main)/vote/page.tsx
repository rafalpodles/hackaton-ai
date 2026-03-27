import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getAppSettings } from "@/lib/utils";
import PhaseGate from "@/components/layout/phase-gate";
import VotingBoard from "@/components/voting/voting-board";

export default async function VotePage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getAppSettings(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  // Fetch submitted projects with team members
  const { data: projects } = await supabase
    .from("projects")
    .select("*, team:profiles!profiles_project_id_fkey(id, display_name, avatar_url)")
    .eq("is_submitted", true)
    .order("name");

  // Check if user already voted
  const { data: existingVotes } = await supabase
    .from("votes")
    .select("id")
    .eq("voter_id", user.id)
    .limit(1);

  const hasVoted = (existingVotes?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Vote for your favorites
        </h1>
        <p className="mt-1 text-on-surface-muted">
          Select one project per category. You cannot vote for your own project.
        </p>
      </div>

      <PhaseGate
        currentPhase={settings.current_phase}
        allowedPhases={["voting", "results"]}
      >
        <VotingBoard
          projects={projects ?? []}
          ownProjectId={user.project_id}
          hasVoted={hasVoted}
        />
      </PhaseGate>
    </div>
  );
}
