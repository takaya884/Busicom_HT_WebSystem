/**
 * 開発モード判定
 * VITE_DEV_MODE=true の場合、サーバー接続を擬似化する
 */
export function isDevMode(): boolean {
  return import.meta.env.VITE_DEV_MODE === 'true';
}
