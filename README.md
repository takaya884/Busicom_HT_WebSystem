# HT データ収集システム

NLS-MT37 ハンディターミナル向けオフラインウェブデータ収集システム

## システム概要

本システムは、ハンディターミナル（HT）でバーコードを読み取り、オフライン環境下でデータを蓄積し、ネットワーク接続時にサーバーへ一括送信するためのウェブアプリケーションです。

### 運用フロー

1. HTでウェブアプリを起動 → メニュー画面
2. **データ読取画面**: オフライン状態でバーコードをスキャン → SQLiteに蓄積
3. **データ確認画面**: 蓄積データの確認・個別削除・全削除
4. **サーバー送信画面**: ネットワーク接続確認後、蓄積データをサーバーに一括送信
5. **終了**: メニュー画面右上の「終了」ボタンでシステム終了（蓄積データは削除）

### 対応端末

- **機種**: Newland NLS-MT37
- **OS**: Android 8.1 Go
- **画面**: 2.8インチ (320 × 240)
- **通信**: WiFi (802.11 a/b/g/n/ac) / Bluetooth 5.0 / 4G LTE (SIMフリー)
- **読取**: 1D/2Dバーコード対応
- **ブラウザ**: AOSPブラウザ / Chrome対応

## 技術スタック

| 項目 | 技術 |
|---|---|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite |
| ルーティング | React Router v7 (HashRouter) |
| データベース | SQLite (sql.js - WebAssembly実装) |
| データ永続化 | localStorage (SQLiteのDBファイルをBase64保存) |
| スタイリング | CSS Modules |
| ビルド形式 | IIFE (file://プロトコル対応) |

## ディレクトリ構成

```
src/
├── components/         # 再利用可能なUIコンポーネント
│   ├── layout/         # レイアウト系 (Header, AppLayout)
│   └── common/         # 汎用部品 (Toast, StatusBadge)
├── pages/              # ページコンポーネント
│   ├── MenuPage.tsx    # メニュー画面
│   ├── ScanPage.tsx    # データ読取画面
│   ├── DataListPage.tsx # データ確認画面
│   └── SendPage.tsx    # サーバー送信画面
├── hooks/              # カスタムフック
│   └── useScanner.ts   # バーコードスキャナー入力制御
├── services/           # ビジネスロジック・データアクセス
│   ├── sqliteService.ts  # SQLiteデータベース管理
│   ├── storageService.ts # スキャンデータCRUD操作
│   ├── logService.ts     # ログ管理
│   └── networkService.ts # ネットワーク確認・データ送信
├── types/              # TypeScript型定義
│   └── index.ts
├── utils/              # ユーティリティ関数
│   └── dateUtils.ts
├── App.tsx             # ルーティング定義
├── main.tsx            # エントリーポイント（SQLite初期化）
└── index.css           # グローバルスタイル
```

## SQLiteデータベース

### 概要

スキャンデータの保存にSQLiteを使用しています。ブラウザ環境で動作させるため、[sql.js](https://github.com/sql-js/sql.js)（SQLiteのWebAssembly実装）を採用しています。

### WASMファイルの読み込み

sql.jsのWASMファイルはCDNから読み込みます：

```
https://sql.js.org/dist/sql-wasm.wasm
```

**注意**: 初回起動時にWASMファイル（約1MB）をダウンロードするため、インターネット接続が必要です。

### データ永続化

SQLiteのデータベースファイルはlocalStorageにBase64エンコードして保存されます：

- **キー**: `ht_sqlite_db`
- **形式**: Base64エンコードされたSQLiteデータベースバイナリ
- データ操作のたびに自動保存

### テーブル構造

```sql
CREATE TABLE scanned_data (
  id TEXT PRIMARY KEY,        -- 一意のID (タイムスタンプ + ランダム文字列)
  value TEXT NOT NULL,        -- スキャンしたバーコード値
  scanned_at TEXT NOT NULL    -- スキャン日時 (ISO 8601形式)
);
```

### CRUD操作

| 操作 | 関数 | SQL |
|---|---|---|
| 全件取得 | `getScannedData()` | `SELECT * FROM scanned_data ORDER BY scanned_at ASC` |
| 追加 | `addScannedData(item)` | `INSERT INTO scanned_data VALUES (?, ?, ?)` |
| 件数取得 | `getScannedDataCount()` | `SELECT COUNT(*) FROM scanned_data` |
| 個別削除 | `removeScannedData(id)` | `DELETE FROM scanned_data WHERE id = ?` |
| 全件削除 | `clearScannedData()` | `DELETE FROM scanned_data` |

## ログシステム

- **キー形式**: `ht_log_YYYY-MM-DD`
- 日付ごとにログファイルを分割
- **2週間経過したログは自動削除**
- ログカテゴリ: `SCAN`(読取)、`OPERATION`(操作)、`NETWORK`(通信)、`SYSTEM`(システム)

## サーバー送信

1. 送信ボタン押下
2. `navigator.onLine` で基本チェック
3. 実際にAPIエンドポイントへHEADリクエストで疎通確認
4. 接続不可 → エラーメッセージ表示
5. 接続可 → POSTリクエストでデータ送信
6. 送信成功 → SQLiteのデータをクリア

### API設定

送信先URLは環境変数で設定:

```
VITE_API_URL=https://your-server.example.com/api/scanned-data
```

未設定時は `/api/scanned-data` に送信。

### 送信データ形式

```json
{
  "items": [
    {
      "id": "1234567890-abc",
      "value": "4901234567890",
      "scannedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "sentAt": "2024-01-15T12:00:00.000Z"
}
```

## セットアップ

```bash
# 依存パッケージインストール
npm install

# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# ビルド結果プレビュー
npm run preview
```

## HT端末へのデプロイ

1. `npm run build` で `dist/` フォルダにビルド
2. `dist/` 配下のファイルをHTの内部ストレージまたはWebサーバーに配置
3. HTのブラウザで `index.html` を開く
4. HashRouter + IIFE形式のため、`file://` プロトコルでも動作

### ビルド設定のポイント

| 設定 | 値 | 理由 |
|---|---|---|
| `base` | `./` | 相対パスでアセットを読み込み |
| `format` | `iife` | ESモジュール非対応ブラウザ対応 |
| `target` | `es2015` | AOSPブラウザ (Chromium 61) 対応 |

## 環境変数

.env.exampleをコピーし、.envにファイル名を変更。
環境変数を定義して使用してください。

## バーコード読取の仕組み

NLS-MT37のバーコードリーダーは、読み取ったデータをキーボード入力(HIDモード)として送信します。テキストボックスにフォーカスを当てた状態でスキャンすると、読み取り文字列が入力され、末尾にEnterキーが送信されます。本システムではEnterキーをトリガーとしてデータをSQLiteに蓄積します。
