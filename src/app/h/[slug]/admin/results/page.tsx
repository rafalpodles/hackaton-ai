import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { ExportResultsButton } from "@/components/admin/export-results-button";
import type { HackathonCategory, VoteResult } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonAdminResultsPage({ params }: Props) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const supabase = await createClient();

  const { data: categoriesData } = await supabase
    .from("hackathon_categories")
    .select("*")
    .eq("hackathon_id", hackathon.id)
    .order("display_order", { ascending: true });

  const categories = (categoriesData ?? []) as HackathonCategory[];

  const { data: votes } = await supabase
    .from("votes")
    .select("category, project_id, projects!project_id(id, name)")
    .eq("hackathon_id", hackathon.id);

  const { data: participants } = await supabase
    .from("hackathon_participants")
    .select("project_id, user:profiles!user_id(display_name)")
    .eq("hackathon_id", hackathon.id)
    .not("project_id", "is", null);

  const teamMap: Record<string, string[]> = {};
  for (const p of participants ?? []) {
    if (p.project_id && p.user) {
      const u = p.user as unknown as { display_name: string };
      if (!teamMap[p.project_id]) teamMap[p.project_id] = [];
      teamMap[p.project_id].push(u.display_name);
    }
  }

  const countMap: Record<string, VoteResult> = {};
  for (const v of votes ?? []) {
    const proj = v.projects as unknown as { id: string; name: string };
    if (!proj) continue;
    const key = `${proj.id}_${v.category}`;
    if (!countMap[key]) {
      countMap[key] = {
        project_id: proj.id,
        project_name: proj.name,
        team_members: teamMap[proj.id] ?? [],
        category: v.category,
        vote_count: 0,
      };
    }
    countMap[key].vote_count++;
  }

  const voteResults = Object.values(countMap);

  const grouped: Record<string, VoteResult[]> = {};
  for (const cat of categories) {
    grouped[cat.slug] = [];
  }
  for (const r of voteResults) {
    if (grouped[r.category]) {
      grouped[r.category].push(r);
    }
  }
  for (const cat of categories) {
    grouped[cat.slug].sort((a, b) => b.vote_count - a.vote_count);
  }

  function voteLabel(count: number): string {
    if (count === 1) return "głos";
    if (count >= 2 && count <= 4) return "głosy";
    return "głosów";
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Wyniki: {hackathon.name}
        </h1>
        <ExportResultsButton hackathonId={hackathon.id} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.slug} className="space-y-4">
            <h2 className="font-space-grotesk text-lg font-semibold text-on-surface">
              {cat.label}
            </h2>

            <div className="space-y-3">
              {(grouped[cat.slug] ?? []).map((result, index) => (
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
                      {result.vote_count} {voteLabel(result.vote_count)}
                    </span>
                  </div>
                </div>
              ))}

              {(grouped[cat.slug] ?? []).length === 0 && (
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
