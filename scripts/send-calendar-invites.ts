import ExcelJS from "exceljs";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const EXCEL_PATH = "/Users/rpo/Documents/hackaton.xlsx";

async function loadEmailsFromExcel(): Promise<string[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const ws = wb.worksheets[0];
  const emails: string[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const emailCell = row.getCell(4).value;
    const email =
      typeof emailCell === "object" &&
      emailCell !== null &&
      "result" in emailCell
        ? String((emailCell as { result: string }).result)
        : String(emailCell || "");

    const trimmed = email.trim();
    if (trimmed) {
      emails.push(trimmed);
    }
  });

  return emails;
}

function buildIcs(emails: string[]): string {
  const uid = randomUUID();
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const attendees = emails
    .map((e) => `ATTENDEE;RSVP=TRUE;ROLE=REQ-PARTICIPANT:mailto:${e}`)
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Spyrosoft//Hackathon//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    "DTSTART:20260409T150000",
    "DTEND:20260409T190000",
    "SUMMARY:Spyrosoft AI Hackathon",
    "DESCRIPTION:Zapraszam na Hackaton AI.",
    attendees,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function openIcsInOutlook(icsPath: string): void {
  execSync(`open "${icsPath}"`, { timeout: 10000 });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const testEmail = args.find((a) => a.startsWith("--test="))?.split("=")[1];

  const emails = await loadEmailsFromExcel();

  if (emails.length === 0) {
    console.log("No emails found in Excel.");
    return;
  }

  console.log(`Found ${emails.length} attendees in Excel.\n`);

  if (dryRun) {
    console.log("=== DRY RUN — no invite will be sent ===\n");
    console.log(`Subject: Spyrosoft AI Hackathon`);
    console.log(`When: 9 April 2026, 15:00–19:00`);
    console.log(`Attendees: ${emails.join(", ")}`);
    console.log(`---`);
    console.log("Zapraszam na Hackaton AI.");
    console.log(`\n--- ICS preview ---`);
    console.log(buildIcs(dryRun ? emails.slice(0, 3) : emails));
    return;
  }

  const targetEmails = testEmail ? [testEmail] : emails;
  const icsContent = buildIcs(targetEmails);
  const icsPath = join(tmpdir(), `hackathon-${Date.now()}.ics`);
  writeFileSync(icsPath, icsContent);

  console.log(`Opening calendar invite with ${targetEmails.length} attendees in Outlook...`);
  console.log(`ICS file: ${icsPath}`);

  try {
    openIcsInOutlook(icsPath);
    console.log(`\n✓ Meeting opened in Outlook. Add location and click Send.`);
  } catch (err) {
    console.error(`✗ Failed: ${err instanceof Error ? err.message : err}`);
  }
}

main();
