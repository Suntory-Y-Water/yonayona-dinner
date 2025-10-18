# ワークスペース構造

## モノレポ構成
Bun workspacesとTurboによるモノレポ管理

```
yonayona-dinner/
├── client/              # Reactフロントエンド
├── server/              # Honoバックエンド
├── shared/              # 共通型定義
├── docs/                # ドキュメント
├── .claude/             # Claude Code設定
├── .serena/             # Serena MCP設定
├── .vscode/             # VSCode設定
├── package.json         # ルート設定（workspaces定義）
├── turbo.json           # Turboビルド設定
├── tsconfig.json        # TypeScript基本設定
└── biome.json           # Biome設定
```

## client/ - Reactフロントエンド
```
client/
├── src/
│   ├── components/      # Reactコンポーネント
│   │   ├── ui/         # shadcn/ui コンポーネント
│   │   └── Home.tsx    # ページコンポーネント
│   ├── lib/            # ユーティリティ関数
│   │   └── utils.ts    # clsx/tailwind-merge統合
│   ├── assets/         # 静的アセット
│   ├── App.tsx         # アプリケーションルート
│   ├── main.tsx        # エントリーポイント
│   └── index.css       # グローバルスタイル
├── package.json        # 依存関係定義
├── vite.config.ts      # Vite設定
├── tsconfig.json       # TypeScript設定
├── tsconfig.app.json   # アプリ用TypeScript設定
└── wrangler.jsonc      # Cloudflare Pages設定
```

主要依存:
- react 19.2.0
- react-router 7.9.4
- tailwindcss 4.1.14
- vite 6.4.0

## server/ - Honoバックエンド
```
server/
├── src/
│   ├── index.ts        # Honoアプリ定義
│   └── client.ts       # クライアント関連処理
├── package.json        # 依存関係定義
├── tsconfig.json       # TypeScript設定
└── wrangler.jsonc      # Cloudflare Workers設定
```

主要依存:
- hono 4.10.1
- yonayona-dinner-shared（workspace参照）

## shared/ - 共通型定義
```
shared/
├── src/
│   ├── types/
│   │   └── index.ts    # 型定義
│   └── index.ts        # エクスポート
├── package.json        # 依存関係定義
└── tsconfig.json       # TypeScript設定
```

ビルド成果物:
- dist/index.js（コンパイル済みJS）
- dist/index.d.ts（型定義ファイル）

## docs/ - ドキュメント
```
docs/
├── client/             # クライアント関連ドキュメント
├── server/             # サーバー関連ドキュメント
└── shared/             # 共通ドキュメント
    ├── 2025-10-18_要件定義.md
    ├── 2025-10-18_仕様書.md
    ├── 2025-10-18_操作フロー.md
    └── 2025-10-18_技術スタック.md
```

## TypeScriptパスエイリアス
tsconfig.jsonで定義:
```json
{
  "paths": {
    "@server/*": ["./server/src/*"],
    "@client/*": ["./client/src/*"],
    "@shared/*": ["./shared/src/*"]
  }
}
```

ただし、実際のimportではworkspace参照を使用:
```typescript
import { ApiResponse } from 'yonayona-dinner-shared'
```

## ビルド依存関係（Turbo）
- `shared`が最初にビルドされる（他のワークスペースが依存）
- `client`と`server`は`shared`のビルド完了後にビルド
- `bun install`のpostinstallフックで`shared`と`server`を自動ビルド
