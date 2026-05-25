/**
 * Backfill: Seed default content (rules, faq, ideas, prompts) for all existing hackathons.
 *
 * Skips content that already exists — safe to run multiple times.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SECRET_DEFAULT_KEY=... npx tsx scripts/backfill-content.ts
 */

import { createClient } from "@supabase/supabase-js";
import { seedHackathonContent } from "../src/lib/defaults/seed";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_DEFAULT_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_DEFAULT_KEY");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const { data: hackathons, error } = await supabase.from("hackathons").select("id, slug, name");
  if (error || !hackathons) {
    console.error("Failed to load hackathons:", error);
    process.exit(1);
  }

  for (const h of hackathons) {
    console.log(`Seeding content for "${h.name}" (${h.slug})...`);
    const result = await seedHackathonContent(supabase, h.id);
    console.log(`  rules=${result.rules} faq=${result.faq} ideas=${result.ideas} prompts=${result.prompts}`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
