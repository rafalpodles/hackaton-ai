import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug } from "@/lib/utils";
import { getVoteResults } from "@/lib/vote-results";
import { ExportResultsButton } from "@/components/admin/export-results-button";
import { RankedResultsGrid } from "@/components/results/ranked-results-grid";

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
    <div className="space-y-11">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="mb-[10px] font-jetbrains-mono text-xs tracking-[0.24em] text-on-surface-dim">
            // FINAL_RESULTS
          </div>
          <h1
            className="font-chakra-petch font-bold leading-[0.95] text-on-surface"
            style={{ fontSize: "clamp(34px, 5vw, 62px)" }}
          >
            Wyniki: <span className="gos-gradient-text">{hackathon.name}</span>
          </h1>
        </div>
        <ExportResultsButton hackathonId={hackathon.id} />
      </div>

      <RankedResultsGrid categories={categories} grouped={grouped} />
    </div>
  );
}
