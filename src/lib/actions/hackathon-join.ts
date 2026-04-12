"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function joinHackathon(hackathonId: string) {
  const supabase = await createClient();

  // Get auth user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check hackathon exists and status !== "finished"
  const { data: hackathon, error: hackathonError } = await supabase
    .from("hackathons")
    .select("id, slug, status")
    .eq("id", hackathonId)
    .single();

  if (hackathonError || !hackathon) {
    throw new Error("Hackathon not found");
  }

  if (hackathon.status === "finished") {
    throw new Error("Cannot join a finished hackathon");
  }

  // Check not already participant
  const { data: existing } = await supabase
    .from("hackathon_participants")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    redirect(`/h/${hackathon.slug}/onboarding`);
  }

  // Insert hackathon_participants row
  const { error: insertError } = await supabase
    .from("hackathon_participants")
    .insert({
      hackathon_id: hackathonId,
      user_id: user.id,
      role: "participant",
      is_solo: false,
    });

  if (insertError) {
    throw new Error(`Failed to join hackathon: ${insertError.message}`);
  }

  revalidatePath("/");
  redirect(`/h/${hackathon.slug}/onboarding`);
}
