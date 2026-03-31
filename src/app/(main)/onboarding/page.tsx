import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { createTeam, goSolo } from "@/lib/actions/teams";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { JoinTeamList } from "@/components/teams/join-team-list";
import type { TeamWithMembers } from "@/lib/types";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.team_id || user.is_solo) redirect("/");

  const supabase = await createClient();

  // Fetch teams with their members
  const { data: teams } = await supabase
    .from("teams")
    .select("*, members:profiles!team_id(id, display_name, avatar_url, email)")
    .order("created_at", { ascending: false });

  const teamList = (teams ?? []) as TeamWithMembers[];

  // Check if user has a pending request
  const { data: pendingRequest } = await supabase
    .from("team_requests")
    .select("id, team_id, team:teams!team_id(id, name)")
    .eq("user_id", user.id)
    .single();

  async function handleCreateTeam(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    if (!name?.trim()) return;
    await createTeam(name.trim());
  }

  async function handleGoSolo() {
    "use server";
    await goSolo();
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

import { cancelRequest } from "@/lib/actions/teams";

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
