"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type RenderableText,
} from "recharts";

type Point = { name: string; value: number };
type PivotRow = { name: string; [key: string]: string | number };
type Pivot = { data: PivotRow[]; columns: string[] };
type ProjectHeadcountRow = { name: string; employee: number; subcontractor: number; total: number };
type DashboardData = {
  projectHeadcount: ProjectHeadcountRow[];
  projectExpensesByCategory: Pivot;
  userHeadcount: Point[];
  expenseByCategory: Point[];
  subcontractorHeadcount: Point[];
};

const INK_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";
const SERIES_BLUE = "#2a78d6";
const EMPLOYEE_COLOR = "#2a78d6";
const SUBCONTRACTOR_COLOR = "#eb6834";
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

function headcountLabel(v: RenderableText) {
  const n = Number(v);
  return n > 0 ? n.toLocaleString() : "";
}

function totalLabel(v: RenderableText) {
  return `計 ${Number(v).toLocaleString()}`;
}

function ProjectHeadcountBars({ data }: { data: ProjectHeadcountRow[] }) {
  return (
    <section className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-slate-800">案件別 人工数</h2>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: EMPLOYEE_COLOR }} />
            社員
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: SUBCONTRACTOR_COLOR }} />
            協力業者
          </span>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">データがありません</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }}>
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
            <Tooltip
              formatter={(v, key) => [`${Number(v).toLocaleString()} 人工`, key === "employee" ? "社員" : key === "subcontractor" ? "協力業者" : "合計"]}
            />
            <Bar dataKey="employee" name="社員" stackId="stack" fill={EMPLOYEE_COLOR} maxBarSize={28}>
              <LabelList dataKey="employee" position="center" formatter={headcountLabel} fill="#fff" fontSize={11} />
            </Bar>
            <Bar dataKey="subcontractor" name="協力業者" stackId="stack" fill={SUBCONTRACTOR_COLOR} radius={[0, 4, 4, 0]} maxBarSize={28}>
              <LabelList dataKey="subcontractor" position="center" formatter={headcountLabel} fill="#fff" fontSize={11} />
              <LabelList dataKey="total" position="right" formatter={totalLabel} fill={INK_MUTED} fontSize={12} />
            </Bar>
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
          <ProjectHeadcountBars data={data.projectHeadcount} />
          <StackedBars title="案件別 経費（費目別）" unit="円" pivot={data.projectExpensesByCategory} />
          <Bars title="作業者別 稼働人工数" unit="人工" data={data.userHeadcount} />
          <ExpensePie data={data.expenseByCategory} />
          <Bars title="協力業者別 人工数" unit="人工" data={data.subcontractorHeadcount} />
        </>
      )}
    </div>
  );
}
