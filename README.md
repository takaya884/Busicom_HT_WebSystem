# HT データ収集システム

NLS-MT37 ハンディターミナル向けオフラインウェブデータ収集システム

## システム概要

本システムは、ハンディターミナル（HT）でバーコードを読み取り、オフライン環境下でデータを蓄積し、ネットワーク接続時にサーバーへ一括送信するためのウェブアプリケーションです。

### 運用フロー

1. HTでウェブアプリを起動 → メニュー画面
2. **データ読取画面**: オフライン状態でバーコードをスキャン → ローカルストレージに蓄積
3. **サーバー送信画面**: ネットワーク接続確認後、蓄積データをサーバーに一括送信

### 対応端末

- **機種**: Newland NLS-MT37
- **OS**: Android 8.1 Go
- **画面**: 2.8インチ (320 × 240)
- **通信**: WiFi (802.11 a/b/g/n/ac) / Bluetooth 5.0 / 4G LTE (SIMフリー)
- **読取**: 1D/2Dバーコード対応

## 技術スタック

| 項目 | 技術 |
|---|---|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite |
| ルーティング | React Router v7 (HashRouter) |
| データ保存 | localStorage |
| スタイリング | CSS Modules |

## ディレクトリ構成

```
src/
├── components/         # 再利用可能なUIコンポーネント
│   ├── layout/         # レイアウト系 (Header, AppLayout)
│   └── common/         # 汎用部品 (Toast, StatusBadge)
├── pages/              # ページコンポーネント
│   ├── MenuPage.tsx    # メニュー画面
│   ├── ScanPage.tsx    # データ読取画面
│   └── SendPage.tsx    # サーバー送信画面
├── hooks/              # カスタムフック
│   └── useScanner.ts   # バーコードスキャナー入力制御
├── services/           # ビジネスロジック・データアクセス
│   ├── logService.ts   # ログ管理
│   ├── storageService.ts # スキャンデータ蓄積・管理
│   └── networkService.ts # ネットワーク確認・データ送信
├── types/              # TypeScript型定義
│   └── index.ts
├── utils/              # ユーティリティ関数
│   └── dateUtils.ts
├── App.tsx             # ルーティング定義
├── main.tsx            # エントリーポイント
└── index.css           # グローバルスタイル
```

## データ保存の仕組み

### スキャンデータ

- **キー**: `ht_scanned_data`
- **形式**: `ScannedData[]` (JSON配列)
- バーコード読取ごとに配列に追加
- サーバー送信成功後にクリア

### ログシステム

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
6. 送信成功 → ローカルデータクリア

### API設定

送信先URLは環境変数で設定:

```
VITE_API_URL=https://your-server.example.com/api/scanned-data
```

未設定時は `/api/scanned-data` に送信。

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
4. HashRouter使用のため、ファイル直接アクセスでもルーティングが動作

## バーコード読取の仕組み

NLS-MT37のバーコードリーダーは、読み取ったデータをキーボード入力(HIDモード)として送信します。テキストボックスにフォーカスを当てた状態でスキャンすると、読み取り文字列が入力され、末尾にEnterキーが送信されます。本システムではEnterキーをトリガーとしてデータを蓄積します。
