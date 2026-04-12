import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug, getParticipant } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { TeamMemberList } from "@/components/teams/team-member-list";
import { TeamRequestsList } from "@/components/teams/team-requests-list";
import { NoTeamView } from "@/components/teams/no-team-view";
import { PendingRequestView } from "@/components/teams/pending-request-view";
import { leaveTeam, deleteTeam } from "@/lib/actions/teams";
import type { TeamWithMembers, TeamRequestWithUser, TeamRequestWithTeam } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonTeamPage({ params }: Props) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const supabase = await createClient();

  // Get participant to look up team_id from hackathon_participants
  const participant = await getParticipant(hackathon.id, user.id);
  const teamId = participant?.team_id ?? null;
  const isSolo = participant?.is_solo ?? false;

  // User has no team and is not solo → show join/create options
  if (!teamId && !isSolo) {
    const { data: pendingRequest } = await supabase
      .from("team_requests")
      .select("id, user_id, team_id, created_at, team:teams!team_id(id, name)")
      .eq("user_id", user.id)
      .single();

    if (pendingRequest) {
      const reqWithTeam = {
        ...pendingRequest,
        team: pendingRequest.team as unknown as { id: string; name: string },
      } as TeamRequestWithTeam;
      return <PendingRequestView request={reqWithTeam} />;
    }

    const { data: teams } = await supabase
      .from("teams")
      .select("*, members:hackathon_participants!team_id(user_id, user:profiles!user_id(id, display_name, avatar_url, email))")
      .eq("hackathon_id", hackathon.id)
      .order("created_at", { ascending: false });

    const teamList: TeamWithMembers[] = (teams ?? []).map((t) => ({
      ...t,
      members: (t.members ?? []).map((m: { user: { id: string; display_name: string; avatar_url: string | null; email: string } }) => m.user),
    }));

    return <NoTeamView teams={teamList} hackathonId={hackathon.id} />;
  }

  // Solo user without team
  if (isSolo && !teamId) {
    const { data: pendingRequest } = await supabase
      .from("team_requests")
      .select("id, user_id, team_id, created_at, team:teams!team_id(id, name)")
      .eq("user_id", user.id)
      .single();

    if (pendingRequest) {
      const reqWithTeam = {
        ...pendingRequest,
        team: pendingRequest.team as unknown as { id: string; name: string },
      } as TeamRequestWithTeam;
      return <PendingRequestView request={reqWithTeam} isSolo />;
    }

    const { data: teams } = await supabase
      .from("teams")
      .select("*, members:hackathon_participants!team_id(user_id, user:profiles!user_id(id, display_name, avatar_url, email))")
      .eq("hackathon_id", hackathon.id)
      .order("created_at", { ascending: false });

    const teamList: TeamWithMembers[] = (teams ?? []).map((t) => ({
      ...t,
      members: (t.members ?? []).map((m: { user: { id: string; display_name: string; avatar_url: string | null; email: string } }) => m.user),
    }));

    // Check if solo user has unsubmitted project
    let hasUnsubmittedProject = false;
    if (participant?.project_id) {
      const { data: proj } = await supabase
        .from("projects")
        .select("is_submitted")
        .eq("id", participant.project_id)
        .single();
      hasUnsubmittedProject = !!proj && !proj.is_submitted;
    }

    return <NoTeamView teams={teamList} hackathonId={hackathon.id} isSolo hasUnsubmittedProject={hasUnsubmittedProject} />;
  }

  // User is in a team
  if (!teamId) redirect(`/h/${slug}/onboarding`);

  const { data: team } = await supabase
    .from("teams")
    .select("*, members:hackathon_participants!team_id(user_id, user:profiles!user_id(id, display_name, avatar_url, email))")
    .eq("id", teamId)
    .single();

  if (!team) redirect(`/h/${slug}/onboarding`);

  const teamData: TeamWithMembers = {
    ...team,
    members: (team.members ?? []).map((m: { user: { id: string; display_name: string; avatar_url: string | null; email: string } }) => m.user),
  };

  const isLeader = teamData.leader_id === user.id;

  // Fetch pending requests if leader
  let pendingRequests: TeamRequestWithUser[] = [];
  if (isLeader) {
    const { data: requests } = await supabase
      .from("team_requests")
      .select("id, user_id, team_id, created_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });

    if (requests && requests.length > 0) {
      const userIds = requests.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      pendingRequests = requests
        .filter((r) => profileMap.has(r.user_id))
        .map((r) => ({
          ...r,
          user: profileMap.get(r.user_id)!,
        })) as TeamRequestWithUser[];
    }
  }

  const hackathonId = hackathon.id;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          {teamData.name}
        </h1>
        {isLeader && (
          <p className="mt-1 text-sm text-primary-dim">Jesteś liderem</p>
        )}
      </div>

      {/* Members */}
      <GlassCard>
        <h2 className="font-space-grotesk text-lg font-semibold text-on-surface mb-4">
          Członkowie ({teamData.members.length}/5)
        </h2>
        <TeamMemberList
          members={teamData.members}
          leaderId={teamData.leader_id}
          isLeader={isLeader}
          currentUserId={user.id}
          hackathonId={hackathon.id}
        />
      </GlassCard>

      {/* Pending requests (leader only) */}
      {isLeader && pendingRequests.length > 0 && (
        <GlassCard>
          <h2 className="font-space-grotesk text-lg font-semibold text-on-surface mb-4">
            Prośby o dołączenie
          </h2>
          <TeamRequestsList requests={pendingRequests} />
        </GlassCard>
      )}

      {/* Actions */}
      <TeamActions isLeader={isLeader} hackathonId={hackathonId} />
    </div>
  );
}

function TeamActions({
  isLeader,
  hackathonId,
}: {
  isLeader: boolean;
  hackathonId: string;
}) {
  async function handleLeave() {
    "use server";
    // TODO: pass hackathonId after Task 13-16
    await leaveTeam(hackathonId);
  }

  async function handleDelete() {
    "use server";
    // TODO: pass hackathonId after Task 13-16
    await deleteTeam(hackathonId);
  }

  if (isLeader) {
    return (
      <GlassCard>
        <h2 className="font-space-grotesk text-lg font-semibold text-on-surface mb-4">
          Zarządzanie
        </h2>
        <form action={handleDelete}>
          <GradientButton type="submit" variant="ghost">
            Usuń zespół
          </GradientButton>
        </form>
        <p className="mt-2 text-xs text-on-surface-muted">
          Usunięcie zespołu wyrzuci wszystkich członków.
        </p>
      </GlassCard>
    );
  }

  return (
    <form action={handleLeave}>
      <GradientButton type="submit" variant="ghost">
        Opuść zespół
      </GradientButton>
    </form>
  );
}
