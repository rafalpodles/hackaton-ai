import { createClient } from "@/lib/supabase/server";
import StatsCards from "@/components/admin/stats-cards";
import ProjectsTable from "@/components/admin/projects-table";
import VotingToggle from "@/components/admin/voting-toggle";
import type { ProjectWithTeam } from "@/lib/types";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: projectCount, error: e1 },
    { count: participantCount, error: e2 },
    { count: voteCount, error: e3 },
    { data: projectsRaw, error: e4 },
    { data: settings, error: e5 },
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
    supabase
      .from("app_settings")
      .select("voting_open")
      .eq("id", 1)
      .single(),
  ]);

  const queryError = e1 || e2 || e3 || e4 || e5;
  if (queryError) {
    return (
      <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-6">
        <h2 className="font-space-grotesk text-lg font-bold text-secondary">
          Nie udało się załadować panelu
        </h2>
        <p className="mt-2 text-sm text-on-surface-muted">{queryError.message}</p>
      </div>
    );
  }

  const projects = (projectsRaw ?? []) as ProjectWithTeam[];
  const totalProjects = projectCount ?? 0;
  const submittedCount = projects.filter((p) => p.is_submitted).length;
  const completionPct =
    totalProjects > 0
      ? Math.round((submittedCount / totalProjects) * 100)
      : 0;

  const stats = [
    { label: "Wszystkie projekty", value: totalProjects },
    { label: "Uczestnicy", value: participantCount ?? 0 },
    { label: "Oddane głosy", value: voteCount ?? 0 },
    { label: "Ukończenie", value: `${completionPct}%` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Panel admina
        </h1>
        <VotingToggle isOpen={settings?.voting_open ?? false} />
      </div>

      <StatsCards stats={stats} />

      <div className="space-y-4">
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface">
          Projekty
        </h2>
        <ProjectsTable projects={projects} />
      </div>
    </div>
  );
}
