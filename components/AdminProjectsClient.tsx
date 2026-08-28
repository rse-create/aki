"use client";

import { useState } from "react";

type ProjectItem = { id: string; clientName: string; projectName: string; status: string };

export default function AdminProjectsClient({ initialProjects }: { initialProjects: ProjectItem[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!projectName) return;
    setSaving(true);
    await fetch("/api/masters/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName, projectName }),
    });
    setSaving(false);
    setClientName("");
    setProjectName("");
    setProjects((prev) => [
      ...prev,
      { id: crypto.randomUUID(), clientName, projectName, status: "稼働中" },
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
              <p className="text-sm text-slate-500">{p.status}</p>
            </div>
            <button
              onClick={() => toggle(p.id, p.status)}
              className="text-sm border rounded-md px-3 py-1.5"
            >
              {p.status === "稼働中" ? "稼働終了にする" : "稼働中に戻す"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
