# 技術スタック

## フロントエンド
- **フレームワーク**: React 19.2.0
- **ビルドツール**: Vite 6.4.0
- **スタイリング**: Tailwind CSS 4.1.14 + shadcn/ui
- **ルーティング**: React Router 7.9.4
- **UIコンポーネント**: 
  - Radix UI (React Slot)
  - lucide-react（アイコン）
  - class-variance-authority（バリアント管理）
- **地図表示**: Google Maps JavaScript API
- **日時処理**: date-fns + date-fns-tz（予定）

## バックエンド
- **フレームワーク**: Hono 4.10.1
- **ランタイム**: Bun
- **実行環境**: Cloudflare Workers（予定）
- **キャッシュ**: Cloudflare KV / Cache API（予定）
- **外部API**: Google Places API（Nearby Search / Place Details）

## 共通（shared）
- **言語**: TypeScript 5.9.3（client）/ 5.8.3（shared）
- **型定義**: workspace間で共有される型定義
- **ビルド**: TypeScriptコンパイラ（tsc）

## 開発ツール
- **モノレポ管理**: Turbo 2.5.5
- **リンター**: Biome 2.2.6
- **フォーマッター**: Biome（indent: space 2, lineWidth: 80, quoteStyle: double）
- **型チェック**: TypeScript strict mode有効
- **テストランナー**: Bunテストランナー（予定）

## デプロイ
- **フロントエンド**: Cloudflare Pages（予定）
- **バックエンド**: Cloudflare Workers
- **デプロイツール**: Wrangler 4.43.0

## セキュリティ
- APIキーはHono環境変数のみで保持
- クライアントからGoogle APIへ直接アクセス禁止
- 個人情報の保存なし（位置情報は端末内のみ使用）
