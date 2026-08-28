import { NextResponse } from "next/server";
import { getRecords } from "@/lib/sheets";
import { requireSession } from "@/lib/require-session";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const rows = await getRecords("経費費目マスタ");
  rows.sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  return NextResponse.json({ categories: rows });
}
