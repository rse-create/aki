import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { appendRecord, getRecords, updateField } from "@/lib/sheets";
import { requireAdmin, requireSession } from "@/lib/require-session";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const rows = await getRecords("協力業者マスタ");
  return NextResponse.json({ subcontractors: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "業者名を入力してください" }, { status: 400 });

  await appendRecord("協力業者マスタ", {
    id: randomUUID(),
    name,
    status: "有効",
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id, status } = await request.json();
  const rows = await getRecords("協力業者マスタ");
  const row = rows.find((r) => r.id === id);
  if (!row) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

  await updateField("協力業者マスタ", row._row, "status", status);
  return NextResponse.json({ ok: true });
}
