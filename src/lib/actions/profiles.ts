"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(data: {
  display_name?: string;
  avatar_url?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nie jesteś zalogowany");

  const allowed: Record<string, string> = {};

  if (data.display_name !== undefined) {
    const name = data.display_name.trim();
    if (!name) throw new Error("Nazwa nie może być pusta");
    if (name.length > 100) throw new Error("Nazwa jest za długa");
    allowed.display_name = name;
  }

  if (data.avatar_url !== undefined) {
    allowed.avatar_url = data.avatar_url;
  }

  if (Object.keys(allowed).length === 0) {
    throw new Error("Brak pól do aktualizacji");
  }

  const { error } = await supabase
    .from("profiles")
    .update(allowed)
    .eq("id", user.id);

  if (error) throw new Error("Nie udało się zaktualizować profilu");

  revalidatePath("/profile");
  revalidatePath("/");
}
