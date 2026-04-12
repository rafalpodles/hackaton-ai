import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import ProfileView from "@/components/profile/profile-view";
import type { Profile, Project } from "@/lib/types";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let project: Project | null = null;
  let team: Pick<Profile, "id" | "display_name" | "avatar_url">[] = [];

  if (user.project_id) {
    const supabase = await createClient();

    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("id", user.project_id)
      .single();

    project = projectData;

    const { data: teamData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("project_id", user.project_id);

    team = teamData ?? [];
  }

  // Fetch OpenRouter key usage if user has a key
  let keyUsage: number | null = null;
  let keyLimit: number | null = null;

  if (user.openrouter_key_hash) {
    const managementKey = process.env.OPENROUTER_MANAGEMENT_KEY;
    if (managementKey) {
      try {
        const res = await fetch(
          `https://openrouter.ai/api/v1/keys/${user.openrouter_key_hash}`,
          {
            headers: { Authorization: `Bearer ${managementKey}` },
            next: { revalidate: 0 },
          }
        );
        if (res.ok) {
          const { data } = await res.json();
          keyUsage = data?.usage ?? 0;
          keyLimit = data?.limit ?? null;
        }
      } catch {
        // Silently fail
      }
    }
  }

  return (
    <ProfileView
      user={user}
      project={project}
      team={team}
      keyUsage={keyUsage}
      keyLimit={keyLimit}
    />
  );
}
