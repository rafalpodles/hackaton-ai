import ExcelJS from "exceljs";
import { randomBytes } from "crypto";

const FILE_PATH = "/Users/rpo/Documents/hackaton.xlsx";
const PASSWORD_COL = 7; // Column G (after Tool column, or reuse if password col exists)

function generateTempPassword(): string {
  return randomBytes(4).toString("hex"); // 8-char e.g. "a1b2c3d4"
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE_PATH);
  const ws = wb.worksheets[0];

  // Find or create password column
  const headerRow = ws.getRow(1);
  let passwordColIndex = -1;

  headerRow.eachCell((cell, colNumber) => {
    if (
      typeof cell.value === "string" &&
      cell.value.toLowerCase() === "password"
    ) {
      passwordColIndex = colNumber;
    }
  });

  if (passwordColIndex === -1) {
    // Add password column after the last existing column
    passwordColIndex = (headerRow.cellCount || 6) + 1;
    headerRow.getCell(passwordColIndex).value = "password";
  }

  let count = 0;

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const name = row.getCell(2).value; // Column B: Imie i Nazwisko
    if (!name) return; // skip empty rows

    // Only generate password if cell is empty
    const existingPassword = row.getCell(passwordColIndex).value;
    if (existingPassword) return;

    const password = generateTempPassword();
    row.getCell(passwordColIndex).value = password;
    count++;
  });

  await wb.xlsx.writeFile(FILE_PATH);
  console.log(
    `Done! Generated ${count} passwords in column ${passwordColIndex}. File saved.`
  );

  // Print summary
  console.log("\n--- Users with passwords ---\n");
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const name = row.getCell(2).value;
    const emailCell = row.getCell(4).value;
    const email =
      typeof emailCell === "object" && emailCell !== null && "result" in emailCell
        ? (emailCell as { result: string }).result
        : emailCell;
    const password = row.getCell(passwordColIndex).value;
    if (name && email) {
      console.log(`${name} | ${email} | ${password}`);
    }
  });
}

main();
