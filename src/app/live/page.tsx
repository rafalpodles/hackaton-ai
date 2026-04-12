import { getSubmittedProjects } from "@/lib/utils";
import { VideoFeed } from "@/components/feed/video-feed";
import { createClient } from "@/lib/supabase/server";
import { CountdownBanner } from "@/components/layout/countdown-banner";

export const metadata = {
  title: "Live — Spyrosoft Hackathons",
};

export default async function LivePage() {
  const supabase = await createClient();

  // Get the most recent non-upcoming hackathon
  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("*")
    .neq("status", "upcoming")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!hackathon) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-on-surface-muted">Brak aktywnych hackatonów.</p>
      </div>
    );
  }

  const projects = await getSubmittedProjects(hackathon.id);

  return (
    <div className="min-h-screen">
      {hackathon.hackathon_date && (
        <CountdownBanner
          hackathonDate={hackathon.hackathon_date}
          submissionDeadline={hackathon.submission_deadline ?? undefined}
          votingOpen={hackathon.voting_open ?? false}
        />
      )}
      {projects.length === 0 ? (
        <div className="flex h-96 items-center justify-center">
          <p className="text-on-surface-muted">
            Brak zgłoszonych projektów. Sprawdź później!
          </p>
        </div>
      ) : (
        <VideoFeed projects={projects} />
      )}
    </div>
  );
}
