"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MAX_TEAM_SIZE = 5;

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nie jesteś zalogowany");
  return { supabase, user };
}

export async function createTeam(name: string, hackathonId: string) {
  if (!name?.trim()) throw new Error("Nazwa zespołu jest wymagana");

  const { supabase, user } = await getAuthUser();

  // Check participant exists and doesn't already have a team
  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("team_id, is_solo, project_id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();

  if (!participant) throw new Error("Nie jesteś uczestnikiem tego hackathonu");
  if (participant.team_id) throw new Error("Już należysz do zespołu");

  // Check name uniqueness within the hackathon
  const { data: existing } = await supabase
    .from("teams")
    .select("id")
    .eq("name", name.trim())
    .eq("hackathon_id", hackathonId)
    .single();

  if (existing) throw new Error("Zespół o tej nazwie już istnieje");

  const teamId = crypto.randomUUID();

  const { error } = await supabase
    .from("teams")
    .insert({ id: teamId, name: name.trim(), leader_id: user.id, hackathon_id: hackathonId });

  if (error) throw new Error(`Nie udało się utworzyć zespołu: ${error.message}`);

  // Clean up solo project if user was solo
  if (participant.is_solo && participant.project_id) {
    const { data: soloProject } = await supabase
      .from("projects")
      .select("is_submitted")
      .eq("id", participant.project_id)
      .single();

    if (soloProject?.is_submitted) {
      throw new Error("Nie możesz założyć zespołu — Twój projekt solo jest już zatwierdzony.");
    }

    await supabase.from("projects").delete().eq("id", participant.project_id);
  }

  await supabase
    .from("hackathon_participants")
    .update({ team_id: teamId, is_solo: false, project_id: null })
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id);

  revalidatePath("/");
  redirect("/team");
}

export async function goSolo(hackathonId: string) {
  const { supabase, user } = await getAuthUser();

  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("team_id, is_solo")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();

  if (!participant) throw new Error("Nie jesteś uczestnikiem tego hackathonu");
  if (participant.team_id) throw new Error("Najpierw opuść zespół");

  await supabase
    .from("hackathon_participants")
    .update({ is_solo: true })
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id);

  // Delete any pending requests
  await supabase
    .from("team_requests")
    .delete()
    .eq("user_id", user.id);

  revalidatePath("/");
  redirect("/my-project");
}

export async function requestJoinTeam(teamId: string) {
  const { supabase, user } = await getAuthUser();

  // Get team to find hackathon_id
  const { data: team } = await supabase
    .from("teams")
    .select("id, hackathon_id")
    .eq("id", teamId)
    .single();

  if (!team) throw new Error("Nie znaleziono zespołu");

  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("team_id, is_solo, project_id")
    .eq("hackathon_id", team.hackathon_id)
    .eq("user_id", user.id)
    .single();

  if (!participant) throw new Error("Nie jesteś uczestnikiem tego hackathonu");
  if (participant.team_id) throw new Error("Już należysz do zespołu");

  // Block if solo user has a submitted project
  if (participant.is_solo && participant.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("is_submitted")
      .eq("id", participant.project_id)
      .single();

    if (project?.is_submitted) {
      throw new Error("Nie możesz dołączyć do zespołu — Twój projekt solo jest już zatwierdzony.");
    }
  }

  // Check team has room
  const { data: members } = await supabase
    .from("hackathon_participants")
    .select("user_id")
    .eq("team_id", teamId);

  if ((members?.length ?? 0) >= MAX_TEAM_SIZE) {
    throw new Error("Zespół jest pełny (max 5 osób)");
  }

  // Check no existing request
  const { data: existingReq } = await supabase
    .from("team_requests")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingReq) throw new Error("Masz już aktywny request. Anuluj go najpierw.");

  const { error } = await supabase
    .from("team_requests")
    .insert({ user_id: user.id, team_id: teamId });

  if (error) throw new Error("Nie udało się wysłać prośby o dołączenie");

  revalidatePath("/");
  revalidatePath("/team");
}

export async function cancelRequest(requestId: string) {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("team_requests")
    .delete()
    .eq("id", requestId)
    .eq("user_id", user.id);

  if (error) throw new Error("Nie udało się anulować prośby");

  revalidatePath("/team");
  revalidatePath("/onboarding");
}

