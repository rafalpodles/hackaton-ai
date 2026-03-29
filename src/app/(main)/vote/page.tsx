import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getSubmittedProjects } from "@/lib/utils";
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
          Głosowanie jeszcze nie jest otwarte
        </h1>
        <p className="mt-2 text-on-surface-muted">
          Administrator otworzy głosowanie, gdy wszystkie projekty zostaną zgłoszone.
        </p>
      </div>
    );
  }

  const projects = await getSubmittedProjects();

  const { data: userVotes } = await supabase
    .from("votes")
    .select("category, project_id")
    .eq("voter_id", user.id);

  const hasVoted = (userVotes?.length ?? 0) > 0;

  // Build map of category -> project_id for display
  const votedFor: Record<string, string> = {};
  for (const v of userVotes ?? []) {
    votedFor[v.category] = v.project_id;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Głosuj na swoich faworytów
        </h1>
        <p className="mt-1 text-on-surface-muted">
          Wybierz jeden projekt w każdej kategorii. Nie możesz głosować na własny projekt.
        </p>
      </div>

      <VotingBoard
        projects={projects}
        ownProjectId={user.project_id}
        hasVoted={hasVoted}
        votedFor={votedFor}
      />
    </div>
  );
}
