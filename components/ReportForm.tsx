"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Project = { id: string; label: string };
type Subcontractor = { id: string; name: string };
type Category = { id: string; name: string };

type ExpenseRow = { category: string; amount: string; memo: string };
type SubcontractorRow = { subcontractorId: string; name: string; headcount: string; memo: string };
type Entry = {
  projectId: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workContent: string;
  expenses: ExpenseRow[];
  hasSubcontractor: boolean;
  subRows: SubcontractorRow[];
};

const OTHER = "__other__";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcHours(start: string, end: string, breakMinutes: number): string | null {
  if (!start || !end) return null;
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  minutes -= breakMinutes;
  if (!Number.isFinite(minutes) || minutes < 0) return null;
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
  function newEntry(): Entry {
    return {
      projectId: projects[0]?.id ?? "",
      startTime: "08:00",
      endTime: "17:00",
      breakMinutes: 60,
      workContent: "",
      expenses: [],
      hasSubcontractor: false,
      subRows: [],
    };
  }

  const [workDate, setWorkDate] = useState(todayStr());
  const [entries, setEntries] = useState<Entry[]>([newEntry()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function updateEntry(entryIdx: number, patch: Partial<Entry>) {
    setEntries((rows) => rows.map((r, idx) => (idx === entryIdx ? { ...r, ...patch } : r)));
  }
  function addEntry() {
    setEntries((rows) => [...rows, newEntry()]);
  }
  function removeEntry(entryIdx: number) {
    setEntries((rows) => rows.filter((_, idx) => idx !== entryIdx));
  }

  function addExpense(entryIdx: number) {
    updateEntry(entryIdx, {
      expenses: [...entries[entryIdx].expenses, { category: categories[0]?.name ?? "", amount: "", memo: "" }],
    });
  }
  function updateExpense(entryIdx: number, i: number, patch: Partial<ExpenseRow>) {
    updateEntry(entryIdx, {
      expenses: entries[entryIdx].expenses.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    });
  }
  function removeExpense(entryIdx: number, i: number) {
    updateEntry(entryIdx, { expenses: entries[entryIdx].expenses.filter((_, idx) => idx !== i) });
  }

  function addSubRow(entryIdx: number) {
    updateEntry(entryIdx, {
      subRows: [
        ...entries[entryIdx].subRows,
        { subcontractorId: subcontractors[0]?.id ?? OTHER, name: subcontractors[0]?.name ?? "", headcount: "1", memo: "" },
      ],
    });
  }
  function updateSubRow(entryIdx: number, i: number, patch: Partial<SubcontractorRow>) {
    updateEntry(entryIdx, {
      subRows: entries[entryIdx].subRows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    });
  }
  function removeSubRow(entryIdx: number, i: number) {
    updateEntry(entryIdx, { subRows: entries[entryIdx].subRows.filter((_, idx) => idx !== i) });
  }

  async function submit() {
    setError(null);

    for (const [entryIdx, entry] of entries.entries()) {
      const label = entries.length > 1 ? `案件${entryIdx + 1}：` : "";
      if (!entry.projectId || !entry.workContent) {
        setError(`${label}案件・作業内容を入力してください`);
        return;
      }
      const workHours = calcHours(entry.startTime, entry.endTime, entry.breakMinutes);
      if (entry.breakMinutes < 0 || workHours === null) {
        setError(`${label}開始・終了・休憩時間を確認してください（休憩時間はマイナスにできません。終了は開始より後にしてください）`);
        return;
      }
      for (const [i, row] of entry.expenses.entries()) {
        const amount = Number(row.amount);
        if (!row.category || row.amount === "" || !Number.isFinite(amount) || amount <= 0) {
          setError(`${label}経費 ${i + 1}行目：金額を正しく入力してください（0円以下やマイナスは登録できません）`);
          return;
        }
      }
      if (entry.hasSubcontractor) {
        for (const [i, row] of entry.subRows.entries()) {
          const headcount = Number(row.headcount);
          if (!row.name) {
            setError(`${label}協力業者 ${i + 1}行目：業者名を入力してください`);
            return;
          }
          if (row.headcount === "" || !Number.isFinite(headcount) || headcount <= 0) {
            setError(`${label}協力業者 ${i + 1}行目：人工数を正しく入力してください（1以上）`);
            return;
          }
        }
      }
    }

    setSubmitting(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workDate,
        entries: entries.map((entry) => ({
          projectId: entry.projectId,
          projectLabel: projects.find((p) => p.id === entry.projectId)?.label ?? "",
          startTime: entry.startTime,
          endTime: entry.endTime,
          breakMinutes: entry.breakMinutes,
          workContent: entry.workContent,
          hasSubcontractor: entry.hasSubcontractor,
          subcontractors: entry.hasSubcontractor ? entry.subRows : [],
          expenses: entry.expenses,
        })),
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
      <div className="min-w-0">
        <label className="block text-sm text-slate-500 mb-1">作業日</label>
        <div className="w-full overflow-hidden rounded-md border focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="block w-full border-0 px-3 py-2 focus:outline-none"
          />
        </div>
      </div>

      {entries.map((entry, entryIdx) => {
        const workHours = calcHours(entry.startTime, entry.endTime, entry.breakMinutes);
        return (
          <div key={entryIdx} className="space-y-3">
            <section className="bg-white rounded-lg border-t-4 border-t-blue-600 border-x border-b p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-slate-800">{entries.length > 1 ? `案件 ${entryIdx + 1}` : "案件"}</h2>
                {entries.length > 1 && (
                  <button onClick={() => removeEntry(entryIdx)} className="text-sm text-slate-400">
                    ✕ この案件を削除
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">案件</label>
                <select
                  value={entry.projectId}
                  onChange={(e) => updateEntry(entryIdx, { projectId: e.target.value })}
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
                  <div className="w-full overflow-hidden rounded-md border focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) => updateEntry(entryIdx, { startTime: e.target.value })}
                      className="block w-full border-0 px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="block text-sm text-slate-500 mb-1">終了</label>
                  <div className="w-full overflow-hidden rounded-md border focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) => updateEntry(entryIdx, { endTime: e.target.value })}
                      className="block w-full border-0 px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="w-32">
                <label className="block text-sm text-slate-500 mb-1">休憩(分)</label>
                <input
                  type="number"
                  min="0"
                  value={entry.breakMinutes}
                  onChange={(e) => updateEntry(entryIdx, { breakMinutes: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-sm bg-blue-50 text-blue-800 rounded-md px-3 py-2">
                実働時間: <span className="font-semibold">{workHours ?? "―"} 時間</span>
              </p>
              <div>
                <label className="block text-sm text-slate-500 mb-1">作業内容及び進捗状況</label>
                <textarea
                  value={entry.workContent}
                  onChange={(e) => updateEntry(entryIdx, { workContent: e.target.value })}
                  rows={4}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </section>

            <section className="bg-white rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-slate-800">経費</h2>
                <button onClick={() => addExpense(entryIdx)} className="text-sm text-blue-600">
                  ＋追加
                </button>
              </div>
              {entry.expenses.map((row, i) => (
                <div key={i} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={row.category}
                      onChange={(e) => updateExpense(entryIdx, i, { category: e.target.value })}
                      className="border rounded-md px-2 py-2 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => removeExpense(entryIdx, i)} className="text-slate-400 px-2 flex-shrink-0">
                      ✕
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    placeholder="金額"
                    value={row.amount}
                    onChange={(e) => updateExpense(entryIdx, i, { amount: e.target.value })}
                    className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="メモ"
                    value={row.memo}
                    onChange={(e) => updateExpense(entryIdx, i, { memo: e.target.value })}
                    className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
              {entry.expenses.length === 0 && <p className="text-sm text-slate-400">経費はありません</p>}
            </section>

            <section className="bg-white rounded-lg border p-4 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={entry.hasSubcontractor}
                  onChange={(e) => {
                    updateEntry(entryIdx, { hasSubcontractor: e.target.checked });
                    if (e.target.checked && entry.subRows.length === 0) addSubRow(entryIdx);
                  }}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="font-medium text-slate-800">協力業者は入りましたか？</span>
              </label>

              {entry.hasSubcontractor && (
                <div className="space-y-3">
                  {entry.subRows.map((row, i) => (
                    <div key={i} className="border rounded-md p-3 space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={row.subcontractorId}
                          onChange={(e) => {
                            const sc = subcontractors.find((s) => s.id === e.target.value);
                            updateSubRow(entryIdx, i, { subcontractorId: e.target.value, name: sc?.name ?? "" });
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
                        <button onClick={() => removeSubRow(entryIdx, i)} className="text-slate-400 px-2">
                          ✕
                        </button>
                      </div>
                      {row.subcontractorId === OTHER && (
                        <input
                          type="text"
                          placeholder="業者名を入力"
                          value={row.name}
                          onChange={(e) => updateSubRow(entryIdx, i, { name: e.target.value })}
                          className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">人工数</label>
                        <input
                          type="number"
                          min="1"
                          value={row.headcount}
                          onChange={(e) => updateSubRow(entryIdx, i, { headcount: e.target.value })}
                          className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="備考"
                        value={row.memo}
                        onChange={(e) => updateSubRow(entryIdx, i, { memo: e.target.value })}
                        className="w-full border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                  <button onClick={() => addSubRow(entryIdx)} className="text-sm text-blue-600">
                    ＋業者を追加
                  </button>
                </div>
              )}
            </section>
          </div>
        );
      })}

      <button
        onClick={addEntry}
        className="w-full border-2 border-dashed border-blue-300 text-blue-600 rounded-md py-3 font-medium hover:bg-blue-50 transition-colors"
      >
        ＋別の案件を追加
      </button>

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
