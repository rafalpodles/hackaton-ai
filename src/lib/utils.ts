import { createClient } from "@/lib/supabase/server";
import type { Profile, AppSettings } from "@/lib/types";

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();
  return data!;
}
