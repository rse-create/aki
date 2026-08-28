import { getRecords } from "@/lib/sheets";
import { getCurrentUser } from "@/lib/current-user";
import NavBar from "@/components/NavBar";
import AdminProjectsClient from "@/components/AdminProjectsClient";

export default async function AdminProjectsPage() {
  const user = await getCurrentUser();
  const projects = await getRecords("案件マスタ");

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar name={user!.name} role={user!.role} />
      <main className="max-w-3xl mx-auto p-4">
        <h1 className="text-lg font-semibold mb-4 text-slate-800">案件管理</h1>
        <AdminProjectsClient
          initialProjects={projects.map((p) => ({
            id: p.id,
            clientName: p.client_name,
            projectName: p.project_name,
            status: p.status,
          }))}
        />
      </main>
    </div>
  );
}
