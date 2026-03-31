import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";
import { TeamMemberList } from "@/components/teams/team-member-list";
import { TeamRequestsList } from "@/components/teams/team-requests-list";
import { NoTeamView } from "@/components/teams/no-team-view";
import { PendingRequestView } from "@/components/teams/pending-request-view";
import type { TeamWithMembers, TeamRequestWithUser, TeamRequestWithTeam } from "@/lib/types";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // User has no team and is not solo → show join/create options
  if (!user.team_id && !user.is_solo) {
    // Check pending request
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

    // Fetch teams for joining
    const { data: teams } = await supabase
      .from("teams")
      .select("*, members:profiles!team_id(id, display_name, avatar_url, email)")
      .order("created_at", { ascending: false });

    return <NoTeamView teams={(teams ?? []) as TeamWithMembers[]} />;
  }

  // Solo user without team
  if (user.is_solo && !user.team_id) {
    // Check pending request
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
      .select("*, members:profiles!team_id(id, display_name, avatar_url, email)")
      .order("created_at", { ascending: false });

    // Check if solo user has unsubmitted project
    let hasUnsubmittedProject = false;
    if (user.project_id) {
      const { data: proj } = await supabase
        .from("projects")
        .select("is_submitted")
        .eq("id", user.project_id)
        .single();
      hasUnsubmittedProject = !!proj && !proj.is_submitted;
    }

    return <NoTeamView teams={(teams ?? []) as TeamWithMembers[]} isSolo hasUnsubmittedProject={hasUnsubmittedProject} />;
  }

  // User is in a team
  if (!user.team_id) redirect("/onboarding");

  const { data: team } = await supabase
    .from("teams")
    .select("*, members:profiles!team_id(id, display_name, avatar_url, email)")
    .eq("id", user.team_id)
    .single();

  if (!team) redirect("/onboarding");

  const teamData = team as unknown as TeamWithMembers;
  const isLeader = teamData.leader_id === user.id;

  // Fetch pending requests if leader
  let pendingRequests: TeamRequestWithUser[] = [];
  if (isLeader) {
    const { data: requests } = await supabase
      .from("team_requests")
      .select("id, user_id, team_id, created_at, user:profiles!user_id(id, display_name, email)")
      .eq("team_id", user.team_id)
      .order("created_at", { ascending: true });

    pendingRequests = (requests ?? []).map((r) => ({
      ...r,
      user: r.user as unknown as { id: string; display_name: string; email: string },
    })) as TeamRequestWithUser[];
  }

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
      <TeamActions isLeader={isLeader} />
    </div>
  );
}

import { leaveTeam, deleteTeam } from "@/lib/actions/teams";
import { GradientButton } from "@/components/ui/gradient-button";

function TeamActions({ isLeader }: { isLeader: boolean }) {
  async function handleLeave() {
    "use server";
    await leaveTeam();
  }

  async function handleDelete() {
    "use server";
    await deleteTeam();
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
