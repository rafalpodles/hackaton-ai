import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

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

const EXCEL_PATH = "/Users/rpo/Documents/hackaton.xlsx";

interface UserRow {
  fullName: string;
  email: string;
  password: string;
}

async function loadUsersFromExcel(): Promise<UserRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const ws = wb.worksheets[0];
  const users: UserRow[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const fullName = String(row.getCell(2).value || "").trim();
    const emailCell = row.getCell(4).value;
    const email =
      typeof emailCell === "object" && emailCell !== null && "result" in emailCell
        ? String((emailCell as { result: string }).result)
        : String(emailCell || "");
    const password = String(row.getCell(7).value || "").trim();

    if (fullName && email && password) {
      users.push({ fullName, email: email.trim(), password });
    }
  });

  return users;
}

async function main() {
  const users = await loadUsersFromExcel();

  if (users.length === 0) {
    console.log("No users found in Excel file.");
    return;
  }

  console.log(`Creating ${users.length} users from ${EXCEL_PATH}...\n`);

  let success = 0;
  let failed = 0;

  for (const { fullName, email, password } of users) {
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

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
      failed++;
      continue;
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
        console.warn(`  ⚠ ${email}: created but profile update failed: ${profileError.message}`);
      }
    }

    console.log(`✓ ${fullName} (${email}): created`);
    success++;
  }

  console.log(`\nDone! ${success} created, ${failed} failed.`);
}

main();
