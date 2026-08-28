"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ users }: { users: { id: string; name: string }[] }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const selectedUser = users.find((u) => u.id === userId);

  async function submit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, pin }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "ログインに失敗しました");
      setPin("");
      return;
    }
    const body = await res.json();
    router.push(body.role === "作業者" ? "/report/new" : "/dashboard");
    router.refresh();
  }

  if (!selectedUser) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => setUserId(u.id)}
            className="bg-white border rounded-lg py-4 text-center font-medium text-slate-800 shadow-sm active:scale-95 transition"
          >
            {u.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-5 shadow-sm">
      <button
        onClick={() => {
          setUserId(null);
          setPin("");
          setError("");
        }}
        className="text-sm text-slate-400 mb-3"
      >
        ← 氏名を選び直す
      </button>
      <p className="text-center font-medium mb-3">{selectedUser.name}</p>
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        placeholder="PIN (4桁)"
        className="w-full border rounded-md text-center text-2xl tracking-[0.5em] py-3 mb-3"
        autoFocus
      />
      {error && <p className="text-red-600 text-sm text-center mb-3">{error}</p>}
      <button
        onClick={submit}
        disabled={pin.length !== 4 || loading}
        className="w-full bg-slate-900 text-white rounded-md py-3 font-medium disabled:opacity-40"
      >
        {loading ? "確認中..." : "ログイン"}
      </button>
    </div>
  );
}
