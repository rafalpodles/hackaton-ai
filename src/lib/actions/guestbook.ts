"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addGuestbookEntry(authorName: string, message: string) {
  if (!authorName.trim() || !message.trim()) {
    throw new Error("Name and message are required");
  }
  if (message.length > 500) {
    throw new Error("Message too long");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("guestbook")
    .insert({ author_name: authorName.trim(), message: message.trim() });

  if (error) throw new Error("Failed to add guestbook entry");
  revalidatePath("/guestbook");
}

export async function getGuestbookEntries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guestbook")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error("Failed to load guestbook");
  return data ?? [];
}
