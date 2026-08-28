import { getRecords } from "./sheets";

export async function getActiveProjects() {
  const rows = await getRecords("案件マスタ");
  return rows
    .filter((r) => r.status === "稼働中")
    .map((r) => ({
      id: r.id,
      clientName: r.client_name,
      projectName: r.project_name,
      label: r.client_name ? `【${r.client_name}】${r.project_name}` : r.project_name,
    }));
}

export async function getActiveSubcontractors() {
  const rows = await getRecords("協力業者マスタ");
  return rows.filter((r) => r.status === "有効").map((r) => ({ id: r.id, name: r.name }));
}

export async function getExpenseCategories() {
  const rows = await getRecords("経費費目マスタ");
  return rows
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((r) => ({ id: r.id, name: r.name }));
}

export async function getActiveUsers() {
  const rows = await getRecords("ユーザー");
  return rows
    .filter((r) => r.status === "有効")
    .map((r) => ({ id: r.id, name: r.name, role: r.role }));
}
