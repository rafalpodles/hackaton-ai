"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Brak dostępu");
  return user;
}

export async function createHackathon(data: {
  name: string;
  slug: string;
  description: string;
  hackathon_date: string | null;
}) {
  await requireAdmin();
  const supabase = await createClient();

  const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  const { error } = await supabase.from("hackathons").insert({
    name: data.name,
    slug,
    description: data.description,
    hackathon_date: data.hackathon_date,
  });

  if (error) {
    if (error.message.includes("duplicate")) throw new Error("Slug jest już zajęty");
    throw new Error("Nie udało się utworzyć hackathonu");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/");
}

export async function updateHackathon(hackathonId: string, data: Partial<{
  name: string;
  description: string;
  hackathon_date: string | null;
  submission_deadline: string | null;
  submission_open: boolean;
  voting_open: boolean;
  survey_open: boolean;
  status: string;
}>) {
  await requireAdmin();
  const supabase = await createClient();

  const allowed = {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.hackathon_date !== undefined && { hackathon_date: data.hackathon_date }),
    ...(data.submission_deadline !== undefined && { submission_deadline: data.submission_deadline }),
    ...(data.submission_open !== undefined && { submission_open: data.submission_open }),
    ...(data.voting_open !== undefined && { voting_open: data.voting_open }),
    ...(data.survey_open !== undefined && { survey_open: data.survey_open }),
    ...(data.status !== undefined && { status: data.status }),
  };

  const { error } = await supabase
    .from("hackathons")
    .update(allowed)
    .eq("id", hackathonId);

  if (error) throw new Error("Nie udało się zaktualizować hackathonu");
  revalidatePath("/", "layout");
}

export async function addHackathonCategory(hackathonId: string, slug: string, label: string, displayOrder: number) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("hackathon_categories").insert({
    hackathon_id: hackathonId,
    slug: slug.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    label,
    display_order: displayOrder,
  });

  if (error) throw new Error("Nie udało się dodać kategorii");
  revalidatePath("/", "layout");
}

export async function removeHackathonCategory(categoryId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("hackathon_categories").delete().eq("id", categoryId);
  if (error) throw new Error("Nie udało się usunąć kategorii");
  revalidatePath("/", "layout");
}

export async function delegateHackathonAdmin(hackathonId: string, userId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("hackathon_participants")
    .update({ role: "admin" })
    .eq("hackathon_id", hackathonId)
    .eq("user_id", userId);

  if (error) throw new Error("Nie udało się przypisać admina");
  revalidatePath("/", "layout");
}

export async function revokeHackathonAdmin(hackathonId: string, userId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("hackathon_participants")
    .update({ role: "participant" })
    .eq("hackathon_id", hackathonId)
    .eq("user_id", userId);

  if (error) throw new Error("Nie udało się odebrać uprawnień admina");
  revalidatePath("/", "layout");
}
