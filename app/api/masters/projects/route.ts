import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { appendRecord, getRecords, updateField } from "@/lib/sheets";
import { requireAdmin, requireSession } from "@/lib/require-session";
import { createProjectPeriodEvent } from "@/lib/calendar";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const rows = await getRecords("案件マスタ");
  return NextResponse.json({ projects: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { clientName, projectName, startDate, endDate } = await request.json();
  if (!projectName) {
    return NextResponse.json({ error: "案件名を入力してください" }, { status: 400 });
  }

  await appendRecord("案件マスタ", {
    id: randomUUID(),
    client_name: clientName ?? "",
    project_name: projectName,
    start_date: startDate ?? "",
    end_date: endDate ?? "",
    status: "稼働中",
    created_at: new Date().toISOString(),
  });

  const calendar = startDate
    ? await syncCalendar({ clientName, projectName, startDate, endDate })
    : { calendarStatus: "skipped" as const };

  return NextResponse.json({ ok: true, ...calendar });
}

type CalendarResult = { calendarStatus: "created" | "not_configured" | "failed" | "skipped"; calendarError?: string };

/** Registers the project period on Google Calendar and reports what happened, so the admin screen can show it. */
async function syncCalendar(p: {
  clientName?: string;
  projectName: string;
  startDate: string;
  endDate?: string;
}): Promise<CalendarResult> {
  // Sheets may hand dates back in its display format (e.g. 2026/9/15); Calendar needs YYYY-MM-DD.
  const toIsoDate = (v?: string) => {
    const m = (v ?? "").trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : "";
  };
  const startDate = toIsoDate(p.startDate);
  if (!startDate) {
    return { calendarStatus: "failed", calendarError: `工期開始日の形式が読み取れません（${p.startDate}）` };
  }
  try {
    const eventId = await createProjectPeriodEvent({
      title: p.clientName ? `【${p.clientName}】${p.projectName}` : p.projectName,
      startDate,
      endDate: toIsoDate(p.endDate),
    });
    return { calendarStatus: eventId ? "created" : "not_configured" };
  } catch (err) {
    console.error("Googleカレンダーへの登録に失敗しました", err);
    const message = err instanceof Error ? err.message : String(err);
    return { calendarStatus: "failed", calendarError: message };
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id, status, action } = await request.json();
  const rows = await getRecords("案件マスタ");
  const row = rows.find((r) => r.id === id);
  if (!row) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

  if (action === "syncCalendar") {
    if (!row.start_date) {
      return NextResponse.json({ error: "工期開始日が未入力です" }, { status: 400 });
    }
    const calendar = await syncCalendar({
      clientName: row.client_name,
      projectName: row.project_name,
      startDate: row.start_date,
      endDate: row.end_date,
    });
    return NextResponse.json({ ok: true, ...calendar });
  }

  await updateField("案件マスタ", row._row, "status", status);
  return NextResponse.json({ ok: true });
}
