# コーディング規約とスタイル

## TypeScript規約

### 型定義
- **interfaceではなくtypeを使用する**
  ```typescript
  // Good
  type User = { name: string; age: number }
  
  // Avoid
  interface User { name: string; age: number }
  ```

- **型安全のため構造的に型づけする**
  ```typescript
  // Good
  function add({a, b}: {a: number; b: number}) { return a + b }
  
  // Avoid
  function add(a: number, b: number) { return a + b }
  ```

- **配列の型定義は`[]`を使用する**（`Array<T>`ではなく）
  ```typescript
  // Good
  type Items = string[]
  
  // Avoid
  type Items = Array<string>
  ```

- **既存の型定義を尊重し、Pick/Omitなどで型を再利用する**

### 関数定義
- **引数が2個以上あるときは引数をオブジェクト形式で設定する**
- **最上位の関数はfunction宣言で実装する**
  - map/filter/即時関数などはアロー関数で実装
  ```typescript
  // Good - 最上位
  function fetchData({url, options}: {url: string; options?: RequestInit}) {
    return fetch(url, options)
  }
  
  // Good - map/filter
  const items = data.map((item) => item.name)
  ```

- **クラスは使用しない。関数ベースの実装を行う**

### コメント
- **関数やコンポーネントには必ずJSDocコメントを追加する**
- **契約による設計の実装指針**
  - 既にTypeScriptで型保証されている引数の再チェックは避ける
  - 例外を投げないライブラリ関数への不要なtry-catchは避ける
  - 装飾的なコメント（例：「（契約による設計）」）は避ける
  - 関数名と型定義で契約を明示する
  - 必要最小限のJSDocコメントを記述する
  - 純粋関数としての実装（副作用なし）

## フォーマット設定（Biome）
- インデント: スペース2個
- 行幅: 80文字
- クォート: ダブルクォート
- import自動整理: 有効

## ファイル・フォルダ命名
- コンポーネント: PascalCase（例: `Home.tsx`, `Button.tsx`）
- ユーティリティ: camelCase（例: `utils.ts`）
- 型定義ファイル: `index.ts` in `types/`

## ドキュメント生成規約
- ファイル名: `yyyy-mm-dd_{日本語で書いた事象名}.md`
  - `date`コマンドで取得した日付を使用
- 格納先:
  - クライアント関連: `docs/client`
  - サーバー関連: `docs/server`
  - 両者に属さない: `docs/shared`
