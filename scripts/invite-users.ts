import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SECRET_DEFAULT_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_DEFAULT_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const emails: string[] = [
  "rpo@spyro-soft.com",
];

async function main() {
  if (emails.length === 0) {
    console.log("No emails to invite. Add emails to the array in this script.");
    return;
  }

  console.log(`Inviting ${emails.length} users...\n`);

  let success = 0;
  let failed = 0;

  for (const email of emails) {
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://spyrosoft-ai-hackaton.up.railway.app"}/auth/callback`,
    });

    if (error) {
      console.error(`✗ ${email}: ${error.message}`);
      failed++;
    } else {
      console.log(`✓ ${email}: invited`);
      success++;
    }
  }

  console.log(`\nDone! ${success} invited, ${failed} failed.`);
}

main();
