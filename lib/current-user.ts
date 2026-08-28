import { getSession } from "./session";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;
  return { id: session.userId, name: session.name, role: session.role };
}
