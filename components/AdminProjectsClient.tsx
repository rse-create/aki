"use client";

import { useState } from "react";

type ProjectItem = {
  id: string;
  clientName: string;
  projectName: string;
  startDate: string;
  endDate: string;
  status: string;
};

type CalendarResponse = { calendarStatus?: string; calendarError?: string; error?: string };

function calendarMessage(res: CalendarResponse): { text: string; ok: boolean } | null {
  switch (res.calendarStatus) {
    case "created":
      return { text: "Googleカレンダーに工期を登録しました", ok: true };
    case "not_configured":
      return { text: "カレンダー連携が未設定のため登録されませんでした（GOOGLE_CALENDAR_ID を設定してください）", ok: false };
    case "failed":
      return { text: `Googleカレンダーへの登録に失敗しました：${res.calendarError ?? "不明なエラー"}`, ok: false };
    default:
      return res.error ? { text: res.error, ok: false } : null;
  }
}

function formatPeriod(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return "";
  return `工期: ${startDate || "未定"} 〜 ${endDate || "未定"}`;
}

export default function AdminProjectsClient({ initialProjects }: { initialProjects: ProjectItem[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  async function add() {
    if (!projectName) return;
    setSaving(true);
    setNotice(null);
    const res = await fetch("/api/masters/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName, projectName, startDate, endDate }),
    });
    const data: CalendarResponse = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setNotice({ text: data.error ?? "案件の登録に失敗しました", ok: false });
      return;
    }
    setNotice(calendarMessage(data) ?? { text: "案件を登録しました", ok: true });
    setClientName("");
    setProjectName("");
    setStartDate("");
    setEndDate("");
    setProjects((prev) => [
      { id: crypto.randomUUID(), clientName, projectName, startDate, endDate, status: "稼働中" },
      ...prev,
    ]);
  }

  async function toggle(id: string, current: string) {
    const next = current === "稼働中" ? "終了" : "稼働中";
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)));
    await fetch("/api/masters/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
  }

  async function syncCalendar(id: string) {
    setSyncingId(id);
    setNotice(null);
    const res = await fetch("/api/masters/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "syncCalendar" }),
    });
    const data: CalendarResponse = await res.json().catch(() => ({}));
    setSyncingId(null);
    setNotice(calendarMessage(data) ?? { text: "カレンダー登録に失敗しました", ok: false });
  }

  return (
    <div className="space-y-4">
      {notice && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
          }`}
        >
          {notice.text}
        </p>
      )}
      <section className="bg-white rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-slate-800">新規案件を追加</h2>
        <input
          type="text"
          placeholder="元請け会社名"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        <input
          type="text"
          placeholder="案件名"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        <div className="flex items-center gap-2">
          <label className="flex-1 space-y-1">
            <span className="block text-xs text-slate-500">工期開始日</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-slate-800"
            />
          </label>
          <span className="pt-5 text-slate-400">〜</span>
          <label className="flex-1 space-y-1">
            <span className="block text-xs text-slate-500">工期終了日</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-slate-800"
            />
          </label>
        </div>
        <button
          onClick={add}
          disabled={saving || !projectName}
          className="bg-slate-900 text-white rounded-md px-4 py-2 disabled:opacity-40"
        >
          追加
        </button>
      </section>

      <section className="bg-white rounded-lg border divide-y">
        {projects.map((p) => (
          <div key={p.id} className="p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-slate-800">
                {p.clientName ? `【${p.clientName}】` : ""}
                {p.projectName}
              </p>
              {formatPeriod(p.startDate, p.endDate) && (
                <p className="text-sm text-slate-500">{formatPeriod(p.startDate, p.endDate)}</p>
              )}
              <p className="text-sm text-slate-500">{p.status}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => toggle(p.id, p.status)}
                className="text-sm text-slate-700 border rounded-md px-3 py-1.5"
              >
                {p.status === "稼働中" ? "稼働終了にする" : "稼働中に戻す"}
              </button>
              {p.startDate && (
                <button
                  onClick={() => syncCalendar(p.id)}
                  disabled={syncingId === p.id}
                  className="text-xs text-slate-600 underline disabled:opacity-40"
                >
                  {syncingId === p.id ? "登録中…" : "カレンダーに登録"}
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
