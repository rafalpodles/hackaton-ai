import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import VotingBoard from "@/components/voting/voting-board";

export default async function VotePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Check if voting is open
  const { data: settings } = await supabase
    .from("app_settings")
    .select("voting_open")
    .eq("id", 1)
    .single();

  if (!settings?.voting_open) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Voting is not open yet
        </h1>
        <p className="mt-2 text-on-surface-muted">
          The admin will open voting when all projects are submitted.
        </p>
      </div>
    );
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*, team:profiles!profiles_project_id_fkey(id, display_name, avatar_url)")
    .eq("is_submitted", true)
    .order("name");

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

      <VotingBoard
        projects={projects ?? []}
        ownProjectId={user.project_id}
        hasVoted={hasVoted}
      />
    </div>
  );
}
