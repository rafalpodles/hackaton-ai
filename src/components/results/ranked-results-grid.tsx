import { voteLabel } from "@/lib/vote-results";
import type { HackathonCategory, VoteResult } from "@/lib/types";

interface RankedResultsGridProps {
  categories: HackathonCategory[];
  grouped: Record<string, VoteResult[]>;
}

export function RankedResultsGrid({ categories, grouped }: RankedResultsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-3">
      {categories.map((cat) => {
        const rows = grouped[cat.slug] ?? [];
        const max = Math.max(1, ...rows.map((r) => r.vote_count));
        return (
          <div key={cat.slug}>
            <h2 className="mb-[18px] font-chakra-petch text-[21px] font-bold text-on-surface">
              {cat.label}
            </h2>

            <div className="flex flex-col gap-[10px]">
              {rows.map((result, index) => {
                const first = index === 0;
                return (
                  <div
                    key={result.project_id}
                    className="relative overflow-hidden rounded-[13px] border bg-[rgba(14,14,21,.55)]"
                    style={{ borderColor: first ? "rgba(255,193,77,.4)" : "rgba(255,255,255,.09)" }}
                  >
                    <div
                      data-gos-anim
                      className="absolute inset-y-0 left-0 origin-left"
                      style={{
                        width: `${Math.round((result.vote_count / max) * 100)}%`,
                        background: "linear-gradient(90deg, rgba(99,102,241,.28), rgba(255,90,77,.14))",
                        animation: "barGrow .9s cubic-bezier(.2,.8,.2,1) both",
                        animationDelay: `${index * 0.06}s`,
                      }}
                    />
                    <div className="relative flex items-center gap-3 px-[18px] py-4">
                      <span
                        className="w-[34px] shrink-0 text-center font-jetbrains-mono text-sm font-bold"
                        style={{ color: first ? "#ffc14d" : "#8b8b9a" }}
                      >
                        #{index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-on-surface">
                          {result.project_name}
                        </div>
                        {result.team_members.length > 0 && (
                          <div className="truncate text-[13px] text-on-surface-dim">
                            {result.team_members.join(", ")}
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 rounded-lg bg-[rgba(139,140,245,.16)] px-3 py-[6px] font-jetbrains-mono text-[13px] font-bold text-[#c7c8ff]">
                        {result.vote_count} {voteLabel(result.vote_count)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {rows.length === 0 && (
                <p className="py-8 text-center text-sm text-on-surface-muted">Brak głosów</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
