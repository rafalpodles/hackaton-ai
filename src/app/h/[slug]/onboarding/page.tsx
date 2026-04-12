import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug, getParticipant } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { createTeam, goSolo, cancelRequest } from "@/lib/actions/teams";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { JoinTeamList } from "@/components/teams/join-team-list";
import type { TeamWithMembers } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonOnboardingPage({ params }: Props) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  // Check participant exists via hackathon_participants (not profile.team_id/is_solo)
  const participant = await getParticipant(hackathon.id, user.id);
  if (participant?.team_id || participant?.is_solo) {
    redirect(`/h/${slug}`);
  }

  const supabase = await createClient();

  // Fetch teams filtered by hackathon_id
  const { data: teams } = await supabase
    .from("teams")
    .select("*, members:hackathon_participants!team_id(user_id, user:profiles!user_id(id, display_name, avatar_url, email))")
    .eq("hackathon_id", hackathon.id)
    .order("created_at", { ascending: false });

  // Normalize team members to the shape TeamWithMembers expects
  const teamList: TeamWithMembers[] = (teams ?? []).map((t) => ({
    ...t,
    members: (t.members ?? []).map((m: { user: { id: string; display_name: string; avatar_url: string | null; email: string } }) => m.user),
  }));

  // Check if user has a pending request
  const { data: pendingRequest } = await supabase
    .from("team_requests")
    .select("id, team_id, team:teams!team_id(id, name)")
    .eq("user_id", user.id)
    .single();

  const hackathonId = hackathon.id;

  async function handleCreateTeam(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    if (!name?.trim()) return;
    // TODO: pass hackathonId after Task 13-16
    await createTeam(name.trim(), hackathonId);
  }

  async function handleGoSolo() {
    "use server";
    // TODO: pass hackathonId after Task 13-16
    await goSolo(hackathonId);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 py-8">
      <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
        Zaczynamy!
      </h1>

      {/* Create team */}
      <GlassCard>
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface mb-6">
          Załóż zespół
        </h2>
        <form action={handleCreateTeam} className="flex gap-3">
          <input
            name="name"
            type="text"
            required
            placeholder="Nazwa zespołu"
            className="flex-1 rounded-md border border-outline bg-surface-low px-4 py-3 text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-dim"
          />
          <GradientButton type="submit">Utwórz</GradientButton>
        </form>
        <p className="mt-3 text-xs text-on-surface-muted">
          Zostaniesz liderem zespołu. Max 5 osób.
        </p>
      </GlassCard>

      {/* Join team */}
      <GlassCard>
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface mb-6">
          Dołącz do zespołu
        </h2>
        {pendingRequest ? (
          <PendingRequestInfo
            requestId={pendingRequest.id}
            teamName={
              (pendingRequest.team as unknown as { name: string })?.name ??
              "Nieznany"
            }
          />
        ) : (
          <JoinTeamList teams={teamList} />
        )}
      </GlassCard>

      {/* Solo */}
      <GlassCard>
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface mb-4">
          Pracuję solo
        </h2>
        <p className="text-sm text-on-surface-muted mb-4">
          Nie chcesz dołączać do zespołu? Możesz pracować samodzielnie.
        </p>
        <form action={handleGoSolo}>
          <GradientButton type="submit" variant="ghost">
            Pracuję sam/sama
          </GradientButton>
        </form>
      </GlassCard>
    </div>
  );
}

function PendingRequestInfo({
  requestId,
  teamName,
}: {
  requestId: string;
  teamName: string;
}) {
  async function handleCancel() {
    "use server";
    await cancelRequest(requestId);
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
      <p className="text-sm text-on-surface">
        Oczekujesz na akceptację do zespołu{" "}
        <span className="font-semibold text-primary-dim">{teamName}</span>
      </p>
      <form action={handleCancel} className="mt-3">
        <GradientButton type="submit" variant="ghost">
          Anuluj
        </GradientButton>
      </form>
    </div>
  );
}
