import type { ScannedData } from '../types';
import { writeLog } from './logService';

const STORAGE_KEY = 'ht_scanned_data';

/** 蓄積データを全件取得 */
export function getScannedData(): ScannedData[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/** スキャンデータを追加 */
export function addScannedData(item: ScannedData): void {
  const data = getScannedData();
  data.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  writeLog('INFO', 'SCAN', `バーコード読取: ${item.value}`);
}

/** 蓄積データ件数を取得 */
export function getScannedDataCount(): number {
  return getScannedData().length;
}

/** 送信済みデータをクリア */
export function clearScannedData(): void {
  localStorage.removeItem(STORAGE_KEY);
  writeLog('INFO', 'OPERATION', '蓄積データをクリアしました');
}
