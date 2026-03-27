"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name, description: "", idea_origin: "", journey: "" })
    .select("id")
    .single();

  if (error || !project) throw new Error("Failed to create project");

  await supabase
    .from("profiles")
    .update({ project_id: project.id })
    .eq("id", user.id);

  revalidatePath("/");
  redirect("/my-project");
}

export async function joinProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("profiles")
    .update({ project_id: projectId })
    .eq("id", user.id);

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
  if (!user) throw new Error("Not authenticated");

  // Gate: only allow updates if not yet submitted
  const { data: project } = await supabase
    .from("projects")
    .select("is_submitted")
    .eq("id", projectId)
    .single();

  if (project?.is_submitted) {
    throw new Error("Cannot update a submitted project");
  }

  await supabase.from("projects").update(data).eq("id", projectId);

  revalidatePath("/my-project");
}

export async function submitProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: project } = await supabase
    .from("projects")
    .select("name, description, video_url")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  if (!project.name || !project.description || !project.video_url) {
    throw new Error(
      "Missing required fields: name, description, and video_url are required"
    );
  }

  await supabase
    .from("projects")
    .update({ is_submitted: true })
    .eq("id", projectId);

  revalidatePath("/my-project");
}

export async function leaveProject() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("profiles")
    .update({ project_id: null })
    .eq("id", user.id);

  revalidatePath("/");
  redirect("/onboarding");
}
