"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nie jesteś zalogowany");
  return { supabase, user };
}

/** Get the project ID for the current user within a hackathon */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserProjectId(supabase: any, userId: string, hackathonId: string) {
  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("project_id, team_id, is_solo")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", userId)
    .single();

  if (!participant) throw new Error("Nie jesteś uczestnikiem tego hackathonu");

  // Solo user
  if (participant.is_solo && !participant.team_id) {
    return { projectId: participant.project_id, isSolo: true, teamId: null, isLeader: true };
  }

  // Team member
  if (participant.team_id) {
    const { data: team } = await supabase
      .from("teams")
      .select("project_id, leader_id")
      .eq("id", participant.team_id)
      .single();

    return {
      projectId: team?.project_id ?? null,
      isSolo: false,
      teamId: participant.team_id,
      isLeader: team?.leader_id === userId,
    };
  }

  return { projectId: null, isSolo: false, teamId: null, isLeader: false };
}

export async function createProject(name: string, hackathonId: string) {
  if (!name?.trim()) throw new Error("Nazwa projektu jest wymagana");

  const { supabase, user } = await getAuthUser();
  const ctx = await getUserProjectId(supabase, user.id, hackathonId);

  if (ctx.projectId) throw new Error("Już masz projekt");

  if (!ctx.isSolo && !ctx.isLeader) {
    throw new Error("Tylko lider zespołu może utworzyć projekt");
  }

  const projectId = crypto.randomUUID();

  const { error } = await supabase
    .from("projects")
    .insert({ id: projectId, name: name.trim(), description: "", idea_origin: "", journey: "", hackathon_id: hackathonId });

  if (error) throw new Error(`Nie udało się utworzyć projektu: ${error.message}`);

  if (ctx.isSolo) {
    await supabase
      .from("hackathon_participants")
      .update({ project_id: projectId })
      .eq("hackathon_id", hackathonId)
      .eq("user_id", user.id);
  } else if (ctx.teamId) {
    await supabase
      .from("teams")
      .update({ project_id: projectId })
      .eq("id", ctx.teamId);
  }

  revalidatePath("/");
}

export async function updateProject(
  projectId: string,
  hackathonId: string,
  data: {
    name?: string;
    description?: string;
    idea_origin?: string;
    journey?: string;
    tech_stack?: string[];
    video_url?: string | null;
    video_duration?: number | null;
    pdf_url?: string | null;
    thumbnail_url?: string | null;
    repo_url?: string | null;
  }
) {
  const { supabase, user } = await getAuthUser();
  const ctx = await getUserProjectId(supabase, user.id, hackathonId);

  if (ctx.projectId !== projectId) {
    throw new Error("Nie jesteś członkiem tego projektu");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("is_submitted")
    .eq("id", projectId)
    .single();

  if (project?.is_submitted) {
    throw new Error("Nie można edytować zgłoszonego projektu");
  }

  const allowed = {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.idea_origin !== undefined && { idea_origin: data.idea_origin }),
    ...(data.journey !== undefined && { journey: data.journey }),
    ...(data.tech_stack !== undefined && { tech_stack: data.tech_stack }),
    ...(data.video_url !== undefined && { video_url: data.video_url }),
    ...(data.video_duration !== undefined && { video_duration: data.video_duration }),
    ...(data.pdf_url !== undefined && { pdf_url: data.pdf_url }),
    ...(data.thumbnail_url !== undefined && { thumbnail_url: data.thumbnail_url }),
    ...(data.repo_url !== undefined && { repo_url: data.repo_url }),
  };

  const { error } = await supabase
    .from("projects")
    .update(allowed)
    .eq("id", projectId);

  if (error) throw new Error("Nie udało się zaktualizować projektu");

  revalidatePath("/");
}

export async function submitProject(projectId: string, hackathonId: string) {
  const { supabase, user } = await getAuthUser();
  const ctx = await getUserProjectId(supabase, user.id, hackathonId);

  if (ctx.projectId !== projectId) {
    throw new Error("Nie jesteś członkiem tego projektu");
  }

  if (!ctx.isSolo && !ctx.isLeader) {
    throw new Error("Tylko lider zespołu może zgłosić projekt");
  }

  // Check hackathon allows submissions
  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("submission_open, submission_deadline")
    .eq("id", hackathonId)
    .single();

  if (!hackathon) throw new Error("Nie znaleziono hackathonu");
  if (!hackathon.submission_open) throw new Error("Zgłoszenia są zamknięte");
  if (hackathon.submission_deadline && new Date(hackathon.submission_deadline) < new Date()) {
    throw new Error("Termin zgłoszeń minął");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("name, description, video_url, is_submitted")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Nie znaleziono projektu");
  if (project.is_submitted) throw new Error("Projekt został już zgłoszony");

  if (!project.name?.trim()) throw new Error("Nazwa projektu jest wymagana");
  if (!project.description?.trim()) throw new Error("Opis projektu jest wymagany");
  if (project.description.length > 5000) throw new Error("Opis jest za długi (maks. 5000 znaków)");
  if (!project.video_url) throw new Error("Wideo demo jest wymagane");

  const { error } = await supabase
    .from("projects")
    .update({ is_submitted: true })
    .eq("id", projectId);

  if (error) throw new Error("Nie udało się zgłosić projektu");

  revalidatePath("/");
}

export async function leaveProject(hackathonId: string) {
  const { supabase, user } = await getAuthUser();

  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("project_id, is_solo")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();

  if (!participant?.is_solo || !participant.project_id) {
    throw new Error("Nie masz projektu solo do opuszczenia");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("is_submitted")
    .eq("id", participant.project_id)
    .single();

  if (project?.is_submitted) {
    throw new Error("Nie można opuścić zgłoszonego projektu");
  }

  await supabase
    .from("hackathon_participants")
    .update({ project_id: null })
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id);

  revalidatePath("/");
}
