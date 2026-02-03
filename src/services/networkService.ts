import type { ScannedData, SendResult } from '../types';
import { writeLog } from './logService';

/** デフォルトの送信先URL(環境変数で上書き可能) */
const API_URL = import.meta.env.VITE_API_URL || '/api/scanned-data';

/** ネットワーク接続確認 */
export async function checkNetwork(): Promise<boolean> {
  // navigator.onLineで基本チェック
  if (!navigator.onLine) {
    writeLog('WARN', 'NETWORK', 'オフライン状態です');
    return false;
  }

  // 実際にリクエストを送って確認
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(API_URL, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    writeLog('INFO', 'NETWORK', 'ネットワーク接続確認OK');
    return true;
  } catch {
    writeLog('WARN', 'NETWORK', 'サーバーへの接続に失敗しました');
    return false;
  }
}

/** 蓄積データをサーバーに送信 */
export async function sendData(data: ScannedData[]): Promise<SendResult> {
  writeLog('INFO', 'NETWORK', `データ送信開始: ${data.length}件`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: data, sentAt: new Date().toISOString() }),
    });

    if (!response.ok) {
      const msg = `サーバーエラー: ${response.status}`;
      writeLog('ERROR', 'NETWORK', msg);
      return { success: false, message: msg };
    }

    writeLog('INFO', 'NETWORK', `データ送信完了: ${data.length}件`);
    return {
      success: true,
      message: `${data.length}件のデータを送信しました`,
      sentCount: data.length,
    };
  } catch (error) {
    const msg = `送信エラー: ${error instanceof Error ? error.message : '不明なエラー'}`;
    writeLog('ERROR', 'NETWORK', msg);
    return { success: false, message: msg };
  }
}
