"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject(name: string) {
  if (!name?.trim()) throw new Error("Nazwa projektu jest wymagana");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nie jesteś zalogowany");

  // Check user doesn't already have a project
  const { data: profile } = await supabase
    .from("profiles")
    .select("project_id")
    .eq("id", user.id)
    .single();

  if (profile?.project_id) {
    throw new Error("Już należysz do projektu");
  }

  const projectId = crypto.randomUUID();

  const { error } = await supabase
    .from("projects")
    .insert({ id: projectId, name: name.trim(), description: "", idea_origin: "", journey: "" });

  if (error) throw new Error(`Nie udało się utworzyć projektu: ${error.message}`);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ project_id: projectId })
    .eq("id", user.id);

  if (updateError) throw new Error("Nie udało się przypisać Cię do projektu");

  revalidatePath("/");
  redirect("/my-project");
}

export async function joinProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nie jesteś zalogowany");

  // Check user doesn't already have a project
  const { data: profile } = await supabase
    .from("profiles")
    .select("project_id")
    .eq("id", user.id)
    .single();

  if (profile?.project_id) {
    throw new Error("Już należysz do projektu. Najpierw go opuść.");
  }

  // Check project exists and is not yet submitted (open for joining)
  const { data: project } = await supabase
    .from("projects")
    .select("id, is_submitted")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Nie znaleziono projektu");
  if (project.is_submitted) throw new Error("Nie można dołączyć do zgłoszonego projektu");

  const { error } = await supabase
    .from("profiles")
    .update({ project_id: projectId })
    .eq("id", user.id);

  if (error) throw new Error("Nie udało się dołączyć do projektu");

  revalidatePath("/");
  redirect("/my-project");
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nie jesteś zalogowany");

  const { data: profile } = await supabase
    .from("profiles")
    .select("project_id")
    .eq("id", user.id)
    .single();

  if (profile?.project_id !== projectId) {
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

  // Only allow known fields
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nie jesteś zalogowany");

  const { data: profile } = await supabase
    .from("profiles")
    .select("project_id")
    .eq("id", user.id)
    .single();

  if (profile?.project_id !== projectId) {
    throw new Error("Nie jesteś członkiem tego projektu");
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nie jesteś zalogowany");

  // Check project isn't submitted
  const { data: profile } = await supabase
    .from("profiles")
    .select("project_id")
    .eq("id", user.id)
    .single();

  if (profile?.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("is_submitted")
      .eq("id", profile.project_id)
      .single();

    if (project?.is_submitted) {
      throw new Error("Nie można opuścić zgłoszonego projektu");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ project_id: null })
    .eq("id", user.id);

  if (error) throw new Error("Nie udało się opuścić projektu");

  revalidatePath("/");
  redirect("/onboarding");
}
