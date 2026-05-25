import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export async function requireAdmin(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Brak dostępu");
  return user;
}

export async function requireParticipant(hackathonId: string): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Musisz być zalogowany");
  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();
  if (!participant) throw new Error("Nie jesteś uczestnikiem tego hackathonu");
  return user;
}
