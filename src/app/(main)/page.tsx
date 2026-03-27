import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/utils";
import { GradientButton } from "@/components/ui/gradient-button";
import { ProjectGrid } from "@/components/projects/project-grid";
import type { ProjectWithTeam } from "@/lib/types";

const phaseLabels: Record<string, string> = {
  submission: "Submission",
  browsing: "Browsing",
  voting: "Voting",
  results: "Results",
};

export default async function HomePage() {
  const [settings, supabase] = await Promise.all([
    getAppSettings(),
    createClient(),
  ]);

  // Fetch submitted projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("is_submitted", true)
    .order("created_at", { ascending: false });

  // Fetch team members for each project
  const projectsWithTeam: ProjectWithTeam[] = await Promise.all(
    (projects ?? []).map(async (project) => {
      const { data: team } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("project_id", project.id);
      return { ...project, team: team ?? [] };
    })
  );

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

        <div className="inline-flex items-center gap-2 rounded-full border border-outline bg-surface-high/60 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-primary-dim animate-pulse" />
          <span className="font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
            Phase: {phaseLabels[settings.current_phase] ?? settings.current_phase}
          </span>
        </div>

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
