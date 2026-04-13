import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getHackathonBySlug, getParticipant, getSubmittedProjects } from "@/lib/utils";
import VotingBoard from "@/components/voting/voting-board";
import type { HackathonCategory } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonVotePage({ params }: Props) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  if (!hackathon.voting_open) {
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

  const supabase = await createClient();

  const projects = await getSubmittedProjects(hackathon.id);

  // Load categories from hackathon_categories table
  const { data: categoriesData } = await supabase
    .from("hackathon_categories")
    .select("*")
    .eq("hackathon_id", hackathon.id)
    .order("display_order", { ascending: true });

  const categories = (categoriesData ?? []) as HackathonCategory[];

  const participant = await getParticipant(hackathon.id, user.id);
  let ownProjectId: string | null = participant?.project_id ?? null;

  if (!ownProjectId && participant?.team_id) {
    const { data: team } = await supabase
      .from("teams")
      .select("project_id")
      .eq("id", participant.team_id)
      .single();
    ownProjectId = team?.project_id ?? null;
  }

  const { data: userVotes } = await supabase
    .from("votes")
    .select("category, project_id")
    .eq("voter_id", user.id)
    .eq("hackathon_id", hackathon.id);

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

      {/* TODO: pass categories to VotingBoard after voting-board component is updated to accept dynamic categories */}
      <VotingBoard
        projects={projects}
        ownProjectId={ownProjectId}
        hasVoted={hasVoted}
        votedFor={votedFor}
        hackathonId={hackathon.id}
      />
    </div>
  );
}
