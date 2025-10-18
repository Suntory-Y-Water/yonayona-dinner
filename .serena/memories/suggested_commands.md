# 推奨コマンド一覧

## 開発コマンド

### 全体開発
```bash
# 全ワークスペースを開発モードで起動（Turbo TUI使用）
bun run dev

# クライアントのみ開発モード
bun run dev:client

# サーバーのみ開発モード
bun run dev:server
```

### ビルド
```bash
# 全ワークスペースをビルド
bun run build

# クライアントのみビルド
bun run build:client

# サーバーのみビルド
bun run build:server
```

### 品質チェック
```bash
# Biomeリント実行
bun run lint

# 型チェック（全ワークスペース）
bun run type-check

# テスト実行（全ワークスペース）
bun run test

# フォーマット（自動修正）
bun run format
```

## タスク完了時の実行コマンド

コードを生成・修正した後は、以下のコマンドを実行すること:

```bash
# リント実行
bun run lint

# 型チェック実行
bun run type-check

# テスト実行（該当する場合）
bun run test
```

**注意**: CLAUDE.mdに記載の`bun run ai-check`は現在未定義のため、上記3コマンドを個別に実行すること。

## パッケージ管理
```bash
# 依存関係のインストール
bun install

# postinstallフック自動実行（shared/serverのビルド）
# → bun installで自動実行される
```

## 個別ワークスペース操作
```bash
# 特定ワークスペースでコマンド実行
bun run --filter=yonayona-dinner-client <command>
bun run --filter=yonayona-dinner-server <command>
bun run --filter=yonayona-dinner-shared <command>
```

## Darwin（macOS）システムコマンド
```bash
# 基本的なUNIXコマンドが利用可能
ls       # ファイル一覧
grep     # テキスト検索
find     # ファイル検索
cat      # ファイル内容表示
date     # 日付取得（ドキュメント名生成に使用）
```

## デプロイ（予定）
```bash
# Cloudflare Workers/Pagesデプロイ
# wranglerを使用（設定は各ワークスペースのwrangler.jsonc参照）
```
