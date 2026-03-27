import { createClient } from "@/lib/supabase/server";
import type { VoteCategory, VoteResult } from "@/lib/types";

const categoryLabels: Record<VoteCategory, string> = {
  best_overall: "Best Overall 🏆",
  best_demo_ux: "Best Demo / UX 🎨",
  most_creative: "Most Creative 🧠",
};

const categories: VoteCategory[] = [
  "best_overall",
  "best_demo_ux",
  "most_creative",
];

export default async function ResultsPage() {
  const supabase = await createClient();
  const { data: results } = await supabase.rpc("get_vote_results");
  const voteResults = (results ?? []) as VoteResult[];

  const grouped: Record<VoteCategory, VoteResult[]> = {
    best_overall: [],
    best_demo_ux: [],
    most_creative: [],
  };

  for (const r of voteResults) {
    grouped[r.category]?.push(r);
  }

  for (const cat of categories) {
    grouped[cat].sort((a, b) => b.vote_count - a.vote_count);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
        Results
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat} className="space-y-4">
            <h2 className="font-space-grotesk text-lg font-semibold text-on-surface">
              {categoryLabels[cat]}
            </h2>

            <div className="space-y-3">
              {grouped[cat].map((result, index) => (
                <div
                  key={result.project_id}
                  className={`rounded-xl border p-4 backdrop-blur-md ${
                    index === 0
                      ? "border-primary/40 bg-gradient-to-br from-primary/20 to-secondary/20"
                      : "border-outline bg-surface-low/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-space-grotesk text-sm font-bold text-on-surface-muted">
                          #{index + 1}
                        </span>
                        <h3 className="truncate font-space-grotesk text-base font-semibold text-on-surface">
                          {result.project_name}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-on-surface-muted">
                        {result.team_members.join(", ")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-primary/15 px-2 py-1 font-space-grotesk text-sm font-bold text-primary-dim">
                      {result.vote_count} {result.vote_count === 1 ? "vote" : "votes"}
                    </span>
                  </div>
                </div>
              ))}

              {grouped[cat].length === 0 && (
                <p className="py-8 text-center text-sm text-on-surface-muted">
                  No votes yet
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
