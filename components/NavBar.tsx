"use client";

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

  const links = [
    { href: "/report/new", label: "日報入力", show: role === "作業者" },
    { href: "/report/history", label: "日報一覧", show: true },
    { href: "/dashboard", label: "ダッシュボード", show: true },
    { href: "/admin/projects", label: "案件管理", show: role === "管理者" },
    { href: "/admin/subcontractors", label: "協力業者管理", show: role === "管理者" },
    { href: "/admin/users", label: "ユーザー管理", show: role === "管理者" },
  ].filter((l) => l.show);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="flex items-center justify-between gap-2 px-4 py-3 max-w-3xl mx-auto">
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
    </header>
  );
}
