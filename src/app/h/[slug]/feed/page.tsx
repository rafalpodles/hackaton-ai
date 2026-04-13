import { notFound } from "next/navigation";
import { getHackathonBySlug, getSubmittedProjects } from "@/lib/utils";
import { VideoFeed } from "@/components/feed/video-feed";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonFeedPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const projects = await getSubmittedProjects(hackathon.id);

  if (projects.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-on-surface-muted">
          Brak zgłoszonych projektów. Sprawdź później!
        </p>
      </div>
    );
  }

  return (
    <div className="-m-8 relative">
      <VideoFeed projects={projects} />
    </div>
  );
}
