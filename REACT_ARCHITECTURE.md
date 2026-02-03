# React アーキテクチャ設計ドキュメント

## 設計方針

本プロジェクトは、2.8インチ(320x240)のハンディターミナル向けに最適化されたReactアプリケーションです。画面追加に対応できるスケーラブルな設計を採用しています。

## アーキテクチャ概要

```
┌─────────────────────────────────────┐
│              Pages                  │  ← ページ単位の画面
├─────────────────────────────────────┤
│          Components                 │  ← 再利用可能なUI部品
├──────────┬──────────────────────────┤
│  Hooks   │      Services           │  ← ロジック層
├──────────┴──────────────────────────┤
│        Types / Utils                │  ← 共通定義・ユーティリティ
└─────────────────────────────────────┘
```

## レイヤー構成

### 1. Pages層 (`src/pages/`)

各画面を1ファイルで管理。ルーティングと直接対応する。

- `MenuPage` - メニュー画面
- `ScanPage` - データ読取画面
- `SendPage` - サーバー送信画面

**画面追加時**: 新しいページコンポーネントを作成し、`App.tsx`のRoutesに追加、`MenuPage.tsx`のMENU_ITEMS配列にエントリを追加するだけ。

### 2. Components層 (`src/components/`)

#### layout/ - レイアウト系
- `AppLayout` - 全画面共通のレイアウトラッパー(Header + main領域)
- `Header` - ヘッダーバー(タイトル・戻るボタン)

#### common/ - 汎用UI部品
- `Toast` - 通知メッセージ(成功/エラー/情報)
- `StatusBadge` - 件数表示バッジ

### 3. Hooks層 (`src/hooks/`)

Reactのカスタムフック。UIロジックの再利用を担当。

- `useScanner` - バーコードスキャナー入力制御(ref管理、Enter検知、自動フォーカス)

### 4. Services層 (`src/services/`)

ビジネスロジックとデータアクセスを担当。ReactのAPIに依存しない純粋なTypeScript関数。

- `storageService` - スキャンデータのCRUD操作
- `logService` - ログの書込・読出・古いログの自動削除
- `networkService` - ネットワーク疎通確認・サーバー送信

### 5. Types (`src/types/`)

TypeScriptの型定義を集約。

### 6. Utils (`src/utils/`)

汎用ユーティリティ関数(日付フォーマット、ID生成など)。

## スタイリング方針

**CSS Modules** を採用。

- 各コンポーネントに `.module.css` ファイルを対にして配置
- クラス名の衝突を回避
- 320x240px画面に最適化したサイズ設計
- `px` 単位で厳密にサイズ管理(HTの固定解像度のため)

## ルーティング

**HashRouter** を使用。

理由:
- HTではファイルシステムから直接HTMLを開く場合がある
- `file://` プロトコルではBrowserRouterが動作しない
- HashRouter (`/#/path`) なら `index.html` の直接アクセスでも問題なく動作

## 画面追加手順

新しい画面を追加する場合:

1. `src/pages/NewPage.tsx` と `src/pages/NewPage.module.css` を作成
2. `src/App.tsx` に `<Route path="/new" element={<NewPage />} />` を追加
3. `src/pages/MenuPage.tsx` の `MENU_ITEMS` 配列にメニュー項目を追加

```typescript
// MenuPage.tsx のMENU_ITEMSに追加
{
  id: 'new-feature',
  label: '新機能',
  path: '/new',
  icon: '🆕',
  description: '新機能の説明',
}
```

メニュー画面はグリッドレイアウトのため、ボタンが増えても自動的に折り返されます。

## データフロー

```
バーコードスキャン
  ↓ (HIDキーボード入力)
useScanner フック (Enter検知)
  ↓
storageService.addScannedData()
  ↓
localStorage に保存 + logService でログ記録
  ↓ (送信画面で)
networkService.checkNetwork()
  ↓ (接続OK)
networkService.sendData()
  ↓ (成功)
storageService.clearScannedData()
```

## ログシステム設計

- localStorage に日付別キー(`ht_log_YYYY-MM-DD`)で保存
- ログレベル: `INFO` / `WARN` / `ERROR`
- カテゴリ: `SCAN` / `OPERATION` / `NETWORK` / `SYSTEM`
- アプリ起動時に2週間超過ログを自動クリーンアップ
- ブラウザのlocalStorageに保存されるため、HT端末のストレージ容量に注意

## パフォーマンス考慮

- 320x240解像度に最適化し、不要なリフローを回避
- CSS Modulesによりスタイルのスコープを限定
- localStorageアクセスは同期的だが、HTの少量データ(バーコード文字列)では問題なし
- コンポーネントの分割粒度を適切に保ち、不要な再レンダリングを防止
