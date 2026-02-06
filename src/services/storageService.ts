import type { ScannedData } from '../types';
import { writeLog } from './logService';
import { getDatabase, saveDatabase } from './sqliteService';

/**
 * 蓄積データを全件取得
 * SQLiteから取得、DBが初期化されていなければ空配列を返す
 */
export function getScannedData(): ScannedData[] {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  const result = db.exec('SELECT id, value, scanned_at FROM scanned_data ORDER BY scanned_at ASC');
  if (result.length === 0) {
    return [];
  }

  const rows = result[0].values;
  return rows.map(function (row: (string | number | Uint8Array | null)[]) {
    return {
      id: String(row[0]),
      value: String(row[1]),
      scannedAt: String(row[2]),
    };
  });
}

/**
 * スキャンデータを追加
 */
export function addScannedData(item: ScannedData): void {
  const db = getDatabase();
  if (!db) {
    writeLog('ERROR', 'SYSTEM', 'データベースが初期化されていません');
    return;
  }

  db.run(
    'INSERT INTO scanned_data (id, value, scanned_at) VALUES (?, ?, ?)',
    [item.id, item.value, item.scannedAt]
  );
  saveDatabase();
  writeLog('INFO', 'SCAN', 'バーコード読取: ' + item.value);
}

/**
 * 蓄積データ件数を取得
 */
export function getScannedDataCount(): number {
  const db = getDatabase();
  if (!db) {
    return 0;
  }

  const result = db.exec('SELECT COUNT(*) FROM scanned_data');
  if (result.length === 0) {
    return 0;
  }

  return Number(result[0].values[0][0]);
}

/**
 * 指定IDのデータを削除
 */
export function removeScannedData(id: string): void {
  const db = getDatabase();
  if (!db) {
    return;
  }

  // 削除前にログ用に値を取得
  const result = db.exec('SELECT value FROM scanned_data WHERE id = ?', [id]);
  const value = result.length > 0 ? String(result[0].values[0][0]) : id;

  db.run('DELETE FROM scanned_data WHERE id = ?', [id]);
  saveDatabase();
  writeLog('INFO', 'OPERATION', 'データ削除: ' + value);
}

/**
 * 送信済みデータをクリア
 */
export function clearScannedData(): void {
  const db = getDatabase();
  if (!db) {
    return;
  }

  db.run('DELETE FROM scanned_data');
  saveDatabase();
  writeLog('INFO', 'OPERATION', '蓄積データをクリアしました');
}
