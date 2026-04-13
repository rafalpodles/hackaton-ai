/**
 * Backfill: Add all profiles that are NOT yet in hackathon_participants
 * for hackathon #1 (ai-hackathon-1).
 *
 * DRY RUN by default — pass --execute to actually insert.
 *
 * Usage:
 *   npx tsx scripts/backfill-participants.ts          # dry run
 *   npx tsx scripts/backfill-participants.ts --execute # actually insert
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_DEFAULT_KEY!;
const HACKATHON_SLUG = "ai-hackathon-1";

const execute = process.argv.includes("--execute");

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Get hackathon
  const { data: hackathon, error: hErr } = await supabase
    .from("hackathons")
    .select("id, name, slug, status")
    .eq("slug", HACKATHON_SLUG)
    .single();

  if (hErr || !hackathon) {
    console.error("Hackathon not found:", hErr?.message);
    process.exit(1);
  }

  console.log(`Hackathon: ${hackathon.name} (${hackathon.slug})`);
  console.log(`Status: ${hackathon.status}`);
  console.log(`ID: ${hackathon.id}`);
  console.log();

  // 2. Get all profiles
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, email, display_name");

  if (pErr || !profiles) {
    console.error("Failed to fetch profiles:", pErr?.message);
    process.exit(1);
  }

  // 3. Get existing participants
  const { data: existing, error: eErr } = await supabase
    .from("hackathon_participants")
    .select("user_id")
    .eq("hackathon_id", hackathon.id);

  if (eErr) {
    console.error("Failed to fetch participants:", eErr?.message);
    process.exit(1);
  }

  const existingIds = new Set((existing ?? []).map((e) => e.user_id));

  // 4. Find missing
  const missing = profiles.filter((p) => !existingIds.has(p.id));

  console.log(`Total profiles: ${profiles.length}`);
  console.log(`Already participants: ${existingIds.size}`);
  console.log(`Missing (to be added): ${missing.length}`);
  console.log();

  if (missing.length === 0) {
    console.log("Nothing to do — all profiles are already participants.");
    return;
  }

  // Show who will be added
  console.log("Users to add:");
  for (const m of missing) {
    console.log(`  - ${m.display_name ?? "?"} (${m.email})`);
  }
  console.log();

  if (!execute) {
    console.log("DRY RUN — no changes made. Pass --execute to insert.");
    return;
  }

  // 5. Insert
  const rows = missing.map((m) => ({
    hackathon_id: hackathon.id,
    user_id: m.id,
    role: "participant" as const,
    is_solo: false,
  }));

  const { error: insertErr, count } = await supabase
    .from("hackathon_participants")
    .insert(rows);

  if (insertErr) {
    console.error("Insert failed:", insertErr.message);
    process.exit(1);
  }

  console.log(`Successfully added ${missing.length} participants.`);
}

main();
