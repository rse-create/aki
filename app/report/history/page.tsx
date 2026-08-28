import { getRecords } from "@/lib/sheets";
import { getCurrentUser } from "@/lib/current-user";
import NavBar from "@/components/NavBar";

export default async function ReportHistoryPage() {
  const user = await getCurrentUser();
  const rows = await getRecords("日報");

  const scoped = (user!.role === "作業者" ? rows.filter((r) => r.user_id === user!.id) : rows)
    .slice()
    .sort((a, b) => (a.work_date < b.work_date ? 1 : -1))
    .slice(0, 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar name={user!.name} role={user!.role} />
      <main className="max-w-3xl mx-auto p-4">
        <h1 className="text-lg font-semibold mb-4 text-slate-800">日報一覧</h1>
        <div className="bg-white rounded-lg border divide-y">
          {scoped.map((r) => (
            <div key={r.id} className="p-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>{r.work_date}</span>
                <span>{r.user_name}</span>
              </div>
              <p className="font-medium text-slate-800">{r.project_name}</p>
              <p className="text-slate-600">{r.work_content}</p>
              <p className="text-slate-500 mt-1">
                {r.start_time}〜{r.end_time}（実働 {r.work_hours}h） / 協力業者:{" "}
                {r.has_subcontractor}
              </p>
            </div>
          ))}
          {scoped.length === 0 && <p className="p-4 text-slate-400 text-sm">日報はまだありません</p>}
        </div>
      </main>
    </div>
  );
}
