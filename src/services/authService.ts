import { writeLog } from './logService';
import { getDatabase, saveDatabase } from './sqliteService';
import { checkNetwork } from './networkService';
import type { AuthResult } from '../types';

/** APIのベースURLを取得 */
function getAuthApiUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || '/api/scanned-data';
  // /api/scanned-data → /api/auth/login に変換
  const baseUrl = apiUrl.replace(/\/api\/.*$/, '/api');
  return baseUrl + '/auth/login';
}

/** オンライン認証: サーバーのDBにID/パスワードを問い合わせ */
async function authenticateOnline(userId: string, password: string): Promise<AuthResult> {
  const url = getAuthApiUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 10000);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId, password: password }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      // 認証成功時、ローカルDBにユーザー情報をキャッシュ
      saveUserToLocal(userId, password);
      writeLog('INFO', 'SYSTEM', 'オンライン認証成功: ' + userId);
      return { success: true, message: 'ログインしました', userId: data.userId || userId };
    } else if (response.status === 401) {
      writeLog('WARN', 'SYSTEM', 'オンライン認証失敗（認証エラー）: ' + userId);
      return { success: false, message: 'IDまたはパスワードが正しくありません' };
    } else {
      writeLog('ERROR', 'SYSTEM', 'オンライン認証失敗（サーバーエラー）: status=' + response.status);
      return { success: false, message: 'サーバーエラーが発生しました' };
    }
  } catch (_e) {
    writeLog('ERROR', 'SYSTEM', 'オンライン認証失敗（通信エラー）');
    return { success: false, message: 'サーバーに接続できませんでした' };
  }
}

/** オフライン認証: 端末のSQLiteでID/パスワードを照合 */
function authenticateOffline(userId: string, password: string): AuthResult {
  const db = getDatabase();
  if (!db) {
    writeLog('ERROR', 'SYSTEM', 'オフライン認証失敗: DB未初期化');
    return { success: false, message: 'データベースが初期化されていません' };
  }

  const result = db.exec(
    "SELECT id FROM users WHERE id = ? AND password = ?",
    [userId, password]
  );

  if (result.length > 0 && result[0].values.length > 0) {
    writeLog('INFO', 'SYSTEM', 'オフライン認証成功: ' + userId);
    return { success: true, message: 'ログインしました（オフライン）', userId: userId };
  }

  writeLog('WARN', 'SYSTEM', 'オフライン認証失敗: ' + userId);
  return { success: false, message: 'IDまたはパスワードが正しくありません' };
}

/** ローカルDBにユーザー情報を保存（オフライン認証用キャッシュ） */
function saveUserToLocal(userId: string, password: string): void {
  const db = getDatabase();
  if (!db) return;

  db.run(
    "INSERT OR REPLACE INTO users (id, password) VALUES (?, ?)",
    [userId, password]
  );
  saveDatabase();
}

/**
 * ログイン処理
 * オンライン時: サーバー認証 → ローカルにキャッシュ
 * オフライン時: ローカルSQLiteで認証
 */
export async function login(userId: string, password: string): Promise<AuthResult> {
  if (!userId || !password) {
    return { success: false, message: 'IDとパスワードを入力してください' };
  }

  const isOnline = await checkNetwork();

  if (isOnline) {
    writeLog('INFO', 'SYSTEM', 'オンラインモードで認証開始');
    return authenticateOnline(userId, password);
  } else {
    writeLog('INFO', 'SYSTEM', 'オフラインモードで認証開始');
    return authenticateOffline(userId, password);
  }
}
