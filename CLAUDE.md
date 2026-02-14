# React_HT プロジェクト規定

やり取りをするときは、日本語でやりとりする。
reactの実装のディレクトリ設計や、アーキテクチャのベストプラクティクスを意識する。
リンターエラーをおこなさないようにする。
実装後、必ず動作確認する。

## プロジェクト概要

NLS-MT37 ハンディターミナル向けのオフラインウェブデータ収集システム。バーコードスキャン、SQLite蓄積、サーバー一括送信を主な機能とする。

- **対象端末**: Newland NLS-MT37 (2.8インチ 320×240、Android 8.1 Go)
- **プロジェクト名**: ht-app (React_HT)
- **言語**: TypeScript

---

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite |
| ルーティング | React Router v7 (HashRouter) |
| データベース | SQLite (sql.js / WebAssembly) |
| 永続化 | localStorage (DBをBase64保存) |
| スタイリング | CSS Modules |
| ビルド形式 | IIFE (file:// プロトコル対応) |

---

## ディレクトリ構成

```
src/
├── components/         # 再利用可能なUIコンポーネント
│   ├── layout/         # AppLayout, Header
│   └── common/         # Toast, StatusBadge
├── pages/              # ページコンポーネント（ルートと1:1対応）
├── hooks/              # カスタムフック (useScanner等)
├── services/           # ビジネスロジック・データアクセス（React非依存）
│   ├── sqliteService.ts
│   ├── storageService.ts
│   ├── logService.ts
│   └── networkService.ts
├── types/              # 型定義の集約
├── utils/              # 汎用ユーティリティ
├── App.tsx             # ルーティング定義
└── main.tsx            # エントリポイント（SQLite初期化）
```

---

## コーディング規定

### スタイリング
- **CSS Modules** を必須とする
- 各コンポーネントに対応する `.module.css` を対で配置
- 画面解像度 320×240px に最適化し、`px` 単位でサイズ管理
- クラス名はコンポーネント名と対応させる（例: `MenuPage.module.css`）

### 型定義
- 新規型は `src/types/index.ts` に追加
- 既存の `ScannedData`, `LogEntry`, `MenuItem`, `SendResult` を再利用可能なものは流用する

### Services層
- ReactのAPIに依存しない純粋なTypeScript関数として実装
- データアクセス・ビジネスロジックを担当
- 副作用（localStorage、SQLite、fetch）はServicesで集約

### ルーティング
- **HashRouter** を使用（`file://` プロトコル対応のため）
- パスは小文字・ハイフン区切り（例: `/data-list`, `/delivery-check`）

---

## 画面追加手順

1. `src/pages/NewPage.tsx` と `src/pages/NewPage.module.css` を作成
2. `src/App.tsx` に `<Route path="/new-path" element={<NewPage />} />` を追加
3. `src/pages/MenuPage.tsx` の `MENU_ITEMS` 配列にエントリを追加

```typescript
{
  id: 'new-feature',
  label: '新機能',
  path: '/new-path',
  icon: '🆕',
  description: '説明文',
}
```

---

## 環境・ビルド

### 重要設定
- `base: './'` — 相対パスでアセット読込
- `format: 'iife'` — ESモジュール非対応ブラウザ対応
- `target: 'es2015'` — AOSPブラウザ (Chromium 61) 対応

### 環境変数
- `.env.example` をコピーして `.env` を作成
- 送信先API: `VITE_API_URL`

---

## 参照ドキュメント

- **REACT_ARCHITECTURE.md** — レイヤー構成、データフロー、ログ設計
- **README.md** — セットアップ、デプロイ、API仕様
