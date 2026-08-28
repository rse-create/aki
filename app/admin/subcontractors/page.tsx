import { getRecords } from "@/lib/sheets";
import { getCurrentUser } from "@/lib/current-user";
import NavBar from "@/components/NavBar";
import AdminSubcontractorsClient from "@/components/AdminSubcontractorsClient";

export default async function AdminSubcontractorsPage() {
  const user = await getCurrentUser();
  const rows = await getRecords("協力業者マスタ");

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar name={user!.name} role={user!.role} />
      <main className="max-w-3xl mx-auto p-4">
        <h1 className="text-lg font-semibold mb-4 text-slate-800">協力業者管理</h1>
        <AdminSubcontractorsClient
          initial={rows.map((r) => ({ id: r.id, name: r.name, status: r.status }))}
        />
      </main>
    </div>
  );
}
