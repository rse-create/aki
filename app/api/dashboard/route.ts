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

  const byProject = groupSum(scopedReports, (r) => r.project_name, (r) => Number(r.work_hours || 0));
  const projectNameByReportId = new Map(scopedReports.map((r) => [r.id, r.project_name]));
  const expenseByProject = groupSum(
    scopedExpenses,
    (e) => projectNameByReportId.get(e.report_id) ?? "不明",
    (e) => Number(e.amount || 0)
  );

  const byUser = groupSum(scopedReports, (r) => r.user_name, (r) => Number(r.work_hours || 0));

  const byCategory = groupSum(scopedExpenses, (e) => e.category, (e) => Number(e.amount || 0));

  const subcontractorHours = groupSum(scopedSubcontractors, (s) => s.subcontractor_name, (s) => Number(s.hours || 0));
  const subcontractorHeadcount = groupSum(scopedSubcontractors, (s) => s.subcontractor_name, (s) => Number(s.headcount || 0));

  return NextResponse.json({
    projectHours: toChartData(byProject),
    projectExpenses: toChartData(expenseByProject),
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
