import { getSubmittedProjects } from "@/lib/utils";
import { VideoFeed } from "@/components/feed/video-feed";

export default async function FeedPage() {
  const projects = await getSubmittedProjects();

  if (projects.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-on-surface-muted">
          No submitted projects yet. Check back soon!
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
