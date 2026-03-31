import { cancelRequest } from "@/lib/actions/teams";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import type { TeamRequestWithTeam } from "@/lib/types";

interface PendingRequestViewProps {
  request: TeamRequestWithTeam;
  isSolo?: boolean;
}

export function PendingRequestView({ request, isSolo }: PendingRequestViewProps) {
  async function handleCancel() {
    "use server";
    await cancelRequest(request.id);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
        Zespół
      </h1>

      <GlassCard>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
            <svg className="h-7 w-7 text-primary-dim" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-space-grotesk text-xl font-semibold text-on-surface mb-2">
            Oczekujesz na akceptację
          </h2>
          <p className="text-sm text-on-surface-muted mb-6">
            Wysłałeś prośbę o dołączenie do zespołu{" "}
            <span className="font-semibold text-primary-dim">
              {request.team.name}
            </span>
            . Czekaj na decyzję lidera.
          </p>
          {isSolo && (
            <p className="text-xs text-on-surface-muted mb-4">
              Do momentu akceptacji pracujesz solo.
            </p>
          )}
          <form action={handleCancel}>
            <GradientButton type="submit" variant="ghost">
              Anuluj prośbę
            </GradientButton>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
