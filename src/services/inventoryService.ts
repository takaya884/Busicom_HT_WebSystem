import { writeLog } from './logService';
import { checkNetwork } from './networkService';
import { isDevMode } from '../utils/envUtils';
import type { InventoryConfig, InventoryRecord } from '../types';

/** APIのベースURLを取得 */
function getInventoryApiBase(): string {
  const apiUrl = import.meta.env.VITE_API_URL || '/api/scanned-data';
  const baseUrl = apiUrl.replace(/\/api\/.*$/, '/api');
  return baseUrl + '/inventory';
}

/**
 * 棚卸設定をバックエンドから取得
 * オンライン/オフラインの設定はバックエンドのDBに持たせる
 */
export async function fetchInventoryConfig(): Promise<InventoryConfig> {
  // 開発モードでは常にオンラインとして扱う
  if (isDevMode()) {
    writeLog('INFO', 'SYSTEM', '[DEV] 棚卸設定: オンラインモード（擬似）');
    return { mode: 'online' };
  }

  const isOnline = await checkNetwork();
  if (!isOnline) {
    writeLog('WARN', 'NETWORK', '棚卸設定取得失敗: オフライン状態');
    return { mode: 'offline' };
  }

  try {
    const url = getInventoryApiBase() + '/config';
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 10000);
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      writeLog('INFO', 'SYSTEM', '棚卸設定取得成功: mode=' + data.mode);
      return { mode: data.mode || 'online' };
    }

    writeLog('WARN', 'NETWORK', '棚卸設定取得失敗: status=' + response.status);
    return { mode: 'offline' };
  } catch (_e) {
    writeLog('WARN', 'NETWORK', '棚卸設定取得失敗: 通信エラー');
    return { mode: 'offline' };
  }
}

/** 開発モード用の擬似品番データ */
const DEV_PRODUCTS: Record<string, { hinban: string; kata: string; joudai: number }> = {
  '4901085613580': { hinban: 'ABC-001', kata: 'A', joudai: 1500 },
  '4902370551587': { hinban: 'DEF-002', kata: 'B', joudai: 2800 },
  '4905524953152': { hinban: 'GHI-003', kata: 'C', joudai: 980 },
};

/**
 * オンライン時: サーバーからバーコードIDに紐づく品番情報を取得
 */
export async function fetchProductByBarcode(barcode: string): Promise<InventoryRecord | null> {
  // 開発モードでは擬似データを返す
  if (isDevMode()) {
    writeLog('INFO', 'NETWORK', '[DEV] 品番擬似取得: ' + barcode);
    const devProduct = DEV_PRODUCTS[barcode];
    return {
      id: barcode,
      hinban: devProduct ? devProduct.hinban : '',
      kata: devProduct ? devProduct.kata : '',
      joudai: devProduct ? devProduct.joudai : 0,
      registeredAt: new Date().toISOString(),
    };
  }

  try {
    const url = getInventoryApiBase() + '/product?barcode=' + encodeURIComponent(barcode);
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 10000);
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      writeLog('INFO', 'NETWORK', '品番取得成功: ' + barcode);
      return {
        id: barcode,
        hinban: data.hinban || '',
        kata: data.kata || '',
        joudai: data.joudai || 0,
        registeredAt: new Date().toISOString(),
      };
    }

    writeLog('WARN', 'NETWORK', '品番取得失敗: barcode=' + barcode + ', status=' + response.status);
    return null;
  } catch (_e) {
    writeLog('ERROR', 'NETWORK', '品番取得通信エラー: ' + barcode);
    return null;
  }
}

/**
 * 棚卸登録データをサーバーに送信
 */
export async function registerInventory(
  date: string,
  items: InventoryRecord[]
): Promise<{ success: boolean; message: string }> {
  // 開発モードでは擬似登録
  if (isDevMode()) {
    writeLog('INFO', 'NETWORK', '[DEV] 棚卸擬似登録: ' + items.length + '件, 日付=' + date);
    return { success: true, message: '登録しました。確認して下さい。' };
  }

  const isOnline = await checkNetwork();
  if (!isOnline) {
    writeLog('WARN', 'NETWORK', '棚卸登録失敗: オフライン状態');
    return { success: false, message: 'オフラインのため登録できません' };
  }

  try {
    const url = getInventoryApiBase() + '/register';
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 15000);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: date,
        items: items,
        registeredAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      writeLog('INFO', 'NETWORK', '棚卸登録成功: ' + items.length + '件');
      return { success: true, message: '登録しました。確認して下さい。' };
    }

    writeLog('ERROR', 'NETWORK', '棚卸登録失敗: status=' + response.status);
    return { success: false, message: 'サーバーエラーが発生しました' };
  } catch (_e) {
    writeLog('ERROR', 'NETWORK', '棚卸登録通信エラー');
    return { success: false, message: 'サーバーに接続できませんでした' };
  }
}
