# タスク完了時のチェックリスト

## 必須実行コマンド

コードの生成・修正後は、以下のコマンドを**必ず実行**すること:

### 1. リント実行
```bash
bun run lint
```
- Biomeによる静的解析を実行
- コーディング規約違反をチェック

### 2. 型チェック実行
```bash
bun run type-check
```
- TypeScriptの型整合性を検証
- 全ワークスペース（client/server/shared）で実行

### 3. テスト実行
```bash
bun run test
```
- 全ユニットテストを実行
- 既存機能の破壊がないことを確認

## コード生成時の必須事項

### JSDocコメントの追加
- **関数やコンポーネントには必ずJSDocコメントを追加する**
  ```typescript
  /**
   * 2つの数値を加算する
   * @param params - 加算パラメータ
   * @param params.a - 1つ目の数値
   * @param params.b - 2つ目の数値
   * @returns 加算結果
   */
  function add({a, b}: {a: number; b: number}): number {
    return a + b
  }
  ```

### テストの作成
- **TDDを実施し、対応するユニットテストを常に生成する**
- Given-When-Thenパターンで実装
- `bun run test`がパスすることを確認

## フォーマットの適用
```bash
# コード整形（自動修正）
bun run format
```

## オプション: 個別ワークスペースでの実行
特定のワークスペースのみ変更した場合:

```bash
# クライアントのみ
turbo lint --filter=yonayona-dinner-client
turbo type-check --filter=yonayona-dinner-client
turbo test --filter=yonayona-dinner-client

# サーバーのみ
turbo lint --filter=yonayona-dinner-server
turbo type-check --filter=yonayona-dinner-server
turbo test --filter=yonayona-dinner-server
```

## 注意事項
- CLAUDE.mdに記載されている`bun run ai-check`コマンドは現在未定義
- 代わりに上記の3コマンド（lint, type-check, test）を個別に実行すること
- 将来的に`ai-check`スクリプトが追加される可能性あり
