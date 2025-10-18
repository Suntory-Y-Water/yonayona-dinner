# テスト方針とガイドライン

## テスト方針

### TDD（テスト駆動開発）の実施
- **コードを生成するときは、それに対応するユニットテストを常に生成する**
- コードを追加で修正したとき、`bun run test`がパスすることを常に確認する

### テストの構造
- **Given-When-Thenパターンに基づいて実装する**
  ```typescript
  test("1+2=3", () => {
    // Given: 前提条件
    const a = 1
    const b = 2
    
    // When: 実行
    const result = add({a, b})
    
    // Then: 検証
    expect(result).toBe(3)
  })
  ```

### テスト対象
- **メソッドの事前条件、事後条件、不変条件を検証するテストであること**
- 純粋関数の場合: 入力と出力の関係を検証
- 副作用のある関数の場合: 事前・事後の状態変化を検証

## テストフレームワーク
- **Bunテストランナー**を使用
- テストファイルの配置:
  - `*.test.ts` または `*.spec.ts`
  - `__tests__/` ディレクトリ内

## テスト実行コマンド
```bash
# 全ワークスペースのテスト実行
bun run test

# 個別ワークスペースのテスト実行（Turbo経由）
turbo test --filter=yonayona-dinner-client
turbo test --filter=yonayona-dinner-server
turbo test --filter=yonayona-dinner-shared
```

## サンプルテストコード
```typescript
// CLAUDE.mdの例より
function add({a, b}: {a: number; b: number}) {
  return a + b
}

test("1+2=3", () => {
  expect(add({a: 1, b: 2})).toBe(3)
})
```

## テストカバレッジ
- turbo.jsonに出力設定あり: `coverage/**`, `.nyc_output/**`, `test-results/**`
- カバレッジ目標は未定義だが、主要な関数には必ずテストを作成する

## テスト時の注意事項
- 型安全性はTypeScriptが保証するため、型チェックのためのテストは不要
- 契約による設計の観点から、不要なバリデーション処理は避ける
- 例外処理は呼び出し元でキャッチするため、正常系のみを実装・テストする
