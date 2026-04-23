import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getParticipant } from "@/lib/utils";
import { getVoteResults, voteLabel } from "@/lib/vote-results";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

async function hasUserRespondedToSurvey(hackathonId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", userId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export default async function HackathonResultsPage({ params }: Props) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "admin") redirect(`/h/${slug}/admin/results`);

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const participant = await getParticipant(hackathon.id, user.id);
  if (!participant) redirect(`/h/${slug}`);

  if (hackathon.status !== "finished") {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">Wyniki</h1>
        <p className="text-on-surface-muted">Wyniki zostaną opublikowane po zakończeniu hackathonu.</p>
      </div>
    );
  }

  if (hackathon.survey_open) {
    const responded = await hasUserRespondedToSurvey(hackathon.id, user.id);
    if (!responded) {
      return (
        <div className="flex flex-col items-center gap-6 py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-10 w-10 text-primary-dim" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
              Wypełnij ankietę, aby zobaczyć wyniki
            </h1>
            <p className="max-w-md text-on-surface-muted">
              Chcemy poznać Twoją opinię o hackathonie. Wypełnij krótką ankietę — zajmie to tylko chwilę.
            </p>
          </div>
          <Link
            href={`/h/${slug}/survey`}
            className="mt-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-3 font-space-grotesk text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          >
            Wypełnij ankietę
          </Link>
        </div>
      );
    }
  }

  const { categories, grouped } = await getVoteResults(hackathon.id);

  return (
    <div className="space-y-8">
      <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
        Wyniki: {hackathon.name}
      </h1>

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
