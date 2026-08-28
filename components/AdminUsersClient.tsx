"use client";

import { useState } from "react";

type Item = { id: string; name: string; role: string; status: string };

export default function AdminUsersClient({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [role, setRole] = useState("作業者");
  const [saving, setSaving] = useState(false);
  const [lastPin, setLastPin] = useState<{ name: string; pin: string } | null>(null);

  async function add() {
    if (!name) return;
    setSaving(true);
    const res = await fetch("/api/masters/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role }),
    });
    const body = await res.json();
    setSaving(false);
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name, role, status: "有効" }]);
    setLastPin({ name, pin: body.pin });
    setName("");
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === "有効" ? "無効" : "有効";
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: next } : i)));
    await fetch("/api/masters/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle-status" }),
    });
  }

  async function resetPin(id: string, name: string) {
    const res = await fetch("/api/masters/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "reset-pin" }),
    });
    const body = await res.json();
    setLastPin({ name, pin: body.pin });
  }

  return (
    <div className="space-y-4">
      {lastPin && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-sm">
          <strong>{lastPin.name}</strong> の新しいPIN: <span className="font-mono text-lg">{lastPin.pin}</span>
          <p className="text-amber-700 mt-1">この場でのみ表示されます。本人に伝えてください。</p>
        </div>
      )}

      <section className="bg-white rounded-lg border p-4 space-y-3">
        <h2 className="font-medium text-slate-800">新規ユーザーを追加</h2>
        <input
          type="text"
          placeholder="氏名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border rounded-md px-3 py-2">
          <option value="作業者">作業者</option>
          <option value="事務">事務</option>
          <option value="管理者">管理者</option>
        </select>
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
              <p className="font-medium text-slate-800">
                {i.name} <span className="text-sm text-slate-400">({i.role})</span>
              </p>
              <p className="text-sm text-slate-500">{i.status}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => resetPin(i.id, i.name)} className="text-sm border rounded-md px-3 py-1.5">
                PIN再発行
              </button>
              <button onClick={() => toggleStatus(i.id, i.status)} className="text-sm border rounded-md px-3 py-1.5">
                {i.status === "有効" ? "無効にする" : "有効に戻す"}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
