"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nie jesteś zalogowany");
  return { supabase, user };
}

/** Get the project ID for the current user (from team or solo) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserProjectId(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("project_id, team_id, is_solo")
    .eq("id", userId)
    .single();

  if (!profile) throw new Error("Nie znaleziono profilu");

  // Solo user → uses profile.project_id
  if (profile.is_solo && !profile.team_id) {
    return { projectId: profile.project_id, isSolo: true, teamId: null };
  }

  // Team member → uses team.project_id
  if (profile.team_id) {
    const { data: team } = await supabase
      .from("teams")
      .select("project_id, leader_id")
      .eq("id", profile.team_id)
      .single();

    return {
      projectId: team?.project_id ?? null,
      isSolo: false,
      teamId: profile.team_id,
      isLeader: team?.leader_id === userId,
    };
  }

  return { projectId: null, isSolo: false, teamId: null };
}

export async function createProject(name: string) {
  if (!name?.trim()) throw new Error("Nazwa projektu jest wymagana");

  const { supabase, user } = await getAuthUser();
  const ctx = await getUserProjectId(supabase, user.id);

  if (ctx.projectId) throw new Error("Już masz projekt");

  const projectId = crypto.randomUUID();

  const { error } = await supabase
    .from("projects")
    .insert({ id: projectId, name: name.trim(), description: "", idea_origin: "", journey: "" });

  if (error) throw new Error(`Nie udało się utworzyć projektu: ${error.message}`);

  if (ctx.isSolo) {
    await supabase
      .from("profiles")
      .update({ project_id: projectId })
      .eq("id", user.id);
  } else if (ctx.teamId) {
    await supabase
      .from("teams")
      .update({ project_id: projectId })
      .eq("id", ctx.teamId);
  }

  revalidatePath("/");
  revalidatePath("/my-project");
}

export async function updateProject(
  projectId: string,
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
  }
) {
  const { supabase, user } = await getAuthUser();
  const ctx = await getUserProjectId(supabase, user.id);

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
  };

  const { error } = await supabase
    .from("projects")
    .update(allowed)
    .eq("id", projectId);

  if (error) throw new Error("Nie udało się zaktualizować projektu");

  revalidatePath("/my-project");
}

export async function submitProject(projectId: string) {
  const { supabase, user } = await getAuthUser();
  const ctx = await getUserProjectId(supabase, user.id);

  if (ctx.projectId !== projectId) {
    throw new Error("Nie jesteś członkiem tego projektu");
  }

  // Only leader or solo can submit
  if (!ctx.isSolo && !ctx.isLeader) {
    throw new Error("Tylko lider zespołu może zgłosić projekt");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("name, description, video_url, is_submitted")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Nie znaleziono projektu");
  if (project.is_submitted) throw new Error("Projekt został już zgłoszony");

  if (!project.name || !project.description || !project.video_url) {
    throw new Error(
      "Brakuje wymaganych pól: nazwa, opis i wideo są wymagane"
    );
  }

  const { error } = await supabase
    .from("projects")
    .update({ is_submitted: true })
    .eq("id", projectId);

  if (error) throw new Error("Nie udało się zgłosić projektu");

  revalidatePath("/");
  revalidatePath("/my-project");
  redirect("/");
}

export async function leaveProject() {
  const { supabase, user } = await getAuthUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("project_id, is_solo")
    .eq("id", user.id)
    .single();

  if (!profile?.is_solo || !profile.project_id) {
    throw new Error("Nie masz projektu solo do opuszczenia");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("is_submitted")
    .eq("id", profile.project_id)
    .single();

  if (project?.is_submitted) {
    throw new Error("Nie można opuścić zgłoszonego projektu");
  }

  await supabase
    .from("profiles")
    .update({ project_id: null })
    .eq("id", user.id);

  revalidatePath("/");
  revalidatePath("/my-project");
}
