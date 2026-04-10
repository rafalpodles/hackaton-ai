import { getSubmittedProjects } from "@/lib/utils";
import { VideoFeed } from "@/components/feed/video-feed";
import { createClient } from "@/lib/supabase/server";
import { CountdownBanner } from "@/components/layout/countdown-banner";

export const metadata = {
  title: "Live — Spyrosoft AI Hackathon",
};

export default async function LivePage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("hackathon_date, submission_deadline, voting_open")
    .eq("id", 1)
    .single();

  const projects = await getSubmittedProjects();

  return (
    <div className="min-h-screen">
      {settings?.hackathon_date && (
        <CountdownBanner
          hackathonDate={settings.hackathon_date}
          submissionDeadline={settings.submission_deadline ?? undefined}
          votingOpen={settings.voting_open ?? false}
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
