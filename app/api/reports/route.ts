import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { appendRecords, getRecords, SheetInput } from "@/lib/sheets";
import { requireSession } from "@/lib/require-session";
import { toNumber } from "@/lib/num";

const BREAK_MINUTES_DEFAULT = 60;

type SubcontractorInput = { subcontractorId: string; name: string; headcount: string; memo: string };
type ExpenseInput = { category: string; amount: string; memo: string };
type EntryInput = {
  projectId: string;
  projectLabel: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  workContent: string;
  hasSubcontractor: boolean;
  subcontractors: SubcontractorInput[];
  expenses: ExpenseInput[];
};

/** Returns null if the shift/break combination doesn't produce a sane (non-negative) duration. */
function calcWorkHours(start: string, end: string, breakMinutes: number): string | null {
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return null;
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60; // overnight shift safety
  minutes -= breakMinutes;
  if (minutes < 0) return null;
  return (minutes / 60).toFixed(2);
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = await request.json();
  const { workDate, entries }: { workDate: string; entries: EntryInput[] } = body;

  if (!workDate || !Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "必須項目が未入力です" }, { status: 400 });
  }

  const reportRows: SheetInput[] = [];
  const subcontractorRows: SheetInput[] = [];
  const expenseRows: SheetInput[] = [];
  const workHoursList: string[] = [];

  for (const [i, entry] of entries.entries()) {
    const label = entries.length > 1 ? `${i + 1}件目：` : "";
    const { projectId, projectLabel, startTime, endTime, breakMinutes, workContent, hasSubcontractor, subcontractors, expenses } = entry;

    if (!projectId || !startTime || !endTime || !workContent) {
      return NextResponse.json({ error: `${label}必須項目が未入力です` }, { status: 400 });
    }

    const safeBreakMinutes = Math.max(0, toNumber(breakMinutes ?? BREAK_MINUTES_DEFAULT));
    const workHours = calcWorkHours(startTime, endTime, safeBreakMinutes);
    if (workHours === null) {
      return NextResponse.json(
        { error: `${label}開始・終了・休憩時間を確認してください（終了は開始より後にしてください）` },
        { status: 400 }
      );
    }

    const validExpenses = (expenses ?? []).filter((e) => e.category && toNumber(e.amount) > 0);
    if ((expenses ?? []).length !== validExpenses.length) {
      return NextResponse.json({ error: `${label}経費の金額を正しく入力してください（0円以下は登録できません）` }, { status: 400 });
    }

    const validSubcontractors = hasSubcontractor
      ? (subcontractors ?? []).filter((s) => s.name && toNumber(s.headcount) > 0)
      : [];
    if (hasSubcontractor && validSubcontractors.length !== (subcontractors ?? []).length) {
      return NextResponse.json({ error: `${label}協力業者の人工数を正しく入力してください` }, { status: 400 });
    }

    const reportId = randomUUID();
    reportRows.push({
      id: reportId,
      created_at: new Date().toISOString(),
      work_date: workDate,
      user_id: session.userId,
      user_name: session.name,
      project_id: projectId,
      project_name: projectLabel,
      start_time: startTime,
      end_time: endTime,
      break_minutes: String(safeBreakMinutes),
      work_hours: workHours,
      work_content: workContent,
      has_subcontractor: hasSubcontractor ? "はい" : "いいえ",
    });
    workHoursList.push(workHours);

    for (const s of validSubcontractors) {
      subcontractorRows.push({
        id: randomUUID(),
        report_id: reportId,
        subcontractor_id: s.subcontractorId ?? "",
        subcontractor_name: s.name,
        headcount: String(toNumber(s.headcount)),
        memo: s.memo ?? "",
      });
    }

    for (const e of validExpenses) {
      expenseRows.push({
        id: randomUUID(),
        report_id: reportId,
        category: e.category,
        amount: String(toNumber(e.amount)),
        memo: e.memo ?? "",
      });
    }
  }

  await appendRecords("日報", reportRows);
  if (subcontractorRows.length) await appendRecords("日報_協力業者", subcontractorRows);
  if (expenseRows.length) await appendRecords("日報_経費", expenseRows);

  return NextResponse.json({ ok: true, count: reportRows.length, workHoursList });
}

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const url = new URL(request.url);
  const month = url.searchParams.get("month"); // YYYY-MM
  const onlyMine = session.role === "作業者";

  const rows = await getRecords("日報");
  const filtered = rows.filter((r) => {
    if (onlyMine && r.user_id !== session.userId) return false;
    if (month && !r.work_date.startsWith(month)) return false;
    return true;
  });

  filtered.sort((a, b) => (a.work_date < b.work_date ? 1 : -1));

  return NextResponse.json({ reports: filtered });
}
