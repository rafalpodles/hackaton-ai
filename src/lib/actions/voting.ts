"use server";

import { createClient } from "@/lib/supabase/server";

interface CastVoteInput {
  category: string;
  project_id: string;
}

export async function castVotes(votes: CastVoteInput[], hackathonId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Musisz być zalogowany, aby głosować." };
  }

  // Check voting is open
  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("voting_open")
    .eq("id", hackathonId)
    .single();

  if (!hackathon?.voting_open) {
    return { error: "Głosowanie nie jest jeszcze otwarte." };
  }

  // Load valid categories for this hackathon
  const { data: categories } = await supabase
    .from("hackathon_categories")
    .select("slug")
    .eq("hackathon_id", hackathonId);

  const validSlugs = new Set((categories ?? []).map((c) => c.slug));

  // Get own project from hackathon_participants
  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("project_id, team_id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return { error: "Nie jesteś uczestnikiem tego hackathonu." };
  }

  // Determine own project (solo or team)
  let ownProjectId = participant.project_id;
  if (participant.team_id) {
    const { data: team } = await supabase
      .from("teams")
      .select("project_id")
      .eq("id", participant.team_id)
      .single();
    ownProjectId = team?.project_id ?? null;
  }

  // Validate votes structure
  if (!Array.isArray(votes) || votes.length !== validSlugs.size) {
    return { error: `Musisz oddać dokładnie ${validSlugs.size} głosów (po jednym na kategorię).` };
  }

  const seenCategories = new Set<string>();
  const projectIds = new Set<string>();

  for (const vote of votes) {
    if (!validSlugs.has(vote.category)) {
      return { error: `Nieprawidłowa kategoria: ${vote.category}` };
    }
    if (seenCategories.has(vote.category)) {
      return { error: `Zduplikowana kategoria: ${vote.category}` };
    }
    seenCategories.add(vote.category);
    projectIds.add(vote.project_id);

    if (ownProjectId && vote.project_id === ownProjectId) {
      return { error: "Nie możesz głosować na własny projekt." };
    }
  }

  // Validate all project_ids exist and are submitted
  const { data: validProjects } = await supabase
    .from("projects")
    .select("id")
    .in("id", Array.from(projectIds))
    .eq("is_submitted", true)
    .eq("hackathon_id", hackathonId);

  if (!validProjects || validProjects.length !== projectIds.size) {
    return { error: "Jeden lub więcej wybranych projektów jest nieprawidłowy." };
  }

  // Check for existing votes in this hackathon
  const { data: existingVotes } = await supabase
    .from("votes")
    .select("id")
    .eq("voter_id", user.id)
    .eq("hackathon_id", hackathonId)
    .limit(1);

  if (existingVotes && existingVotes.length > 0) {
    return { error: "Twoje głosy zostały już oddane." };
  }

  const rows = votes.map((v) => ({
    voter_id: user.id,
    project_id: v.project_id,
    hackathon_id: hackathonId,
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
