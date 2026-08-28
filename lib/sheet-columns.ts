/**
 * Maps each tab's semantic field key (used throughout the app's code) to the
 * Japanese column header actually shown in the Google Sheet. Keeps the sheet
 * readable for non-engineers while the codebase stays in English identifiers.
 */
export const COLUMN_LABELS: { [tab: string]: { [field: string]: string } } = {
  日報: {
    id: "ID",
    created_at: "作成日時",
    work_date: "作業日",
    user_id: "作業者ID",
    user_name: "氏名",
    project_id: "案件ID",
    project_name: "案件名称",
    start_time: "開始時刻",
    end_time: "終了時刻",
    break_minutes: "休憩時間(分)",
    work_hours: "実働時間",
    work_content: "作業内容及び進捗状況",
    has_subcontractor: "協力業者有無",
  },
  日報_協力業者: {
    id: "ID",
    report_id: "日報ID",
    subcontractor_id: "協力業者ID",
    subcontractor_name: "協力業者名",
    headcount: "人工数",
    hours: "稼働時間",
    memo: "備考",
  },
  日報_経費: {
    id: "ID",
    report_id: "日報ID",
    category: "費目",
    amount: "金額",
    memo: "メモ",
  },
  案件マスタ: {
    id: "ID",
    client_name: "元請け会社名",
    project_name: "案件名称",
    status: "ステータス",
    created_at: "登録日",
  },
  協力業者マスタ: {
    id: "ID",
    name: "業者名",
    status: "ステータス",
    created_at: "登録日",
  },
  経費費目マスタ: {
    id: "ID",
    name: "費目名",
    sort_order: "表示順",
  },
  ユーザー: {
    id: "ID",
    name: "氏名",
    pin_hash: "PINハッシュ",
    role: "権限",
    status: "ステータス",
  },
};
