import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { Project, Profile } from "@/lib/types";
import { SubmissionForm } from "@/components/submission/submission-form";
import { createProject } from "@/lib/actions/projects";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";

export default async function MyProjectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Must have team or be solo
  if (!user.team_id && !user.is_solo) {
    redirect("/onboarding");
  }

  const supabase = await createClient();

  // Determine project ID
  let projectId: string | null = null;
  let isLeader = false;

  if (user.is_solo && !user.team_id) {
    projectId = user.project_id;
    isLeader = true; // solo users can submit
  } else if (user.team_id) {
    const { data: team } = await supabase
      .from("teams")
      .select("project_id, leader_id")
      .eq("id", user.team_id)
      .single();

    projectId = team?.project_id ?? null;
    isLeader = team?.leader_id === user.id;
  }

  // No project yet — show create form
  if (!projectId) {
    async function handleCreate(formData: FormData) {
      "use server";
      const name = formData.get("name") as string;
      if (!name?.trim()) return;
      await createProject(name.trim());
    }

    return (
      <div className="mx-auto max-w-2xl space-y-8 py-8">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Zgłoś projekt
        </h1>
        <GlassCard>
          <h2 className="font-space-grotesk text-lg font-semibold text-on-surface mb-4">
            Utwórz projekt
          </h2>
          <form action={handleCreate} className="flex gap-3">
            <input
              name="name"
              type="text"
              required
              placeholder="Nazwa projektu"
              className="flex-1 rounded-md border border-outline bg-surface-low px-4 py-3 text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-dim"
            />
            <GradientButton type="submit">Utwórz</GradientButton>
          </form>
        </GlassCard>
      </div>
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    redirect("/onboarding");
  }

  const typedProject = project as Project;

  // Already submitted — read-only view
  if (typedProject.is_submitted) {
    // Get team members
    let team: Pick<Profile, "id" | "display_name" | "avatar_url">[] = [];
    if (user.team_id) {
      const { data: members } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("team_id", user.team_id);
      team = (members ?? []) as Pick<Profile, "id" | "display_name" | "avatar_url">[];
    }

    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-4">
          <h1 className="font-space-grotesk text-2xl font-bold text-on-surface">
            Zgłoszenie projektu
          </h1>
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-dim">
            Zgłoszony &#10003;
          </span>
        </div>

        <div className="space-y-4 rounded-xl border border-outline bg-surface-low p-6 text-sm">
          <InfoRow label="Nazwa" value={typedProject.name} />
          <InfoRow label="Opis" value={typedProject.description} />
          <InfoRow label="Źródło pomysłu" value={typedProject.idea_origin} />
          <InfoRow label="Droga" value={typedProject.journey} />
          <InfoRow
            label="Technologie"
            value={
              (typedProject.tech_stack ?? []).length > 0
                ? (typedProject.tech_stack ?? []).join(", ")
                : "\u2014"
            }
          />
          <InfoRow
            label="Wideo"
            value={
              typedProject.video_url
                ? `Przesłano \u2713${typedProject.video_duration ? ` (${typedProject.video_duration}s)` : ""}`
                : "Nie przesłano"
            }
          />
          <InfoRow
            label="Miniaturka"
            value={typedProject.thumbnail_url ? "Przesłano \u2713" : "Nie przesłano"}
          />
          <InfoRow
            label="Prezentacja"
            value={typedProject.pdf_url ? "Przesłano \u2713" : "Nie przesłano"}
          />
        </div>

        {team.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-on-surface-muted">
              Członkowie zespołu
            </h2>
            <div className="flex flex-wrap gap-3">
              {team.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 rounded-full border border-outline bg-surface-high px-4 py-2"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary-dim">
                      {member.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-on-surface">
                    {member.display_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fetch submission deadline
  const { data: settings } = await supabase
    .from("app_settings")
    .select("submission_open, submission_deadline")
    .eq("id", 1)
    .single();

  return (
    <SubmissionForm
      project={typedProject}
      submissionOpen={settings?.submission_open ?? false}
      deadline={settings?.submission_deadline ?? null}
      canSubmit={isLeader}
    />
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-28 shrink-0 font-semibold uppercase tracking-wider text-on-surface-muted">
        {label}
      </span>
      <span className="text-on-surface">{value || "\u2014"}</span>
    </div>
  );
}
