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

  return <ProfileView user={user} project={project} team={team} />;
}
