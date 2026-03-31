import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import type { VoteCategory, VoteResult } from "@/lib/types";

const categoryLabels: Record<VoteCategory, string> = {
  concept_to_reality: "Droga od koncepcji do realizacji \u26A1",
  creativity: "Kreatywno\u015b\u0107 pomys\u0142u \u2728",
  usefulness: "Przydatno\u015b\u0107 / warto\u015b\u0107 u\u017cytkowa \u2699\uFE0F",
};

const categories: VoteCategory[] = [
  "concept_to_reality",
  "creativity",
  "usefulness",
];

export default async function ResultsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const supabase = await createClient();

  // Direct query instead of RPC
  const { data: votes } = await supabase
    .from("votes")
    .select("category, project_id, projects!project_id(id, name)");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("display_name, project_id")
    .not("project_id", "is", null);

  // Build team map
  const teamMap: Record<string, string[]> = {};
  for (const p of profiles ?? []) {
    if (p.project_id) {
      if (!teamMap[p.project_id]) teamMap[p.project_id] = [];
      teamMap[p.project_id].push(p.display_name);
    }
  }

  // Aggregate
  const countMap: Record<string, VoteResult> = {};
  for (const v of votes ?? []) {
    const proj = v.projects as unknown as { id: string; name: string };
    const key = `${proj.id}_${v.category}`;
    if (!countMap[key]) {
      countMap[key] = {
        project_id: proj.id,
        project_name: proj.name,
        team_members: teamMap[proj.id] ?? [],
        category: v.category as VoteCategory,
        vote_count: 0,
      };
    }
    countMap[key].vote_count++;
  }

  const voteResults = Object.values(countMap);

  const grouped: Record<VoteCategory, VoteResult[]> = {
    concept_to_reality: [],
    creativity: [],
    usefulness: [],
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
        Wyniki
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
                      {result.vote_count} {result.vote_count === 1 ? "głos" : result.vote_count >= 2 && result.vote_count <= 4 ? "głosy" : "głosów"}
                    </span>
                  </div>
                </div>
              ))}

              {grouped[cat].length === 0 && (
                <p className="py-8 text-center text-sm text-on-surface-muted">
                  Brak głosów
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
