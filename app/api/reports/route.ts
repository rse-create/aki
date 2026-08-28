import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { appendRecord, appendRecords, getRecords } from "@/lib/sheets";
import { requireSession } from "@/lib/require-session";

const BREAK_MINUTES_DEFAULT = 60;

type SubcontractorInput = { subcontractorId: string; name: string; headcount: string; hours: string; memo: string };
type ExpenseInput = { category: string; amount: string; memo: string };

function calcWorkHours(start: string, end: string, breakMinutes: number): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60; // overnight shift safety
  minutes -= breakMinutes;
  return (Math.max(minutes, 0) / 60).toFixed(2);
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = await request.json();
  const {
    workDate,
    projectId,
    projectLabel,
    startTime,
    endTime,
    breakMinutes,
    workContent,
    hasSubcontractor,
    subcontractors,
    expenses,
  }: {
    workDate: string;
    projectId: string;
    projectLabel: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
    workContent: string;
    hasSubcontractor: boolean;
    subcontractors: SubcontractorInput[];
    expenses: ExpenseInput[];
  } = body;

  if (!workDate || !projectId || !startTime || !endTime || !workContent) {
    return NextResponse.json({ error: "必須項目が未入力です" }, { status: 400 });
  }

  const reportId = randomUUID();
  const workHours = calcWorkHours(startTime, endTime, breakMinutes ?? BREAK_MINUTES_DEFAULT);

  await appendRecord("日報", {
    id: reportId,
    created_at: new Date().toISOString(),
    work_date: workDate,
    user_id: session.userId,
    user_name: session.name,
    project_id: projectId,
    project_name: projectLabel,
    start_time: startTime,
    end_time: endTime,
    break_minutes: String(breakMinutes ?? BREAK_MINUTES_DEFAULT),
    work_hours: workHours,
    work_content: workContent,
    has_subcontractor: hasSubcontractor ? "はい" : "いいえ",
  });

  if (hasSubcontractor && subcontractors?.length) {
    await appendRecords(
      "日報_協力業者",
      subcontractors
        .filter((s) => s.name)
        .map((s) => ({
          id: randomUUID(),
          report_id: reportId,
          subcontractor_id: s.subcontractorId ?? "",
          subcontractor_name: s.name,
          headcount: s.headcount ?? "",
          hours: s.hours ?? "",
          memo: s.memo ?? "",
        }))
    );
  }

  if (expenses?.length) {
    await appendRecords(
      "日報_経費",
      expenses
        .filter((e) => e.category && e.amount)
        .map((e) => ({
          id: randomUUID(),
          report_id: reportId,
          category: e.category,
          amount: e.amount,
          memo: e.memo ?? "",
        }))
    );
  }

  return NextResponse.json({ ok: true, reportId, workHours });
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
