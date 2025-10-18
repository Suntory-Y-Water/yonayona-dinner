# プロジェクト概要

## プロジェクト名
yonayona-dinner（よなよなディナー）

## 目的
22時以降も営業中の飲食店だけを地図で表示するWebアプリケーション。
疲れていても"今開いてる店"を2タップで発見できる体験を提供する。

## ターゲット
- 地域：東京都＋首都圏近郊
- 属性：男性サラリーマン（20代後半〜40代前半）
- シーン：残業後・終電後・軽く一杯・深夜の外食

## コア機能（MVP）
- 起動直後に現在地中心の地図が開く
- 営業中の店のみピン表示
- ピン詳細に「店名／住所／営業時間／閉店までの残り分数」
- 外部ナビはGoogleマップへ委任
- 時間調整UI（デフォルト23:00基準で可変）

## プロジェクト構造
Bun + Hono + Vite + React によるモノレポ構成（Turboで管理）

```
.
├── client/               # React frontend (Vite + React)
├── server/               # Hono backend
├── shared/               # 共通の型定義
│   └── src/types/        # TypeScript型定義
├── docs/                 # ドキュメント
│   ├── client/          # クライアント関連ドキュメント
│   ├── server/          # サーバー関連ドキュメント
│   └── shared/          # 共通ドキュメント
├── package.json          # ルートpackage.json（workspaces定義）
└── turbo.json            # Turbo設定
```

## 主要依存関係
- パッケージマネージャー: Bun 1.2.4
- バックエンドフレームワーク: Hono
- フロントエンドフレームワーク: React 19.2.0 + Vite
- UIライブラリ: shadcn/ui（Tailwind CSS + Radix UI）
- ルーティング: React Router
- モノレポ管理: Turbo
- リンター・フォーマッター: Biome
