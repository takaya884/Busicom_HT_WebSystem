import initSqlJs, { type Database } from 'sql.js';

const DB_STORAGE_KEY = 'ht_sqlite_db';

let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

/**
 * SQLiteデータベースを初期化
 * WASMファイルはCDNから読み込み
 */
export async function initDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async function () {
    // sql.jsのWASMを初期化（CDNから読み込み）
    const SQL = await initSqlJs({
      locateFile: function (file: string) {
        return 'https://sql.js.org/dist/' + file;
      },
    });

    // localStorageから既存のDBを復元、なければ新規作成
    const savedDb = localStorage.getItem(DB_STORAGE_KEY);
    if (savedDb) {
      try {
        const uint8Array = base64ToUint8Array(savedDb);
        db = new SQL.Database(uint8Array);
      } catch (_e) {
        // 復元失敗時は新規作成
        db = new SQL.Database();
        createTables(db);
      }
    } else {
      db = new SQL.Database();
      createTables(db);
    }

    return db;
  })();

  return initPromise;
}

/**
 * テーブルを作成
 */
function createTables(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS scanned_data (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      scanned_at TEXT NOT NULL
    )
  `);
}

/**
 * データベースをlocalStorageに保存
 */
export function saveDatabase(): void {
  if (!db) return;

  const data = db.export();
  const base64 = uint8ArrayToBase64(data);
  localStorage.setItem(DB_STORAGE_KEY, base64);
}

/**
 * データベースを取得（初期化済みの場合）
 */
export function getDatabase(): Database | null {
  return db;
}

/**
 * Uint8ArrayをBase64に変換
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64をUint8Arrayに変換
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
