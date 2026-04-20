import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getHackathonBySlug } from "@/lib/utils";
import StatsCards from "@/components/admin/stats-cards";
import HackathonSettingsForm from "@/components/admin/hackathon-settings-form";
import HackathonVotingToggle from "@/components/admin/hackathon-voting-toggle";
import HackathonSubmissionToggle from "@/components/admin/hackathon-submission-toggle";
import HackathonDatePickerV2 from "@/components/admin/hackathon-date-picker-v2";
import HackathonDeadlinePicker from "@/components/admin/hackathon-deadline-picker";
import HackathonCategories from "@/components/admin/hackathon-categories";
import HackathonParticipantsTable from "@/components/admin/hackathon-participants-table";
import ProjectsTable from "@/components/admin/projects-table";
import type { Project, HackathonCategory } from "@/lib/types";
import SurveyToggle from "@/components/admin/survey-toggle";
import SurveySection from "@/components/admin/survey-section";
import { getQuestionsForAdmin, getSurveyResults } from "@/lib/actions/survey";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Nadchodzący",
  active: "Aktywny",
  voting: "Głosowanie",
  finished: "Zakończony",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-500/15 text-blue-400",
  active: "bg-green-500/15 text-green-400",
  voting: "bg-yellow-500/15 text-yellow-400",
  finished: "bg-surface-high text-on-surface-muted",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonAdminPage({ params }: Props) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const supabase = await createClient();

  const [
    { data: categoriesRaw },
    { data: participantsRaw },
    { data: projectsRaw },
    { data: voterRows },
    surveyQuestions,
    surveyStats,
  ] = await Promise.all([
    supabase.from("hackathon_categories").select("*").eq("hackathon_id", hackathon.id).order("display_order"),
    supabase.from("hackathon_participants").select("*, profile:profiles!user_id(display_name, email, avatar_url), project:projects!project_id(name), team:teams!team_id(name, project_id)").eq("hackathon_id", hackathon.id).order("joined_at"),
    supabase.from("projects").select("*").eq("hackathon_id", hackathon.id).order("created_at", { ascending: false }),
    supabase.from("votes").select("voter_id").eq("hackathon_id", hackathon.id),
    getQuestionsForAdmin(hackathon.id),
    getSurveyResults(hackathon.id),
  ]);

  const categories = (categoriesRaw ?? []) as HackathonCategory[];
  const projects = (projectsRaw ?? []) as Project[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const participants = (participantsRaw ?? []).map((p: any) => {
    const teamData = p.team as { name: string; project_id: string | null } | null;
    // Solo user: project from participant.project_id
    // Team user: project from team.project_id (team leads submit)
    const projectName = p.project?.name ?? null;
    const teamProjectId = teamData?.project_id ?? null;

    return {
      id: p.id,
      user_id: p.user_id,
      role: p.role,
      project_id: p.project_id ?? teamProjectId,
      project_name: projectName,
      team_name: teamData?.name ?? null,
      is_solo: p.is_solo ?? false,
      display_name: p.profile?.display_name ?? "Nieznany",
      email: p.profile?.email ?? "",
      avatar_url: p.profile?.avatar_url ?? null,
    };
  });

  // For team members without direct project_id, resolve project name from team's project
  const teamProjectIds = participants
    .filter((p) => !p.project_name && p.project_id)
    .map((p) => p.project_id!);

  if (teamProjectIds.length > 0) {
    const { data: teamProjects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", teamProjectIds);

    const projectNameMap = new Map((teamProjects ?? []).map((p) => [p.id, p.name]));
    for (const p of participants) {
      if (!p.project_name && p.project_id) {
        p.project_name = projectNameMap.get(p.project_id) ?? null;
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
              Admin: {hackathon.name}
            </h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[hackathon.status] ?? STATUS_COLORS.upcoming}`}>
              {STATUS_LABELS[hackathon.status] ?? hackathon.status}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-on-surface-muted">/{hackathon.slug}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <HackathonSubmissionToggle hackathonId={hackathon.id} isOpen={hackathon.submission_open} />
          <HackathonVotingToggle hackathonId={hackathon.id} isOpen={hackathon.voting_open} />
          <SurveyToggle hackathonId={hackathon.id} isOpen={hackathon.survey_open} />
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={(() => {
        const totalProjects = projects.length;
        const submittedCount = projects.filter((p) => p.is_submitted).length;
        const uniqueVoters = new Set((voterRows ?? []).map((v: { voter_id: string }) => v.voter_id)).size;
        const completionPct = totalProjects > 0 ? Math.round((submittedCount / totalProjects) * 100) : 0;
        return [
          { label: "Projekty", value: totalProjects },
          { label: "Uczestnicy", value: participants.length },
          { label: "Zagłosowało", value: uniqueVoters },
          { label: "Ankiety", value: surveyStats.total_responses },
          { label: "Ukończenie", value: `${completionPct}%` },
        ];
      })()} />

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HackathonDatePickerV2
          hackathonId={hackathon.id}
          currentDate={hackathon.hackathon_date}
        />
        <HackathonDeadlinePicker
          hackathonId={hackathon.id}
          currentDeadline={hackathon.submission_deadline}
        />
      </div>

      {/* Settings */}
      <section className="rounded-xl border border-outline bg-surface-low/60 p-6 backdrop-blur-md">
        <h2 className="mb-5 font-space-grotesk text-lg font-semibold text-on-surface">
          Ustawienia hackathonu
        </h2>
        <HackathonSettingsForm hackathon={hackathon} />
      </section>

      {/* Categories */}
      <section className="rounded-xl border border-outline bg-surface-low/60 p-6 backdrop-blur-md">
        <h2 className="mb-5 font-space-grotesk text-lg font-semibold text-on-surface">
          Kategorie głosowania
          <span className="ml-2 font-mono text-sm font-normal text-on-surface-muted">
            ({categories.length})
          </span>
        </h2>
        <HackathonCategories hackathonId={hackathon.id} categories={categories} />
      </section>

      {/* Projects */}
      <section>
        <h2 className="mb-4 font-space-grotesk text-xl font-semibold text-on-surface">
          Projekty
          <span className="ml-2 font-mono text-sm font-normal text-on-surface-muted">
            ({projects.length})
          </span>
        </h2>
        <ProjectsTable projects={projects} />
      </section>

      {/* Participants */}
      <section>
        <h2 className="mb-4 font-space-grotesk text-xl font-semibold text-on-surface">
          Uczestnicy
          <span className="ml-2 font-mono text-sm font-normal text-on-surface-muted">
            ({participants.length})
          </span>
        </h2>
        <HackathonParticipantsTable
          hackathonId={hackathon.id}
          participants={participants}
          currentUserId={currentUser.id}
        />
      </section>

      {/* Survey */}
      <section className="rounded-xl border border-outline bg-surface-low/60 p-6 backdrop-blur-md">
        <h2 className="mb-5 font-space-grotesk text-lg font-semibold text-on-surface">
          Ankieta pohackathonowa
        </h2>
        <SurveySection
          hackathonId={hackathon.id}
          initialQuestions={surveyQuestions}
          stats={surveyStats}
        />
      </section>

      {/* Links */}
      <div className="flex gap-3">
        <Link
          href={`/h/${slug}/admin/results`}
          className="inline-flex items-center gap-2 rounded-lg border border-outline px-4 py-2 text-sm text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
        >
          Wyniki i eksport
        </Link>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-outline px-4 py-2 text-sm text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
        >
          Globalny panel admina
        </Link>
      </div>
    </div>
  );
}
