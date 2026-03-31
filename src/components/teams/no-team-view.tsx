import { createTeam, goSolo } from "@/lib/actions/teams";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { JoinTeamList } from "@/components/teams/join-team-list";
import type { TeamWithMembers } from "@/lib/types";

interface NoTeamViewProps {
  teams: TeamWithMembers[];
  isSolo?: boolean;
  hasUnsubmittedProject?: boolean;
}

export function NoTeamView({ teams, isSolo, hasUnsubmittedProject }: NoTeamViewProps) {
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
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
        Zespół
      </h1>

      {isSolo && (
        <p className="text-sm text-on-surface-muted">
          Pracujesz solo, ale możesz dołączyć do zespołu lub założyć nowy.
        </p>
      )}

      {/* Create team */}
      <GlassCard>
        <h2 className="font-space-grotesk text-lg font-semibold text-on-surface mb-4">
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
      </GlassCard>

      {/* Join team */}
      <GlassCard>
        <h2 className="font-space-grotesk text-lg font-semibold text-on-surface mb-4">
          Dołącz do zespołu
        </h2>
        <JoinTeamList teams={teams} hasUnsubmittedProject={hasUnsubmittedProject} />
      </GlassCard>

      {/* Solo option (only if not already solo) */}
      {!isSolo && (
        <form action={handleGoSolo}>
          <GradientButton type="submit" variant="ghost">
            Pracuję sam/sama
          </GradientButton>
        </form>
      )}
    </div>
  );
}
