import { NextRequest, NextResponse } from "next/server";
import { getRecords } from "@/lib/sheets";
import { requireSession } from "@/lib/require-session";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const month = url.searchParams.get("month"); // YYYY-MM, empty = all

  const [reports, expenses, subcontractorRows] = await Promise.all([
    getRecords("日報"),
    getRecords("日報_経費"),
    getRecords("日報_協力業者"),
  ]);

  const scopedReports = month ? reports.filter((r) => r.work_date.startsWith(month)) : reports;
  const scopedReportIds = new Set(scopedReports.map((r) => r.id));
  const scopedExpenses = expenses.filter((e) => scopedReportIds.has(e.report_id));
  const scopedSubcontractors = subcontractorRows.filter((s) => scopedReportIds.has(s.report_id));

  const projectNameByReportId = new Map(scopedReports.map((r) => [r.id, r.project_name]));

  const projectHoursByUser = pivot(scopedReports, (r) => r.project_name, (r) => r.user_name, (r) => Number(r.work_hours || 0));
  const projectExpensesByCategory = pivot(
    scopedExpenses,
    (e) => projectNameByReportId.get(e.report_id) ?? "不明",
    (e) => e.category,
    (e) => Number(e.amount || 0)
  );

  const byUser = groupSum(scopedReports, (r) => r.user_name, (r) => Number(r.work_hours || 0));

  const byCategory = groupSum(scopedExpenses, (e) => e.category, (e) => Number(e.amount || 0));

  const subcontractorHours = groupSum(scopedSubcontractors, (s) => s.subcontractor_name, (s) => Number(s.hours || 0));
  const subcontractorHeadcount = groupSum(scopedSubcontractors, (s) => s.subcontractor_name, (s) => Number(s.headcount || 0));

  return NextResponse.json({
    projectHoursByUser,
    projectExpensesByCategory,
    userHours: toChartData(byUser),
    expenseByCategory: toChartData(byCategory),
    subcontractorHours: toChartData(subcontractorHours),
    subcontractorHeadcount: toChartData(subcontractorHeadcount),
  });
}

function groupSum<T>(rows: T[], keyFn: (row: T) => string, valueFn: (row: T) => number) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row) || "不明";
    map.set(key, (map.get(key) ?? 0) + valueFn(row));
  }
  return map;
}

function toChartData(map: Map<string, number>) {
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}

/** Pivots rows into { name: rowKey, [colKey]: sum, ... }[] plus the sorted list of columns present. */
function pivot<T>(
  rows: T[],
  rowKeyFn: (row: T) => string,
  colKeyFn: (row: T) => string,
  valueFn: (row: T) => number
) {
  const rowOrder: string[] = [];
  const colKeys = new Set<string>();
  const table = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const rk = rowKeyFn(row) || "不明";
    const ck = colKeyFn(row) || "不明";
    if (!table.has(rk)) {
      table.set(rk, new Map());
      rowOrder.push(rk);
    }
    colKeys.add(ck);
    const cols = table.get(rk)!;
    cols.set(ck, (cols.get(ck) ?? 0) + valueFn(row));
  }

  const columns = Array.from(colKeys).sort();
  const data = rowOrder
    .map((rk) => {
      const cols = table.get(rk)!;
      const entry: { name: string; [key: string]: string | number } = { name: rk };
      for (const ck of columns) entry[ck] = Math.round((cols.get(ck) ?? 0) * 100) / 100;
      return entry;
    })
    .sort((a, b) => {
      const totalA = columns.reduce((s, c) => s + (a[c] as number), 0);
      const totalB = columns.reduce((s, c) => s + (b[c] as number), 0);
      return totalB - totalA;
    });

  return { data, columns };
}