export async function approveRequest(requestId: string) {
  const { supabase, user } = await getAuthUser();

  // Get request
  const { data: request } = await supabase
    .from("team_requests")
    .select("id, user_id, team_id")
    .eq("id", requestId)
    .single();

  if (!request) throw new Error("Nie znaleziono prośby");

  // Verify current user is team leader
  const { data: team } = await supabase
    .from("teams")
    .select("id, leader_id, hackathon_id")
    .eq("id", request.team_id)
    .single();

  if (!team || team.leader_id !== user.id) {
    throw new Error("Nie jesteś liderem tego zespołu");
  }

  // Check team size
  const { data: members } = await supabase
    .from("hackathon_participants")
    .select("user_id")
    .eq("team_id", team.id);

  if ((members?.length ?? 0) >= MAX_TEAM_SIZE) {
    // Delete request and throw
    await supabase.from("team_requests").delete().eq("id", requestId);
    throw new Error("Zespół jest pełny (max 5 osób)");
  }

  // Check if joining user has a solo project to clean up
  const { data: joiningParticipant } = await supabase
    .from("hackathon_participants")
    .select("project_id, is_solo")
    .eq("hackathon_id", team.hackathon_id)
    .eq("user_id", request.user_id)
    .single();

  if (joiningParticipant?.is_solo && joiningParticipant.project_id) {
    // Check if project is submitted — block if so
    const { data: soloProject } = await supabase
      .from("projects")
      .select("is_submitted")
      .eq("id", joiningParticipant.project_id)
      .single();

    if (soloProject?.is_submitted) {
      throw new Error("Ten użytkownik ma zatwierdzony projekt solo i nie może dołączyć.");
    }

    // Delete unsubmitted solo project
    await supabase
      .from("projects")
      .delete()
      .eq("id", joiningParticipant.project_id);
  }

  // Add user to team, clear solo status and project
  await supabase
    .from("hackathon_participants")
    .update({ team_id: team.id, is_solo: false, project_id: null })
    .eq("hackathon_id", team.hackathon_id)
    .eq("user_id", request.user_id);

  // Delete the request
  await supabase
    .from("team_requests")
    .delete()
    .eq("id", requestId);

  // Delete any other pending requests from this user
  await supabase
    .from("team_requests")
    .delete()
    .eq("user_id", request.user_id);

  revalidatePath("/team");
}

export async function rejectRequest(requestId: string) {
  const { supabase, user } = await getAuthUser();

  const { data: request } = await supabase
    .from("team_requests")
    .select("id, team_id")
    .eq("id", requestId)
    .single();

  if (!request) throw new Error("Nie znaleziono prośby");

  const { data: team } = await supabase
    .from("teams")
    .select("leader_id")
    .eq("id", request.team_id)
    .single();

  if (!team || team.leader_id !== user.id) {
    throw new Error("Nie jesteś liderem tego zespołu");
  }

  await supabase
    .from("team_requests")
    .delete()
    .eq("id", requestId);

  revalidatePath("/team");
}

export async function leaveTeam(hackathonId: string) {
  const { supabase, user } = await getAuthUser();

  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("team_id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();

  if (!participant?.team_id) throw new Error("Nie należysz do żadnego zespołu");

  // Check user is not the leader
  const { data: team } = await supabase
    .from("teams")
    .select("leader_id")
    .eq("id", participant.team_id)
    .single();

  if (team?.leader_id === user.id) {
    throw new Error("Lider nie może opuścić zespołu. Usuń zespół zamiast tego.");
  }

  await supabase
    .from("hackathon_participants")
    .update({ team_id: null, is_solo: false })
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id);

  revalidatePath("/");
  revalidatePath("/team");
  redirect("/onboarding");
}

export async function removeMember(memberId: string, hackathonId: string) {
  const { supabase, user } = await getAuthUser();

  // Get current user's team and verify leadership
  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("team_id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();

  if (!participant?.team_id) throw new Error("Nie należysz do żadnego zespołu");

  const { data: team } = await supabase
    .from("teams")
    .select("leader_id")
    .eq("id", participant.team_id)
    .single();

  if (!team || team.leader_id !== user.id) {
    throw new Error("Nie jesteś liderem tego zespołu");
  }

  if (memberId === user.id) {
    throw new Error("Nie możesz usunąć siebie");
  }

  // Remove member
  await supabase
    .from("hackathon_participants")
    .update({ team_id: null })
    .eq("hackathon_id", hackathonId)
    .eq("user_id", memberId)
    .eq("team_id", participant.team_id);

  revalidatePath("/team");
}

export async function deleteTeam(hackathonId: string) {
  const { supabase, user } = await getAuthUser();

  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("team_id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();

  if (!participant?.team_id) throw new Error("Nie należysz do żadnego zespołu");

  const { data: team } = await supabase
    .from("teams")
    .select("id, leader_id, project_id")
    .eq("id", participant.team_id)
    .single();

  if (!team || team.leader_id !== user.id) {
    throw new Error("Nie jesteś liderem tego zespołu");
  }

  // Delete unsubmitted project (submitted projects stay for voting history)
  if (team.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("is_submitted")
      .eq("id", team.project_id)
      .single();

    if (project && !project.is_submitted) {
      await supabase.from("projects").delete().eq("id", team.project_id);
    }
  }

  // Remove all members from team (clear team_id on participants)
  await supabase
    .from("hackathon_participants")
    .update({ team_id: null })
    .eq("hackathon_id", hackathonId)
    .eq("team_id", team.id);

  // Delete pending requests
  await supabase
    .from("team_requests")
    .delete()
    .eq("team_id", team.id);

  // Delete team
  await supabase
    .from("teams")
    .delete()
    .eq("id", team.id);

  revalidatePath("/");
  redirect("/onboarding");
}
