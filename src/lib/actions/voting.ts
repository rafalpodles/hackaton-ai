"use server";

import { createClient } from "@/lib/supabase/server";
import type { VoteCategory } from "@/lib/types";

interface CastVoteInput {
  category: VoteCategory;
  project_id: string;
}

const VALID_CATEGORIES: VoteCategory[] = [
  "best_overall",
  "best_demo_ux",
  "most_creative",
];

export async function castVotes(votes: CastVoteInput[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to vote." };
  }

  // Check voting is open
  const { data: settings } = await supabase
    .from("app_settings")
    .select("voting_open")
    .eq("id", 1)
    .single();

  if (!settings?.voting_open) {
    return { error: "Voting is not open yet." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("project_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found." };
  }

  // Validate votes structure
  if (!Array.isArray(votes) || votes.length !== 3) {
    return { error: "You must submit exactly 3 votes (one per category)." };
  }

  const seenCategories = new Set<string>();
  const projectIds = new Set<string>();

  for (const vote of votes) {
    if (!VALID_CATEGORIES.includes(vote.category)) {
      return { error: `Invalid category: ${vote.category}` };
    }
    if (seenCategories.has(vote.category)) {
      return { error: `Duplicate category: ${vote.category}` };
    }
    seenCategories.add(vote.category);
    projectIds.add(vote.project_id);

    if (profile.project_id && vote.project_id === profile.project_id) {
      return { error: "You cannot vote for your own project." };
    }
  }

  // Validate all project_ids exist and are submitted
  const { data: validProjects } = await supabase
    .from("projects")
    .select("id")
    .in("id", Array.from(projectIds))
    .eq("is_submitted", true);

  if (!validProjects || validProjects.length !== projectIds.size) {
    return { error: "One or more selected projects are invalid." };
  }

  // Check for existing votes
  const { data: existingVotes } = await supabase
    .from("votes")
    .select("id")
    .eq("voter_id", user.id)
    .limit(1);

  if (existingVotes && existingVotes.length > 0) {
    return { error: "You have already submitted your votes." };
  }

  const rows = votes.map((v) => ({
    voter_id: user.id,
    project_id: v.project_id,
    category: v.category,
  }));

  const { error: insertError } = await supabase.from("votes").insert(rows);

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "You have already submitted your votes." };
    }
    return { error: "Failed to submit votes. Please try again." };
  }

  return { success: true };
}
