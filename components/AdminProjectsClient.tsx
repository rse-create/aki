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

  async function add() {
    if (!projectName) return;
    setSaving(true);
    await fetch("/api/masters/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName, projectName, startDate, endDate }),
    });
    setSaving(false);
    setClientName("");
    setProjectName("");
    setStartDate("");
    setEndDate("");
    setProjects((prev) => [
      ...prev,
      { id: crypto.randomUUID(), clientName, projectName, startDate, endDate, status: "稼働中" },
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

  return (
    <div className="space-y-4">
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
          <div key={p.id} className="p-3 flex items-center justify-between">
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
            <button
              onClick={() => toggle(p.id, p.status)}
              className="text-sm text-slate-700 border rounded-md px-3 py-1.5"
            >
              {p.status === "稼働中" ? "稼働終了にする" : "稼働中に戻す"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
