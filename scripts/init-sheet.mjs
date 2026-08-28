import { google } from "googleapis";
import bcrypt from "bcryptjs";
import { randomUUID, randomInt } from "node:crypto";
import { readFileSync } from "node:fs";

// Minimal .env.local loader (avoids adding a dep just for the init script)
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

const TABS = {
  日報: ["id", "created_at", "work_date", "user_id", "user_name", "project_id", "project_name", "start_time", "end_time", "break_minutes", "work_hours", "work_content", "has_subcontractor"],
  日報_協力業者: ["id", "report_id", "subcontractor_id", "subcontractor_name", "headcount", "hours", "memo"],
  日報_経費: ["id", "report_id", "category", "amount", "memo"],
  案件マスタ: ["id", "client_name", "project_name", "status", "created_at"],
  協力業者マスタ: ["id", "name", "status", "created_at"],
  経費費目マスタ: ["id", "name", "sort_order"],
  ユーザー: ["id", "name", "pin_hash", "role", "status"],
};

async function main() {
  console.log("既存シートを取得中...");
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingTitles = meta.data.sheets.map((s) => s.properties.title);
  const defaultSheetId = meta.data.sheets[0].properties.sheetId;
  const defaultSheetTitle = meta.data.sheets[0].properties.title;

  const tabNames = Object.keys(TABS);
  const toCreate = tabNames.filter((t) => !existingTitles.includes(t));

  if (toCreate.length > 0) {
    console.log("シートを作成中:", toCreate.join(", "));
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: toCreate.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
  }

  console.log("ヘッダー行を設定中...");
  for (const [tab, header] of Object.entries(TABS)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [header] },
    });
  }

  // Remove the default blank "Sheet1" (or Japanese default title) now that our tabs exist
  if (!tabNames.includes(defaultSheetTitle)) {
    console.log(`デフォルトシート「${defaultSheetTitle}」を削除中...`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ deleteSheet: { sheetId: defaultSheetId } }] },
    });
  }

  console.log("初期マスタデータを投入中...");

  const now = new Date().toISOString();

  // 案件マスタ: currently-active projects (candidates from historical data — confirm/adjust later)
  const projects = [
    "【リバイブビルド】エルファーロ方南町",
    "【リバイブビルド】エルファーロ豊玉中",
    "【リバイブビルド】ルーベンときわ台",
    "【イーソーコ】第一東運ビル 外屋根解体工事",
  ];
  await appendAll("案件マスタ", projects.map((name) => {
    const bracket = name.match(/^【(.+?)】(.*)$/);
    return {
      id: randomUUID(),
      client_name: bracket ? bracket[1] : "",
      project_name: bracket ? bracket[2] : name,
      status: "稼働中",
      created_at: now,
    };
  }));

  // 協力業者マスタ
  const subcontractors = ["リキ塗装", "三森塗装", "将美塗装", "エース国栄", "坂本塗装", "石田塗装"];
  await appendAll("協力業者マスタ", subcontractors.map((name) => ({
    id: randomUUID(),
    name,
    status: "有効",
    created_at: now,
  })));

  // 経費費目マスタ
  const categories = ["交通費", "駐車場代", "資材購入費", "その他"];
  await appendAll("経費費目マスタ", categories.map((name, i) => ({
    id: randomUUID(),
    name,
    sort_order: String(i + 1),
  })));

  // ユーザー: 4 workers + 1 admin, each with a random 4-digit PIN
  const users = [
    { name: "矢萩絢也", role: "作業者" },
    { name: "疋田英一", role: "作業者" },
    { name: "松井竜司", role: "作業者" },
    { name: "梅野晃弘", role: "作業者" },
    { name: "管理者", role: "管理者" },
  ];
  const pins = [];
  const userRecords = users.map((u) => {
    const pin = String(randomInt(0, 10000)).padStart(4, "0");
    pins.push({ name: u.name, role: u.role, pin });
    return {
      id: randomUUID(),
      name: u.name,
      pin_hash: bcrypt.hashSync(pin, 10),
      role: u.role,
      status: "有効",
    };
  });
  await appendAll("ユーザー", userRecords);

  console.log("\n完了しました。初期PIN(この場でのみ表示されます):");
  for (const p of pins) console.log(`  ${p.name} (${p.role}): ${p.pin}`);
}

async function appendAll(tab, records) {
  if (records.length === 0) return;
  const header = TABS[tab];
  const rows = records.map((r) => header.map((k) => r[k] ?? ""));
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: tab,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
