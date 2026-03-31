import ExcelJS from "exceljs";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const EXCEL_PATH = "/Users/rpo/Documents/hackaton.xlsx";
const APP_URL = "https://spyrosoft-ai-hackaton.up.railway.app";

interface UserRow {
  fullName: string;
  firstName: string;
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
      typeof emailCell === "object" &&
      emailCell !== null &&
      "result" in emailCell
        ? String((emailCell as { result: string }).result)
        : String(emailCell || "");
    const password = String(row.getCell(7).value || "").trim();

    if (fullName && email && password) {
      const firstName = fullName.split(" ")[0];
      users.push({ fullName, firstName, email: email.trim(), password });
    }
  });

  return users;
}

function buildEmailBody(user: UserRow): string {
  return `Cześć ${user.firstName}!

Zapraszam Cię na Spyrosoft AI Hackathon — 3h warsztat, gdzie budujesz realne narzędzia z pomocą AI.

🗓 9 kwietnia | 15:00–19:00
📍 Szczegóły i zasady na platformie

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Platforma: ${APP_URL}
📧 Login: ${user.email}
🔑 Tymczasowe hasło: ${user.password}

Przy pierwszym logowaniu zostaniesz poproszony o zmianę hasła.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Co zrobić po zalogowaniu:
1. Przeczytaj Garage Rules — zasady hackathonu
2. Przejdź Poradnik — skonfiguruj narzędzia AI
3. Stwórz zespół (2-3 osoby) lub pracuj solo
4. Stwórz projekt i hackuj!

Nie masz subskrypcji AI? W profilu możesz poprosić o klucz API ($5 na tokeny OpenRouter).

Do zobaczenia! 🚀
`;
}

function sendViaOutlook(to: string, subject: string, body: string): void {
  const escapedSubject = subject.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const escapedTo = to.replace(/"/g, '\\"');

  // Outlook needs full HTML document for proper rendering
  const htmlLines = body
    .split("\n")
    .map((line) => {
      // Escape HTML entities
      const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return escaped || "&nbsp;";
    })
    .join("<br>");

  const htmlBody = `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #333;">${htmlLines}</body></html>`;

  // Escape for AppleScript string
  const asBody = htmlBody.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const appleScript = `tell application "Microsoft Outlook"
  set newMsg to make new outgoing message with properties {subject:"${escapedSubject}", content:"${asBody}"}
  make new to recipient at newMsg with properties {email address:{address:"${escapedTo}"}}
  send newMsg
end tell
`;

  const tmpFile = join(tmpdir(), `hackathon-mail-${Date.now()}.scpt`);
  writeFileSync(tmpFile, appleScript);
  try {
    execSync(`osascript "${tmpFile}"`, { timeout: 30000 });
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const testEmail = args.find((a) => a.startsWith("--test="))?.split("=")[1];

  const users = await loadUsersFromExcel();

  if (users.length === 0) {
    console.log("No users found in Excel.");
    return;
  }

  console.log(`Found ${users.length} users in Excel.\n`);

  if (dryRun) {
    console.log("=== DRY RUN — no emails will be sent ===\n");
    const sample = users[0];
    console.log(`Subject: Spyrosoft AI Hackathon — Twoje zaproszenie`);
    console.log(`To: ${sample.email}`);
    console.log(`---`);
    console.log(buildEmailBody(sample));
    console.log(`\n=== Would send to ${users.length} users ===`);
    return;
  }

  if (testEmail) {
    const testUser = users.find((u) => u.email === testEmail) || users[0];
    const target = { ...testUser, email: testEmail };
    console.log(`Sending TEST email to ${testEmail}...`);
    sendViaOutlook(
      target.email,
      "Spyrosoft AI Hackathon — Twoje zaproszenie",
      buildEmailBody(target)
    );
    console.log(`✓ Test email sent to ${testEmail}`);
    return;
  }

  // Confirm before sending to all
  console.log(`About to send ${users.length} emails via Outlook.`);
  console.log(`Press Ctrl+C within 5 seconds to cancel...\n`);
  await new Promise((r) => setTimeout(r, 5000));

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      sendViaOutlook(
        user.email,
        "Spyrosoft AI Hackathon — Twoje zaproszenie",
        buildEmailBody(user)
      );
      console.log(`✓ ${user.fullName} (${user.email})`);
      sent++;
      // Small delay between emails to avoid throttling
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(
        `✗ ${user.email}: ${err instanceof Error ? err.message : err}`
      );
      failed++;
    }
  }

  console.log(`\nDone! ${sent} sent, ${failed} failed.`);
}

main();
