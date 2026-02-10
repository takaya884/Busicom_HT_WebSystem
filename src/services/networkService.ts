import type { ScannedData, SendResult } from '../types';
import { writeLog } from './logService';

/** デフォルトの送信先URL(環境変数で上書き可能) */
var API_URL = import.meta.env.VITE_API_URL || '/api/scanned-data';

/** リクエストタイムアウト（ミリ秒） */
var REQUEST_TIMEOUT = 30000;

/** リトライ回数 */
var MAX_RETRIES = 3;

/** リトライ間隔（ミリ秒） */
var RETRY_DELAY = 2000;

/** 現在設定されているAPI URLを取得 */
export function getApiUrl(): string {
  return API_URL;
}

/** API URLを設定（テスト用） */
export function setApiUrl(url: string): void {
  API_URL = url;
  writeLog('INFO', 'NETWORK', 'API URL設定: ' + url);
}

/** ネットワーク接続確認 */
export async function checkNetwork(): Promise<boolean> {
  // navigator.onLineで基本チェック
  if (!navigator.onLine) {
    writeLog('WARN', 'NETWORK', 'オフライン状態です');
    return false;
  }

  // 実際にリクエストを送って確認
  try {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 5000);
    await fetch(API_URL, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    writeLog('INFO', 'NETWORK', 'ネットワーク接続確認OK');
    return true;
  } catch (_e) {
    writeLog('WARN', 'NETWORK', 'サーバーへの接続に失敗しました');
    return false;
  }
}

/** スリープ関数 */
function sleep(ms: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

/** 蓄積データをサーバーに送信（リトライ機能付き） */
export async function sendData(data: ScannedData[]): Promise<SendResult> {
  if (data.length === 0) {
    return { success: false, message: '送信するデータがありません' };
  }

  writeLog('INFO', 'NETWORK', 'データ送信開始: ' + data.length + '件');

  var lastError = '';

  for (var attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT);

      var response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          items: data,
          sentAt: new Date().toISOString(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        var msg = 'サーバーエラー: ' + response.status;
        writeLog('ERROR', 'NETWORK', msg + ' (試行 ' + attempt + '/' + MAX_RETRIES + ')');
        lastError = msg;

        // 4xx系エラーはリトライしない
        if (response.status >= 400 && response.status < 500) {
          return { success: false, message: msg };
        }

        // リトライ前に待機
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY);
        }
        continue;
      }

      // 成功
      writeLog('INFO', 'NETWORK', 'データ送信完了: ' + data.length + '件');
      return {
        success: true,
        message: data.length + '件のデータを送信しました',
        sentCount: data.length,
      };

    } catch (error) {
      var errorMsg = error instanceof Error ? error.message : '不明なエラー';

      if (errorMsg.includes('abort')) {
        errorMsg = 'タイムアウト';
      }

      writeLog('ERROR', 'NETWORK', '送信エラー: ' + errorMsg + ' (試行 ' + attempt + '/' + MAX_RETRIES + ')');
      lastError = errorMsg;

      // リトライ前に待機
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY);
      }
    }
  }

  // 全リトライ失敗
  var finalMsg = '送信失敗: ' + lastError + ' (' + MAX_RETRIES + '回リトライ後)';
  writeLog('ERROR', 'NETWORK', finalMsg);
  return { success: false, message: finalMsg };
}

/** 送信ステータス確認用 */
export interface SendStatus {
  isOnline: boolean;
  apiUrl: string;
  canConnect: boolean;
}

/** 送信前のステータス確認 */
export async function checkSendStatus(): Promise<SendStatus> {
  var isOnline = navigator.onLine;
  var canConnect = false;

  if (isOnline) {
    canConnect = await checkNetwork();
  }

  return {
    isOnline: isOnline,
    apiUrl: API_URL,
    canConnect: canConnect,
  };
}
