import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getRecords } from "@/lib/sheets";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { userId, pin } = await request.json();
  if (!userId || !pin) {
    return NextResponse.json({ error: "氏名とPINを入力してください" }, { status: 400 });
  }

  const users = await getRecords("ユーザー");
  const user = users.find((u) => u.id === userId && u.status === "有効");
  if (!user || !bcrypt.compareSync(pin, user.pin_hash)) {
    return NextResponse.json({ error: "PINが違います" }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.name = user.name;
  session.role = user.role as "作業者" | "事務" | "管理者";
  await session.save();

  return NextResponse.json({ ok: true, role: user.role });
}
