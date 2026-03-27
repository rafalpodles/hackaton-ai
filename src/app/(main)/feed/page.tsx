import Link from "next/link";
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
      {/* Close Feed link */}
      <Link
        href="/"
        className="fixed left-64 top-4 z-50 rounded-full bg-surface-high/80 px-4 py-2 text-sm font-medium text-on-surface-muted backdrop-blur-sm transition-colors hover:text-on-surface"
      >
        &larr; Close Feed
      </Link>

      <VideoFeed projects={projects} />
    </div>
  );
}
