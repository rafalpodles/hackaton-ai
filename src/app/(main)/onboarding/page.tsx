import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "@/lib/actions/projects";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { JoinProjectList } from "@/components/submission/join-project-list";
import type { ProjectWithTeam } from "@/lib/types";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.project_id) redirect("/my-project");

  const supabase = await createClient();

  // Fetch unsubmitted projects with their team members
  const { data: projects } = await supabase
    .from("projects")
    .select("*, team:profiles!project_id(id, display_name, avatar_url)")
    .eq("is_submitted", false)
    .order("created_at", { ascending: false });

  const projectList: ProjectWithTeam[] = (projects ?? []) as ProjectWithTeam[];

  async function handleCreate(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    if (!name?.trim()) return;
    await createProject(name.trim());
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 py-8">
      <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
        Get Started
      </h1>

      <GlassCard>
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface mb-6">
          Create New Project
        </h2>
        <form action={handleCreate} className="flex gap-3">
          <input
            name="name"
            type="text"
            required
            placeholder="Project name"
            className="flex-1 rounded-md border border-outline bg-surface-low px-4 py-3 text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-dim"
          />
          <GradientButton type="submit">Create</GradientButton>
        </form>
      </GlassCard>

      <GlassCard>
        <h2 className="font-space-grotesk text-xl font-semibold text-on-surface mb-6">
          Join Existing Project
        </h2>
        <JoinProjectList projects={projectList} />
      </GlassCard>
    </div>
  );
}
