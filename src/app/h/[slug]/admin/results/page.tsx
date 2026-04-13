import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug } from "@/lib/utils";
import { getVoteResults, voteLabel } from "@/lib/vote-results";
import { ExportResultsButton } from "@/components/admin/export-results-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonAdminResultsPage({ params }: Props) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const { categories, grouped } = await getVoteResults(hackathon.id);

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
