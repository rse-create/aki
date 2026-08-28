import { google } from "googleapis";
import { readFileSync } from "node:fs";

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

// Must mirror lib/sheet-columns.ts exactly (English field -> Japanese label), in each tab's existing column order.
const HEADERS = {
  日報: ["ID", "作成日時", "作業日", "作業者ID", "氏名", "案件ID", "案件名称", "開始時刻", "終了時刻", "休憩時間(分)", "実働時間", "作業内容及び進捗状況", "協力業者有無"],
  日報_協力業者: ["ID", "日報ID", "協力業者ID", "協力業者名", "人工数", "稼働時間", "備考"],
  日報_経費: ["ID", "日報ID", "費目", "金額", "メモ"],
  案件マスタ: ["ID", "元請け会社名", "案件名称", "ステータス", "登録日"],
  協力業者マスタ: ["ID", "業者名", "ステータス", "登録日"],
  経費費目マスタ: ["ID", "費目名", "表示順"],
  ユーザー: ["ID", "氏名", "PINハッシュ", "権限", "ステータス"],
};

for (const [tab, header] of Object.entries(HEADERS)) {
  const current = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${tab}!1:1` });
  console.log(`${tab}: ${current.data.values?.[0]?.join(", ")} -> ${header.join(", ")}`);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [header] },
  });
}
console.log("完了");
