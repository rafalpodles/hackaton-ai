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

// Format: { email, firstName, lastName }
const users: { email: string; firstName: string; lastName: string }[] = [
  // Add users here: { email: "user@example.com", firstName: "Jan", lastName: "Kowalski" },
];

async function main() {
  if (users.length === 0) {
    console.log("No users to invite. Add users to the array in this script.");
    return;
  }

  console.log(`Inviting ${users.length} users...\n`);

  let success = 0;
  let failed = 0;

  for (const { email, firstName, lastName } of users) {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://spyrosoft-ai-hackaton.up.railway.app"}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
      },
    });

    if (error) {
      console.error(`✗ ${email}: ${error.message}`);
      failed++;
      continue;
    }

    // Update profile with first/last name
    if (data?.user?.id) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          display_name: `${firstName} ${lastName}`,
        })
        .eq("id", data.user.id);

      if (profileError) {
        console.warn(`  ⚠ ${email}: invited but profile update failed: ${profileError.message}`);
      }
    }

    console.log(`✓ ${firstName} ${lastName} (${email}): invited`);
    success++;
  }

  console.log(`\nDone! ${success} invited, ${failed} failed.`);
}

main();
