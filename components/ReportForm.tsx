"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Project = { id: string; label: string };
type Subcontractor = { id: string; name: string };
type Category = { id: string; name: string };

type ExpenseRow = { category: string; amount: string; memo: string };
type SubcontractorRow = { subcontractorId: string; name: string; headcount: string; hours: string; memo: string };

const OTHER = "__other__";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcHours(start: string, end: string, breakMinutes: number): string | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  minutes -= breakMinutes;
  if (minutes < 0) return null;
  return (minutes / 60).toFixed(2);
}

export default function ReportForm({
  projects,
  subcontractors,
  categories,
}: {
  projects: Project[];
  subcontractors: Subcontractor[];
  categories: Category[];
}) {
  const [workDate, setWorkDate] = useState(todayStr());
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [workContent, setWorkContent] = useState("");
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [hasSubcontractor, setHasSubcontractor] = useState(false);
  const [subRows, setSubRows] = useState<SubcontractorRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const workHours = useMemo(() => calcHours(startTime, endTime, breakMinutes), [startTime, endTime, breakMinutes]);

  function addExpense() {
    setExpenses((rows) => [...rows, { category: categories[0]?.name ?? "", amount: "", memo: "" }]);
  }
  function updateExpense(i: number, patch: Partial<ExpenseRow>) {
    setExpenses((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeExpense(i: number) {
    setExpenses((rows) => rows.filter((_, idx) => idx !== i));
  }

  function addSubRow() {
    setSubRows((rows) => [
      ...rows,
      { subcontractorId: subcontractors[0]?.id ?? OTHER, name: subcontractors[0]?.name ?? "", headcount: "1", hours: "", memo: "" },
    ]);
  }
  function updateSubRow(i: number, patch: Partial<SubcontractorRow>) {
    setSubRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeSubRow(i: number) {
    setSubRows((rows) => rows.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setError(null);
    if (!projectId || !workContent || workHours === null) {
      setError("案件・作業内容・時刻を確認してください（終了は開始より後にしてください）");
      return;
    }
    setSubmitting(true);
    const project = projects.find((p) => p.id === projectId);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workDate,
        projectId,
        projectLabel: project?.label ?? "",
        startTime,
        endTime,
        breakMinutes,
        workContent,
        hasSubcontractor,
        subcontractors: hasSubcontractor ? subRows : [],
        expenses,
      }),
    });
    if (!res.ok) {
      setSubmitting(false);
      const body = await res.json();
      setError(body.error ?? "送信に失敗しました");
      return;
    }
    router.push("/report/complete");
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border-t-4 border-t-blue-600 border-x border-b p-4 space-y-4">
        <div className="min-w-0">
          <label className="block text-sm text-slate-500 mb-1">作業日</label>
          <input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="block w-full min-w-0 max-w-full box-border border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-500 mb-1">案件</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="block text-sm text-slate-500 mb-1">開始</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="block w-full min-w-0 max-w-full box-border border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm text-slate-500 mb-1">終了</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="block w-full min-w-0 max-w-full box-border border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="w-32">
          <label className="block text-sm text-slate-500 mb-1">休憩(分)</label>
          <input
            type="number"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="text-sm bg-blue-50 text-blue-800 rounded-md px-3 py-2">
          実働時間: <span className="font-semibold">{workHours ?? "―"} 時間</span>
        </p>
        <div>
          <label className="block text-sm text-slate-500 mb-1">作業内容及び進捗状況</label>
          <textarea
            value={workContent}
            onChange={(e) => setWorkContent(e.target.value)}
            rows={4}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </section>

      <section className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-800">経費</h2>
          <button onClick={addExpense} className="text-sm text-blue-600">
            ＋追加
          </button>
        </div>
        {expenses.map((row, i) => (
          <div key={i} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <select
                value={row.category}
                onChange={(e) => updateExpense(i, { category: e.target.value })}
                className="border rounded-md px-2 py-2 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button onClick={() => removeExpense(i)} className="text-slate-400 px-2 flex-shrink-0">
                ✕
              </button>
            </div>
            <input
              type="number"
              placeholder="金額"
              value={row.amount}
              onChange={(e) => updateExpense(i, { amount: e.target.value })}
              className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="メモ"
              value={row.memo}
              onChange={(e) => updateExpense(i, { memo: e.target.value })}
              className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        ))}
        {expenses.length === 0 && <p className="text-sm text-slate-400">経費はありません</p>}
      </section>

      <section className="bg-white rounded-lg border p-4 space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasSubcontractor}
            onChange={(e) => {
              setHasSubcontractor(e.target.checked);
              if (e.target.checked && subRows.length === 0) addSubRow();
            }}
            className="w-4 h-4 accent-blue-600"
          />
          <span className="font-medium text-slate-800">協力業者は入りましたか？</span>
        </label>

        {hasSubcontractor && (
          <div className="space-y-3">
            {subRows.map((row, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={row.subcontractorId}
                    onChange={(e) => {
                      const sc = subcontractors.find((s) => s.id === e.target.value);
                      updateSubRow(i, { subcontractorId: e.target.value, name: sc?.name ?? "" });
                    }}
                    className="border rounded-md px-2 py-2 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {subcontractors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value={OTHER}>その他（自由入力）</option>
                  </select>
                  <button onClick={() => removeSubRow(i)} className="text-slate-400 px-2">
                    ✕
                  </button>
                </div>
                {row.subcontractorId === OTHER && (
                  <input
                    type="text"
                    placeholder="業者名を入力"
                    value={row.name}
                    onChange={(e) => updateSubRow(i, { name: e.target.value })}
                    className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">人工数</label>
                    <input
                      type="number"
                      value={row.headcount}
                      onChange={(e) => updateSubRow(i, { headcount: e.target.value })}
                      className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">稼働時間</label>
                    <input
                      type="number"
                      step="0.5"
                      value={row.hours}
                      onChange={(e) => updateSubRow(i, { hours: e.target.value })}
                      className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="備考"
                  value={row.memo}
                  onChange={(e) => updateSubRow(i, { memo: e.target.value })}
                  className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
            <button onClick={addSubRow} className="text-sm text-blue-600">
              ＋業者を追加
            </button>
          </div>
        )}
      </section>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-3 font-medium disabled:opacity-40 transition-colors"
      >
        {submitting ? "送信中..." : "送信する"}
      </button>
    </div>
  );
}
