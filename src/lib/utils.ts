import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProjectWithTeam, Hackathon, HackathonParticipant } from "@/lib/types";

/**
 * Get current user profile. Cached per request via React.cache()
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
 * Get a hackathon by its slug.
 */
export const getHackathonBySlug = cache(async (slug: string): Promise<Hackathon | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hackathons")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
});

/**
 * Get a user's participation record for a specific hackathon.
 */
export const getParticipant = cache(async (hackathonId: string, userId: string): Promise<HackathonParticipant | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hackathon_participants")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", userId)
    .single();
  return data;
});

/**
 * Get submitted projects for a hackathon with team member info.
 */
export const getSubmittedProjects = cache(async (hackathonId: string): Promise<ProjectWithTeam[]> => {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .eq("is_submitted", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load projects: ${error.message}`);
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  // Get team members for team-based projects
  const { data: teams } = await supabase
    .from("teams")
    .select("project_id")
    .eq("hackathon_id", hackathonId)
    .in("project_id", projectIds);

  const teamProjectIds = (teams ?? []).map((t) => t.project_id).filter(Boolean) as string[];

  // Get members of those teams via hackathon_participants
  const { data: teamMembers } = teamProjectIds.length > 0
    ? await supabase
        .from("hackathon_participants")
        .select("team_id, user:profiles!user_id(id, display_name, avatar_url)")
        .eq("hackathon_id", hackathonId)
        .not("team_id", "is", null)
    : { data: [] };

  // Build team_id → project_id map
  const teamToProject = new Map<string, string>();
  for (const t of teams ?? []) {
    if (t.project_id) {
      // We need team_id too — get it from the teams table
      const { data: teamRow } = await supabase
        .from("teams")
        .select("id")
        .eq("project_id", t.project_id)
        .eq("hackathon_id", hackathonId)
        .single();
      if (teamRow) teamToProject.set(teamRow.id, t.project_id);
    }
  }

  const teamMap = new Map<string, Pick<Profile, "id" | "display_name" | "avatar_url">[]>();
  for (const m of teamMembers ?? []) {
    const projectId = m.team_id ? teamToProject.get(m.team_id) : null;
    if (projectId && m.user) {
      const u = m.user as unknown as Pick<Profile, "id" | "display_name" | "avatar_url">;
      const existing = teamMap.get(projectId) ?? [];
      existing.push(u);
      teamMap.set(projectId, existing);
    }
  }

  // Get solo users
  const { data: soloParticipants } = await supabase
    .from("hackathon_participants")
    .select("project_id, user:profiles!user_id(id, display_name, avatar_url)")
    .eq("hackathon_id", hackathonId)
    .eq("is_solo", true)
    .in("project_id", projectIds);

  for (const p of soloParticipants ?? []) {
    if (p.project_id && p.user) {
      const u = p.user as unknown as Pick<Profile, "id" | "display_name" | "avatar_url">;
      teamMap.set(p.project_id, [u]);
    }
  }

  return projects.map((p) => ({
    ...p,
    team: teamMap.get(p.id) ?? [],
  }));
});
