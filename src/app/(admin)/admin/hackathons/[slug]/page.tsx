import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import HackathonSettingsForm from "@/components/admin/hackathon-settings-form";
import HackathonVotingToggle from "@/components/admin/hackathon-voting-toggle";
import HackathonSubmissionToggle from "@/components/admin/hackathon-submission-toggle";
import HackathonDatePickerV2 from "@/components/admin/hackathon-date-picker-v2";
import HackathonDeadlinePicker from "@/components/admin/hackathon-deadline-picker";
import HackathonCategories from "@/components/admin/hackathon-categories";
import HackathonParticipantsTable from "@/components/admin/hackathon-participants-table";
import ProjectsTable from "@/components/admin/projects-table";
import type { Project, HackathonCategory } from "@/lib/types";

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

export default async function HackathonAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();
  const supabase = await createClient();

  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!hackathon) notFound();

  const [
    { data: categoriesRaw },
    { data: participantsRaw },
    { data: projectsRaw },
  ] = await Promise.all([
    supabase
      .from("hackathon_categories")
      .select("*")
      .eq("hackathon_id", hackathon.id)
      .order("display_order"),
    supabase
      .from("hackathon_participants")
      .select("*, profile:profiles!user_id(display_name, email, avatar_url)")
      .eq("hackathon_id", hackathon.id)
      .order("joined_at"),
    supabase
      .from("projects")
      .select("*")
      .eq("hackathon_id", hackathon.id)
      .order("created_at", { ascending: false }),
  ]);

  const categories = (categoriesRaw ?? []) as HackathonCategory[];
  const projects = (projectsRaw ?? []) as Project[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const participants = (participantsRaw ?? []).map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    role: p.role,
    project_id: p.project_id,
    display_name: p.profile?.display_name ?? "Nieznany",
    email: p.profile?.email ?? "",
    avatar_url: p.profile?.avatar_url ?? null,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline text-on-surface-muted transition-colors hover:bg-surface-high hover:text-on-surface"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
                {hackathon.name}
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[hackathon.status] ?? STATUS_COLORS.upcoming}`}>
                {STATUS_LABELS[hackathon.status] ?? hackathon.status}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-on-surface-muted">/{hackathon.slug}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <HackathonSubmissionToggle hackathonId={hackathon.id} isOpen={hackathon.submission_open} />
          <HackathonVotingToggle hackathonId={hackathon.id} isOpen={hackathon.voting_open} />
        </div>
      </div>

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
          currentUserId={currentUser!.id}
        />
      </section>
    </div>
  );
}
