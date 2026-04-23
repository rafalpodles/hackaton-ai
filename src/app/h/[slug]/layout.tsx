import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug, getParticipant } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/sidebar";
import { CountdownBanner } from "@/components/layout/countdown-banner";
import { HackathonProvider } from "@/components/layout/hackathon-provider";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function HackathonLayout({ children, params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  // Unauth users get a simplified layout (no sidebar)
  if (!user) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline bg-surface-low/80 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-on-surface-muted hover:text-on-surface transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="font-space-grotesk text-lg font-bold text-on-surface">
              {hackathon.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-outline px-4 py-2 font-space-grotesk text-sm text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
            >
              Zaloguj się
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 font-space-grotesk text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Dołącz
            </Link>
          </div>
        </header>
        {hackathon.hackathon_date && (
          <CountdownBanner
            hackathonDate={hackathon.hackathon_date}
            submissionDeadline={hackathon.submission_deadline ?? undefined}
            votingOpen={hackathon.voting_open}
          />
        )}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    );
  }

  const participant = await getParticipant(hackathon.id, user.id);

  let surveyRespondedByUser = false;
  if (hackathon.survey_open && participant) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("hackathon_id", hackathon.id)
      .eq("user_id", user.id)
      .limit(1);
    surveyRespondedByUser = (data?.length ?? 0) > 0;
  }

  return (
    <HackathonProvider hackathon={hackathon} participant={participant}>
      <div className="min-h-screen">
        <Sidebar
          user={user}
          votingOpen={hackathon.voting_open}
          surveyOpen={hackathon.survey_open}
          surveyResponded={surveyRespondedByUser}
          hackathonFinished={hackathon.status === "finished"}
          hackathonSlug={hackathon.slug}
        />
        <div className="lg:ml-60">
          {hackathon.hackathon_date && (
            <CountdownBanner
              hackathonDate={hackathon.hackathon_date}
              submissionDeadline={hackathon.submission_deadline ?? undefined}
              votingOpen={hackathon.voting_open}
            />
          )}
          <main className="p-4 pt-16 lg:p-8">{children}</main>
        </div>
      </div>
    </HackathonProvider>
  );
}
