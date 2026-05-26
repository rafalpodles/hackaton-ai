import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  ProjectWithTeam,
  Hackathon,
  HackathonParticipant,
  RulesContent,
  FaqSectionWithItems,
  ProjectIdea,
  UsefulPrompt,
} from "@/lib/types";

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
    .select("id, project_id")
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

  // Build team_id → project_id map (no extra queries needed)
  const teamToProject = new Map<string, string>();
  for (const t of teams ?? []) {
    if (t.project_id) {
      teamToProject.set(t.id, t.project_id);
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

export const getRulesContent = cache(
  async (hackathonId: string): Promise<RulesContent | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hackathons")
      .select("rules_content")
      .eq("id", hackathonId)
      .single();
    return (data?.rules_content as RulesContent | null) ?? null;
  }
);

export const getFaqForHackathon = cache(
  async (hackathonId: string): Promise<FaqSectionWithItems[]> => {
    const supabase = await createClient();
    const { data: sections } = await supabase
      .from("hackathon_faq_sections")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("display_order");

    if (!sections || sections.length === 0) return [];

    const { data: items } = await supabase
      .from("hackathon_faq_items")
      .select("*")
      .in(
        "section_id",
        sections.map((s) => s.id)
      )
      .order("display_order");

    const itemsBySection = new Map<string, FaqSectionWithItems["items"]>();
    for (const it of items ?? []) {
      const arr = itemsBySection.get(it.section_id) ?? [];
      arr.push(it);
      itemsBySection.set(it.section_id, arr);
    }

    return sections.map((s) => ({
      ...s,
      items: itemsBySection.get(s.id) ?? [],
    }));
  }
);

export const getIdeasForHackathon = cache(
  async (hackathonId: string): Promise<ProjectIdea[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hackathon_project_ideas")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("display_order");
    return (data ?? []) as ProjectIdea[];
  }
);

export const getPromptsForHackathon = cache(
  async (hackathonId: string): Promise<UsefulPrompt[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("hackathon_prompts")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("display_order");
    return (data ?? []) as UsefulPrompt[];
  }
);

const DEFAULT_API_KEY_LIMIT = 5;

export const getActiveHackathonApiKeyLimit = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hackathons")
    .select("api_key_default_limit_usd")
    .in("status", ["active", "voting"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.api_key_default_limit_usd ?? DEFAULT_API_KEY_LIMIT;
});

export const getApiKeyLimitForUser = cache(async (userId: string): Promise<number> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hackathon_participants")
    .select("hackathon:hackathons!hackathon_id(api_key_default_limit_usd, status, created_at)")
    .eq("user_id", userId);
  const limits = (data ?? [])
    .map((p) => p.hackathon as unknown as { api_key_default_limit_usd: number; status: string; created_at: string } | null)
    .filter((h): h is { api_key_default_limit_usd: number; status: string; created_at: string } =>
      h !== null && (h.status === "active" || h.status === "voting")
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return limits[0]?.api_key_default_limit_usd ?? DEFAULT_API_KEY_LIMIT;
});
