import { NextRequest, NextResponse } from "next/server";
import { randomUUID, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { appendRecord, getRecords, updateField } from "@/lib/sheets";
import { requireAdmin } from "@/lib/require-session";

function generatePin() {
  return String(randomInt(0, 10000)).padStart(4, "0");
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const rows = await getRecords("ユーザー");
  return NextResponse.json({
    users: rows.map((r) => ({ id: r.id, name: r.name, role: r.role, status: r.status })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { name, role } = await request.json();
  if (!name || !role) {
    return NextResponse.json({ error: "氏名と権限を入力してください" }, { status: 400 });
  }

  const pin = generatePin();
  await appendRecord("ユーザー", {
    id: randomUUID(),
    name,
    pin_hash: bcrypt.hashSync(pin, 10),
    role,
    status: "有効",
  });

  return NextResponse.json({ ok: true, pin });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id, action } = await request.json();
  const rows = await getRecords("ユーザー");
  const row = rows.find((r) => r.id === id);
  if (!row) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

  if (action === "toggle-status") {
    await updateField("ユーザー", row._row, "status", row.status === "有効" ? "無効" : "有効");
    return NextResponse.json({ ok: true });
  }

  if (action === "reset-pin") {
    const pin = generatePin();
    await updateField("ユーザー", row._row, "pin_hash", bcrypt.hashSync(pin, 10));
    return NextResponse.json({ ok: true, pin });
  }

  return NextResponse.json({ error: "不明な操作です" }, { status: 400 });
}
