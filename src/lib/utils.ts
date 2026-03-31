import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProjectWithTeam } from "@/lib/types";

/**
 * Get current user profile. Cached per request via React.cache()
 * so layout + page don't duplicate the query.
 */
export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
});

/**
 * Shared data fetching: submitted projects with team members.
 * Projects can belong to a team (via teams.project_id) or a solo user (via profiles.project_id).
 */
export const getSubmittedProjects = cache(async (): Promise<ProjectWithTeam[]> => {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_submitted", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load projects: ${error.message}`);
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  // Get team members (projects owned by teams)
  const { data: teams } = await supabase
    .from("teams")
    .select("project_id, members:profiles!team_id(id, display_name, avatar_url)")
    .in("project_id", projectIds);

  // Get solo users (projects owned directly by profiles)
  const { data: soloProfiles } = await supabase
    .from("profiles")
    .select("project_id, id, display_name, avatar_url")
    .in("project_id", projectIds)
    .eq("is_solo", true);

  const teamMap = new Map<string, Pick<Profile, "id" | "display_name" | "avatar_url">[]>();

  for (const t of teams ?? []) {
    if (t.project_id) {
      teamMap.set(t.project_id, (t.members ?? []) as Pick<Profile, "id" | "display_name" | "avatar_url">[]);
    }
  }

  for (const p of soloProfiles ?? []) {
    if (p.project_id) {
      teamMap.set(p.project_id, [{ id: p.id, display_name: p.display_name, avatar_url: p.avatar_url }]);
    }
  }

  return projects.map((p) => ({
    ...p,
    team: teamMap.get(p.id) ?? [],
  }));
});
