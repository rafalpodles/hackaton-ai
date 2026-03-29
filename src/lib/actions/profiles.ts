"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(data: {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nie jesteś zalogowany");

  const allowed: Record<string, string | null> = {};

  if (data.first_name !== undefined || data.last_name !== undefined) {
    // Fetch current values to compute display_name
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const firstName = (data.first_name ?? profile?.first_name ?? "").trim();
    const lastName = (data.last_name ?? profile?.last_name ?? "").trim();

    if (data.first_name !== undefined) {
      if (!firstName) throw new Error("Imię nie może być puste");
      allowed.first_name = firstName;
    }
    if (data.last_name !== undefined) {
      if (!lastName) throw new Error("Nazwisko nie może być puste");
      allowed.last_name = lastName;
    }

    // Auto-update display_name
    if (firstName || lastName) {
      allowed.display_name = [firstName, lastName].filter(Boolean).join(" ");
    }
  }

  if (data.display_name !== undefined && !("display_name" in allowed)) {
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
