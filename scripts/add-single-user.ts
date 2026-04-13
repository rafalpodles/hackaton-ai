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

const fullName = "Lechu";
const email = "lpa@spyro-soft.com";
const password = "Lechu123";

async function main() {
  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ");

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      display_name: fullName,
      must_change_password: true,
    },
  });

  if (error) {
    console.error(`✗ ${email}: ${error.message}`);
    process.exit(1);
  }

  if (data?.user?.id) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        display_name: fullName,
      })
      .eq("id", data.user.id);

    if (profileError) {
      console.warn(`⚠ profile update failed: ${profileError.message}`);
    }
  }

  console.log(`✓ ${fullName} (${email}): created`);
}

main();
