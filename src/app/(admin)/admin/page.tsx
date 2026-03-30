import { createClient } from "@/lib/supabase/server";
import StatsCards from "@/components/admin/stats-cards";
import ProjectsTable from "@/components/admin/projects-table";
import UsersTable from "@/components/admin/users-table";
import VotingToggle from "@/components/admin/voting-toggle";
import DeadlinePicker from "@/components/admin/deadline-picker";
import SubmissionToggle from "@/components/admin/submission-toggle";
import { getOpenRouterKeyUsage } from "@/lib/actions/admin";
import type { ProjectWithTeam, Profile } from "@/lib/types";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: projectCount, error: e1 },
    { count: participantCount, error: e2 },
    { count: voteCount, error: e3 },
    { data: projectsRaw, error: e4 },
    { data: settings, error: e5 },
    { data: usersRaw, error: e6 },
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
      .select("voting_open, submission_open, submission_deadline")
      .eq("id", 1)
      .single(),
    supabase
      .from("profiles")
      .select("*, project:projects!project_id(name)")
      .order("created_at", { ascending: true }),
  ]);

  const queryError = e1 || e2 || e3 || e4 || e5 || e6;
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

  // Fetch auth users to get login status
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authMap = new Map(
    (authData?.users ?? []).map((u) => [
      u.id,
      {
        confirmed_at: u.confirmed_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
      },
    ])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usersBase = (usersRaw ?? []).map((u: any) => {
    const auth = authMap.get(u.id);
    return {
      ...u as Profile,
      project_name: (u.project as { name: string } | null)?.name ?? null,
      confirmed_at: auth?.confirmed_at ?? null,
      last_sign_in_at: auth?.last_sign_in_at ?? null,
    };
  });

  // Fetch OpenRouter usage for users with keys (in parallel)
  const usageResults = await Promise.all(
    usersBase.map(async (u) => {
      if (!u.openrouter_key_hash) return { ...u, key_usage: null, key_limit: null };
      const usage = await getOpenRouterKeyUsage(u.openrouter_key_hash);
      return {
        ...u,
        key_usage: usage?.usage ?? null,
        key_limit: usage?.limit ?? null,
      };
    })
  );
  const users = usageResults;
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
        <div className="flex gap-3">
          <SubmissionToggle isOpen={settings?.submission_open ?? false} />
          <VotingToggle isOpen={settings?.voting_open ?? false} />
        </div>
      </div>

      <DeadlinePicker currentDeadline={settings?.submission_deadline ?? null} />

      <StatsCards stats={stats} />

      <div className="space-y-4">
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface">
          Projekty
        </h2>
        <ProjectsTable projects={projects} />
      </div>

      <div className="space-y-4">
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface">
          Użytkownicy
        </h2>
        <UsersTable users={users} />
      </div>
    </div>
  );
}
