import { getActiveUsers } from "@/lib/masters";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const users = await getActiveUsers();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-center mb-6 text-slate-800">
          株式会社Zero 現場日報
        </h1>
        <LoginForm users={users.map((u) => ({ id: u.id, name: u.name }))} />
      </div>
    </div>
  );
}
