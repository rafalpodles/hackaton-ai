import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ProjectWithTeam, Profile } from "@/lib/types";
import { VideoFeed } from "@/components/feed/video-feed";

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("is_submitted", true)
    .order("created_at", { ascending: true });

  if (!projects || projects.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-on-surface-muted">
          No submitted projects yet. Check back soon!
        </p>
      </div>
    );
  }

  // Fetch team members for each project
  const projectIds = projects.map((p) => p.id);
  const { data: members } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, project_id")
    .in("project_id", projectIds);

  const membersByProject = (members ?? []).reduce<
    Record<string, Pick<Profile, "id" | "display_name" | "avatar_url">[]>
  >((acc, m) => {
    const pid = m.project_id as string;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push({
      id: m.id,
      display_name: m.display_name,
      avatar_url: m.avatar_url,
    });
    return acc;
  }, {});

  const projectsWithTeam: ProjectWithTeam[] = projects.map((p) => ({
    ...p,
    team: membersByProject[p.id] ?? [],
  }));

  return (
    <div className="-m-8 relative">
      {/* Close Feed link */}
      <Link
        href="/"
        className="fixed left-64 top-4 z-50 rounded-full bg-surface-high/80 px-4 py-2 text-sm font-medium text-on-surface-muted backdrop-blur-sm transition-colors hover:text-on-surface"
      >
        &larr; Close Feed
      </Link>

      <VideoFeed projects={projectsWithTeam} />
    </div>
  );
}
