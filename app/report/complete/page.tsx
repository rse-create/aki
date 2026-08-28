import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import NavBar from "@/components/NavBar";

export default async function ReportCompletePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar name={user!.name} role={user!.role} />
      <main className="max-w-3xl mx-auto p-4 flex items-center justify-center min-h-[75vh]">
        <div className="bg-white border rounded-2xl shadow-sm px-8 py-10 text-center max-w-sm w-full">
          <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center animate-bounce">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">お疲れ様でした！</h1>
          <p className="text-sm text-slate-500 mb-8">本日の日報を送信しました。</p>
          <Link
            href="/report/new"
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-3 font-medium transition-colors"
          >
            戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
