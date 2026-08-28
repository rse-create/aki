"use client";

import { useState } from "react";

type Item = { id: string; name: string; status: string };

export default function AdminSubcontractorsClient({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!name) return;
    setSaving(true);
    await fetch("/api/masters/subcontractors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name, status: "有効" }]);
    setName("");
  }

  async function toggle(id: string, current: string) {
    const next = current === "有効" ? "無効" : "有効";
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: next } : i)));
    await fetch("/api/masters/subcontractors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
  }

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-slate-800">新規協力業者を追加</h2>
        <input
          type="text"
          placeholder="業者名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        <button
          onClick={add}
          disabled={saving || !name}
          className="bg-slate-900 text-white rounded-md px-4 py-2 disabled:opacity-40"
        >
          追加
        </button>
      </section>

      <section className="bg-white rounded-lg border divide-y">
        {items.map((i) => (
          <div key={i.id} className="p-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{i.name}</p>
              <p className="text-sm text-slate-500">{i.status}</p>
            </div>
            <button
              onClick={() => toggle(i.id, i.status)}
              className="text-sm border rounded-md px-3 py-1.5"
            >
              {i.status === "有効" ? "無効にする" : "有効に戻す"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
