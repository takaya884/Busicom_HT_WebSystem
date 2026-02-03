/** スキャンしたバーコードデータ */
export interface ScannedData {
  id: string;
  value: string;
  scannedAt: string; // ISO 8601
}

/** ログエントリ */
export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  category: 'SCAN' | 'OPERATION' | 'NETWORK' | 'SYSTEM';
  message: string;
}

/** メニュー項目 */
export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  description: string;
}

/** サーバー送信結果 */
export interface SendResult {
  success: boolean;
  message: string;
  sentCount?: number;
}
