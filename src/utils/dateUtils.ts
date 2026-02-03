/** 日付をYYYY-MM-DD形式でフォーマット */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 日時をYYYY-MM-DD HH:mm:ss形式でフォーマット */
export function formatDateTime(date: Date): string {
  const datePart = formatDate(date);
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${datePart} ${h}:${min}:${s}`;
}

/** ユニークIDを生成 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
