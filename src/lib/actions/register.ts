"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const EMAIL_REGEX = /^[a-zA-Z]{1,4}@(spyro-soft\.com|vm\.spyro-soft\.com)$/;
const MAX_ATTEMPTS_PER_HOUR = 5;

export async function registerUser(email: string, password: string) {
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Nieprawidłowy email. Wymagany format: akronim@spyro-soft.com lub akronim@vm.spyro-soft.com" };
  }

  if (!password || password.length < 6) {
    return { error: "Hasło musi mieć co najmniej 6 znaków." };
  }

  const supabase = await createClient();

  // Rate limit check
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const { count } = await supabase
    .from("registration_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", new Date(Date.now() - 3600000).toISOString());

  if ((count ?? 0) >= MAX_ATTEMPTS_PER_HOUR) {
    return { error: "Zbyt wiele prób rejestracji. Spróbuj ponownie za godzinę." };
  }

  // Record attempt
  await supabase.from("registration_attempts").insert({ ip_address: ip });

  // Check if email already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (existingProfile) {
    return { error: "Konto z tym adresem email już istnieje." };
  }

  // Create user (email_confirm: true skips email verification)
  const { error } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      return { error: "Konto z tym adresem email już istnieje." };
    }
    return { error: "Nie udało się utworzyć konta. Spróbuj ponownie." };
  }

  return { success: true };
}
