"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function NavBar({
  name,
  role,
}: {
  name: string;
  role: "作業者" | "事務" | "管理者";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/report/new", label: "日報入力", show: role === "作業者" },
    { href: "/report/history", label: "日報一覧", show: true },
    { href: "/dashboard", label: "ダッシュボード", show: true },
    { href: "/admin/projects", label: "案件管理", show: role === "管理者" },
    { href: "/admin/subcontractors", label: "協力業者管理", show: role === "管理者" },
    { href: "/admin/users", label: "ユーザー管理", show: role === "管理者" },
  ].filter((l) => l.show);

  const currentLabel = links.find((l) => l.href === pathname)?.label ?? "メニュー";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-3xl mx-auto">
        {/* Mobile: current page on the left, hamburger on the right */}
        <div className="flex sm:hidden items-center justify-between gap-2 px-4 py-3">
          <span className="font-medium text-slate-800">{currentLabel}</span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-center w-9 h-9 -mr-1.5 text-slate-800"
            aria-expanded={open}
            aria-label="メニュー"
          >
            <span className="text-2xl leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
        {open && (
          <div className="sm:hidden border-t px-2 py-2">
            <p className="px-2 pb-2 text-xs text-slate-400">{name}</p>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-base ${
                  pathname === l.href
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2.5 rounded-md text-base text-slate-500 hover:bg-slate-100 border-t mt-1 pt-3"
            >
              ログアウト
            </button>
          </div>
        )}

        {/* Desktop / tablet: full horizontal nav */}
        <div className="hidden sm:flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto min-w-0">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
                  pathname === l.href
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 pl-2 flex-shrink-0">
            <span className="text-sm text-slate-500 whitespace-nowrap">{name}</span>
            <button
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-900 whitespace-nowrap"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
