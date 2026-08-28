import { getRecords } from "@/lib/sheets";
import { getCurrentUser } from "@/lib/current-user";
import NavBar from "@/components/NavBar";
import AdminUsersClient from "@/components/AdminUsersClient";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  const rows = await getRecords("ユーザー");

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar name={user!.name} role={user!.role} />
      <main className="max-w-3xl mx-auto p-4">
        <h1 className="text-lg font-semibold mb-4 text-slate-800">ユーザー管理</h1>
        <AdminUsersClient
          initial={rows.map((r) => ({ id: r.id, name: r.name, role: r.role, status: r.status }))}
        />
      </main>
    </div>
  );
}
