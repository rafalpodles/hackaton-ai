import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import ProfileView from "@/components/profile/profile-view";
import type { Profile, Project } from "@/lib/types";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Get user's hackathon participations with project and team info
  const { data: participations } = await supabase
    .from("hackathon_participants")
    .select("hackathon_id, team_id, project_id, is_solo, hackathon:hackathons!hackathon_id(name, slug)")
    .eq("user_id", user.id);

  // Find the first participation with a project (most relevant)
  let project: Project | null = null;
  let team: Pick<Profile, "id" | "display_name" | "avatar_url">[] = [];

  const activeParticipation = (participations ?? []).find((p) => p.project_id || p.team_id);

  if (activeParticipation?.project_id) {
    const { data: proj } = await supabase
      .from("projects")
      .select("*")
      .eq("id", activeParticipation.project_id)
      .single();
    project = proj;
  }

  if (activeParticipation?.team_id) {
    const { data: members } = await supabase
      .from("hackathon_participants")
      .select("user:profiles!user_id(id, display_name, avatar_url)")
      .eq("team_id", activeParticipation.team_id);
    team = (members ?? []).map((m) => m.user as unknown as Pick<Profile, "id" | "display_name" | "avatar_url">);
  } else if (activeParticipation?.is_solo) {
    team = [{ id: user.id, display_name: user.display_name, avatar_url: user.avatar_url }];
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
