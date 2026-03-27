import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/utils";
import StatsCards from "@/components/admin/stats-cards";
import PhaseSwitcher from "@/components/admin/phase-switcher";
import ProjectsTable from "@/components/admin/projects-table";
import type { ProjectWithTeam } from "@/lib/types";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const settings = await getAppSettings();

  const [
    { count: projectCount },
    { count: participantCount },
    { count: voteCount },
    { data: projectsRaw },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .not("project_id", "is", null),
    supabase
      .from("votes")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("projects")
      .select("*, team:profiles!project_id(id, display_name, avatar_url)"),
  ]);

  const projects = (projectsRaw ?? []) as ProjectWithTeam[];
  const totalProjects = projectCount ?? 0;
  const submittedCount = projects.filter((p) => p.is_submitted).length;
  const completionPct =
    totalProjects > 0
      ? Math.round((submittedCount / totalProjects) * 100)
      : 0;

  const stats = [
    { label: "Total Projects", value: totalProjects },
    { label: "Participants", value: participantCount ?? 0 },
    { label: "Votes Cast", value: voteCount ?? 0 },
    { label: "Completion", value: `${completionPct}%` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Admin Dashboard
        </h1>
        <PhaseSwitcher currentPhase={settings.current_phase} />
      </div>

      <StatsCards stats={stats} />

      <div className="space-y-4">
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface">
          Projects
        </h2>
        <ProjectsTable projects={projects} />
      </div>
    </div>
  );
}
