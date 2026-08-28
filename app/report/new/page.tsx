import { getActiveProjects, getActiveSubcontractors, getExpenseCategories } from "@/lib/masters";
import { getCurrentUser } from "@/lib/current-user";
import NavBar from "@/components/NavBar";
import ReportForm from "@/components/ReportForm";

export default async function NewReportPage() {
  const user = await getCurrentUser();
  const [projects, subcontractors, categories] = await Promise.all([
    getActiveProjects(),
    getActiveSubcontractors(),
    getExpenseCategories(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar name={user!.name} role={user!.role} />
      <main className="max-w-3xl mx-auto p-4">
        <h1 className="text-lg font-semibold mb-4 text-slate-800">日報入力</h1>
        <ReportForm projects={projects} subcontractors={subcontractors} categories={categories} />
      </main>
    </div>
  );
}
