import { google } from "googleapis";
import { COLUMN_LABELS } from "./sheet-columns";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

function labelToField(tab: string, label: string): string {
  const map = COLUMN_LABELS[tab];
  if (!map) return label;
  const entry = Object.entries(map).find(([, v]) => v === label);
  return entry ? entry[0] : label;
}

function fieldToLabel(tab: string, field: string): string {
  return COLUMN_LABELS[tab]?.[field] ?? field;
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error("Google service account credentials are not set");
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export type SheetRow = { [key: string]: string } & { _row: number };
export type SheetInput = { [key: string]: string };

/** Reads a tab and returns objects keyed by header row, plus each row's sheet row number (1-indexed, header = row 1). */
export async function getRecords(tab: string): Promise<SheetRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: tab,
  });
  const values = res.data.values ?? [];
  if (values.length === 0) return [];
  const header = values[0].map((label) => labelToField(tab, label));
  return values.slice(1).map((row, i) => {
    const record = { _row: i + 2 } as SheetRow;
    header.forEach((key, idx) => {
      record[key] = row[idx] ?? "";
    });
    return record;
  });
}

async function getHeader(tab: string): Promise<string[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!1:1`,
  });
  return res.data.values?.[0] ?? [];
}

/** Appends one row, mapping the record's semantic keys to the tab's Japanese header order. */
export async function appendRecord(tab: string, record: SheetInput): Promise<void> {
  const header = await getHeader(tab);
  const row = header.map((label) => record[labelToField(tab, label)] ?? "");
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: tab,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

export async function appendRecords(tab: string, records: SheetInput[]): Promise<void> {
  if (records.length === 0) return;
  const header = await getHeader(tab);
  const rows = records.map((record) => header.map((label) => record[labelToField(tab, label)] ?? ""));
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: tab,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

/** Updates a single field on an existing row (row number as returned by getRecords' _row). `field` is the semantic key. */
export async function updateField(
  tab: string,
  row: number,
  field: string,
  value: string
): Promise<void> {
  const header = await getHeader(tab);
  const colIndex = header.indexOf(fieldToLabel(tab, field));
  if (colIndex === -1) throw new Error(`Unknown field ${field} on ${tab}`);
  const colLetter = columnLetter(colIndex);
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tab}!${colLetter}${row}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
}

function columnLetter(index: number): string {
  let n = index;
  let letter = "";
  do {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letter;
}
