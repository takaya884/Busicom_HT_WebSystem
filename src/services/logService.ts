import type { LogEntry } from '../types';
import { formatDate, formatDateTime } from '../utils/dateUtils';

const LOG_PREFIX = 'ht_log_';
const RETENTION_DAYS = 14;

/** ログキー(日付ベース)を取得 */
function getLogKey(date: Date): string {
  return `${LOG_PREFIX}${formatDate(date)}`;
}

/** ログを追記 */
export function writeLog(
  level: LogEntry['level'],
  category: LogEntry['category'],
  message: string
): void {
  const now = new Date();
  const entry: LogEntry = {
    timestamp: formatDateTime(now),
    level,
    category,
    message,
  };

  const key = getLogKey(now);
  const existing = localStorage.getItem(key);
  const logs: LogEntry[] = existing ? JSON.parse(existing) : [];
  logs.push(entry);
  localStorage.setItem(key, JSON.stringify(logs));

  // 古いログを削除
  cleanOldLogs();
}

/** 2週間以上前のログを削除 */
function cleanOldLogs(): void {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key?.startsWith(LOG_PREFIX)) continue;

    const dateStr = key.replace(LOG_PREFIX, '');
    const logDate = new Date(dateStr);
    if (logDate < cutoff) {
      localStorage.removeItem(key);
    }
  }
}

/** 指定日のログを取得 */
export function getLogsByDate(date: Date): LogEntry[] {
  const key = getLogKey(date);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

/** 全ログキー(日付)を取得 */
export function getLogDates(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LOG_PREFIX)) {
      dates.push(key.replace(LOG_PREFIX, ''));
    }
  }
  return dates.sort().reverse();
}
