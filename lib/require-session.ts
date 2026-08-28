import { NextResponse } from "next/server";
import { getSession, type SessionData } from "./session";

export async function requireSession(): Promise<
  { session: SessionData } | { error: NextResponse }
> {
  const session = await getSession();
  if (!session.userId) {
    return { error: NextResponse.json({ error: "ログインしてください" }, { status: 401 }) };
  }
  return { session: session as SessionData };
}

export async function requireAdmin(): Promise<
  { session: SessionData } | { error: NextResponse }
> {
  const result = await requireSession();
  if ("error" in result) return result;
  if (result.session.role !== "管理者") {
    return { error: NextResponse.json({ error: "権限がありません" }, { status: 403 }) };
  }
  return result;
}
