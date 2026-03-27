import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

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
 * Cached per request so multiple pages/components don't re-fetch.
 */
export const getSubmittedProjects = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, team:profiles!project_id(id, display_name, avatar_url)")
    .eq("is_submitted", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load projects: ${error.message}`);

  return (data ?? []).map((p) => ({
    ...p,
    team: p.team ?? [],
  }));
});
