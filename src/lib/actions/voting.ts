"use server";

import { createClient } from "@/lib/supabase/server";
import type { VoteCategory } from "@/lib/types";

interface CastVoteInput {
  category: VoteCategory;
  project_id: string;
}

const VALID_CATEGORIES: VoteCategory[] = [
  "concept_to_reality",
  "creativity",
  "usefulness",
];

export async function castVotes(votes: CastVoteInput[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Musisz być zalogowany, aby głosować." };
  }

  // Check voting is open
  const { data: settings } = await supabase
    .from("app_settings")
    .select("voting_open")
    .eq("id", 1)
    .single();

  if (!settings?.voting_open) {
    return { error: "Głosowanie nie jest jeszcze otwarte." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("project_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Nie znaleziono profilu." };
  }

  // Validate votes structure
  if (!Array.isArray(votes) || votes.length !== 3) {
    return { error: "Musisz oddać dokładnie 3 głosy (po jednym na kategorię)." };
  }

  const seenCategories = new Set<string>();
  const projectIds = new Set<string>();

  for (const vote of votes) {
    if (!VALID_CATEGORIES.includes(vote.category)) {
      return { error: `Nieprawidłowa kategoria: ${vote.category}` };
    }
    if (seenCategories.has(vote.category)) {
      return { error: `Zduplikowana kategoria: ${vote.category}` };
    }
    seenCategories.add(vote.category);
    projectIds.add(vote.project_id);

    if (profile.project_id && vote.project_id === profile.project_id) {
      return { error: "Nie możesz głosować na własny projekt." };
    }
  }

  // Validate all project_ids exist and are submitted
  const { data: validProjects } = await supabase
    .from("projects")
    .select("id")
    .in("id", Array.from(projectIds))
    .eq("is_submitted", true);

  if (!validProjects || validProjects.length !== projectIds.size) {
    return { error: "Jeden lub więcej wybranych projektów jest nieprawidłowy." };
  }

  // Check for existing votes
  const { data: existingVotes } = await supabase
    .from("votes")
    .select("id")
    .eq("voter_id", user.id)
    .limit(1);

  if (existingVotes && existingVotes.length > 0) {
    return { error: "Twoje głosy zostały już oddane." };
  }

  const rows = votes.map((v) => ({
    voter_id: user.id,
    project_id: v.project_id,
    category: v.category,
  }));

  const { error: insertError } = await supabase.from("votes").insert(rows);

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "Twoje głosy zostały już oddane." };
    }
    return { error: "Nie udało się oddać głosów. Spróbuj ponownie." };
  }

  return { success: true };
}
