import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { Project, Profile } from "@/lib/types";
import { SubmissionForm } from "@/components/submission/submission-form";

export default async function MyProjectPage() {
  const user = await getCurrentUser();
  if (!user || !user.project_id) {
    redirect("/onboarding");
  }

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", user.project_id)
    .single();

  if (!project) {
    redirect("/onboarding");
  }

  const typedProject = project as Project;

  // Already submitted — read-only view
  if (typedProject.is_submitted) {
    const { data: members } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("project_id", typedProject.id);

    const team = (members ?? []) as Pick<
      Profile,
      "id" | "display_name" | "avatar_url"
    >[];

    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-4">
          <h1 className="font-space-grotesk text-2xl font-bold text-on-surface">
            Project Submission
          </h1>
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-dim">
            Submitted &#10003;
          </span>
        </div>

        <div className="space-y-4 rounded-xl border border-outline bg-surface-low p-6 text-sm">
          <InfoRow label="Name" value={typedProject.name} />
          <InfoRow label="Description" value={typedProject.description} />
          <InfoRow label="Idea Origin" value={typedProject.idea_origin} />
          <InfoRow label="Journey" value={typedProject.journey} />
          <InfoRow
            label="Tech Stack"
            value={
              typedProject.tech_stack.length > 0
                ? typedProject.tech_stack.join(", ")
                : "\u2014"
            }
          />
          <InfoRow
            label="Video"
            value={
              typedProject.video_url
                ? `Uploaded \u2713${typedProject.video_duration ? ` (${typedProject.video_duration}s)` : ""}`
                : "\u2014"
            }
          />
          <InfoRow
            label="Thumbnail"
            value={typedProject.thumbnail_url ? "Uploaded \u2713" : "\u2014"}
          />
          <InfoRow
            label="Presentation"
            value={typedProject.pdf_url ? "Uploaded \u2713" : "\u2014"}
          />
        </div>

        {/* Team members */}
        {team.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-space-grotesk text-sm font-bold uppercase tracking-wider text-on-surface-muted">
              Team Members
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

  // Not submitted — show form
  return (
    <div className="space-y-6">
      <h1 className="font-space-grotesk text-2xl font-bold text-on-surface">
        Project Submission
      </h1>
      <SubmissionForm project={typedProject} />
    </div>
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
