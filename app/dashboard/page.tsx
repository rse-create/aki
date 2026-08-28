import { getCurrentUser } from "@/lib/current-user";
import NavBar from "@/components/NavBar";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar name={user!.name} role={user!.role} />
      <main className="max-w-3xl mx-auto p-4">
        <h1 className="text-lg font-semibold mb-4 text-slate-800">ダッシュボード</h1>
        <DashboardClient />
      </main>
    </div>
  );
}
