import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GradientButton } from "@/components/ui/gradient-button";
import { ProjectGrid } from "@/components/projects/project-grid";
import type { ProjectWithTeam } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch submitted projects with team members in a single query
  const { data: rawProjects } = await supabase
    .from("projects")
    .select("*, team:profiles(id, display_name, avatar_url)")
    .eq("is_submitted", true)
    .order("created_at", { ascending: false });

  const projectsWithTeam: ProjectWithTeam[] = (rawProjects ?? []).map((p) => ({
    ...p,
    team: p.team ?? [],
  }));

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="font-space-grotesk text-5xl font-bold leading-tight md:text-6xl">
          <span className="bg-gradient-to-r from-primary-dim to-secondary bg-clip-text text-transparent">
            SPYROSOFT AI
          </span>{" "}
          <span className="text-on-surface">HACKATHON</span>
        </h1>

        <Link href="/feed">
          <GradientButton>Watch All Demos</GradientButton>
        </Link>
      </div>

      {/* Project Grid */}
      {projectsWithTeam.length > 0 ? (
        <ProjectGrid projects={projectsWithTeam} />
      ) : (
        <p className="text-center text-on-surface-muted">
          No projects submitted yet.
        </p>
      )}

      {/* Project count */}
      <p className="text-center text-sm text-on-surface-muted">
        {projectsWithTeam.length}{" "}
        {projectsWithTeam.length === 1 ? "project" : "projects"} submitted
      </p>
    </div>
  );
}
