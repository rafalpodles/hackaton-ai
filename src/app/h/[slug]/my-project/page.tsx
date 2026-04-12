import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug, getParticipant } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { Project, Profile } from "@/lib/types";
import { SubmissionForm } from "@/components/submission/submission-form";
import { createProject } from "@/lib/actions/projects";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonMyProjectPage({ params }: Props) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  // Get participant to check team/solo status (not profiles.team_id/is_solo)
  const participant = await getParticipant(hackathon.id, user.id);
  const teamId = participant?.team_id ?? null;
  const isSolo = participant?.is_solo ?? false;

  // Must have team or be solo
  if (!teamId && !isSolo) {
    redirect(`/h/${slug}/onboarding`);
  }

  const supabase = await createClient();

  // Determine project ID from participant
  let projectId: string | null = null;
  let isLeader = false;

  if (isSolo && !teamId) {
    projectId = participant?.project_id ?? null;
    isLeader = true; // solo users can submit
  } else if (teamId) {
    const { data: team } = await supabase
      .from("teams")
      .select("project_id, leader_id")
      .eq("id", teamId)
      .single();

    projectId = team?.project_id ?? null;
    isLeader = team?.leader_id === user.id;
  }

  const hackathonId = hackathon.id;

  // No project yet
  if (!projectId) {
    // Non-leader team member — show waiting message
    if (!isLeader) {
      return (
        <div className="mx-auto max-w-2xl space-y-8 py-8">
          <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
            Mój projekt
          </h1>
          <GlassCard>
            <div className="text-center py-4">
              <p className="text-on-surface-muted">
                Lider zespołu jeszcze nie utworzył projektu. Czekaj na lidera.
              </p>
            </div>
          </GlassCard>
        </div>
      );
    }

    // Leader or solo — show create form
    async function handleCreate(formData: FormData) {
      "use server";
      const name = formData.get("name") as string;
      if (!name?.trim()) return;
      // TODO: pass hackathonId after Task 13-16
      await createProject(name.trim(), hackathonId);
    }

    return (
      <div className="mx-auto max-w-2xl space-y-8 py-8">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Mój projekt
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
    redirect(`/h/${slug}/onboarding`);
  }

  const typedProject = project as Project;

  // Already submitted — read-only view
  if (typedProject.is_submitted) {
    // Get team members from hackathon_participants
    let team: Pick<Profile, "id" | "display_name" | "avatar_url">[] = [];
    if (teamId) {
      const { data: members } = await supabase
        .from("hackathon_participants")
        .select("user:profiles!user_id(id, display_name, avatar_url)")
        .eq("hackathon_id", hackathon.id)
        .eq("team_id", teamId);
      team = (members ?? []).map(
        (m) => m.user as unknown as Pick<Profile, "id" | "display_name" | "avatar_url">
      );
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
          <InfoRow label="Czego się nauczyłeś" value={typedProject.idea_origin} />
          <InfoRow label="Droga" value={typedProject.journey} />
          <InfoRow
            label="AI toole"
            value={
              (typedProject.tech_stack ?? []).length > 0
                ? (typedProject.tech_stack ?? []).join(", ")
                : "\u2014"
            }
          />
          <InfoRow
            label="Repozytorium"
            value={
              typedProject.repo_url ? (
                <a
                  href={typedProject.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-dim underline underline-offset-2 hover:text-primary"
                >
                  {typedProject.repo_url}
                </a>
              ) : (
                "\u2014"
              )
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

  // Read submission settings from hackathon (not app_settings)
  return (
    <SubmissionForm
      project={typedProject}
      submissionOpen={hackathon.submission_open}
      deadline={hackathon.submission_deadline}
      canSubmit={isLeader}
    />
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-28 shrink-0 font-semibold uppercase tracking-wider text-on-surface-muted">
        {label}
      </span>
      <span className="text-on-surface">{value || "\u2014"}</span>
    </div>
  );
}
