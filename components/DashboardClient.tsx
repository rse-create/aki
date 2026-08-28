"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { name: string; value: number };
type PivotRow = { name: string; [key: string]: string | number };
type Pivot = { data: PivotRow[]; columns: string[] };
type DashboardData = {
  projectHoursByUser: Pivot;
  projectExpensesByCategory: Pivot;
  userHours: Point[];
  expenseByCategory: Point[];
  subcontractorHours: Point[];
  subcontractorHeadcount: Point[];
};

const INK_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";
const SERIES_BLUE = "#2a78d6";
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Bars({ title, unit, data }: { title: string; unit: string; data: Point[] }) {
  return (
    <section className="bg-white rounded-lg border p-4">
      <h2 className="font-medium text-slate-800 mb-3">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">データがありません</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid horizontal={false} stroke={GRIDLINE} />
            <XAxis type="number" tick={{ fontSize: 12, fill: INK_MUTED }} axisLine={{ stroke: GRIDLINE }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 12, fill: "#0b0b0b" }}
              axisLine={{ stroke: GRIDLINE }}
              tickLine={false}
            />
            <Tooltip formatter={(v) => `${Number(v).toLocaleString()} ${unit}`} />
            <Bar dataKey="value" fill={SERIES_BLUE} radius={[0, 4, 4, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

function StackedBars({ title, unit, pivot }: { title: string; unit: string; pivot: Pivot }) {
  const { data, columns } = pivot;
  return (
    <section className="bg-white rounded-lg border p-4">
      <h2 className="font-medium text-slate-800 mb-3">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">データがありません</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(140, data.length * 46) + (columns.length > 4 ? 24 : 0)}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid horizontal={false} stroke={GRIDLINE} />
            <XAxis type="number" tick={{ fontSize: 12, fill: INK_MUTED }} axisLine={{ stroke: GRIDLINE }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 12, fill: "#0b0b0b" }}
              axisLine={{ stroke: GRIDLINE }}
              tickLine={false}
            />
            <Tooltip formatter={(v) => `${Number(v).toLocaleString()} ${unit}`} />
            {columns.length > 1 && <Legend />}
            {columns.map((col, i) => (
              <Bar
                key={col}
                dataKey={col}
                name={col}
                stackId="stack"
                fill={CATEGORICAL[i % CATEGORICAL.length]}
                radius={i === columns.length - 1 ? [0, 4, 4, 0] : undefined}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

function ExpensePie({ data }: { data: Point[] }) {
  return (
    <section className="bg-white rounded-lg border p-4">
      <h2 className="font-medium text-slate-800 mb-3">経費 費目別内訳</h2>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">データがありません</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              label={({ name, value }) => `${name} ¥${value.toLocaleString()}`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip formatter={(v) => `¥${Number(v).toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

export default function DashboardClient() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?month=${month}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-500">対象月</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-md px-3 py-1.5"
        />
      </div>

      {loading || !data ? (
        <p className="text-slate-400 text-sm">読み込み中...</p>
      ) : (
        <>
          <StackedBars title="案件別 実働時間（作業者別）" unit="時間" pivot={data.projectHoursByUser} />
          <StackedBars title="案件別 経費（費目別）" unit="円" pivot={data.projectExpensesByCategory} />
          <Bars title="作業者別 稼働時間" unit="時間" data={data.userHours} />
          <ExpensePie data={data.expenseByCategory} />
          <Bars title="協力業者別 稼働時間" unit="時間" data={data.subcontractorHours} />
          <Bars title="協力業者別 人工数" unit="人工" data={data.subcontractorHeadcount} />
        </>
      )}
    </div>
  );
}
