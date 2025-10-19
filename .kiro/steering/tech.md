# Technology Stack - よなよなディナー

## アーキテクチャ概要

### システム構成

**モノレポ構成**:
```
yonayona-dinner/
├── client/          # React フロントエンド
├── server/          # Hono バックエンド
└── shared/          # 共通型定義
```

**実行環境**:
- フロントエンド: Cloudflare Pages（予定）または Vite Dev Server
- バックエンド: Cloudflare Workers
- ランタイム: Bun（開発環境）、Cloudflare Workers Runtime（本番）

### 技術選定理由

本プロジェクトは、既存の **bhvr** テンプレート（Bun + Hono + Vite + React）をベースに構築されています。

**bhvr テンプレートを選択した理由**:
- **フルスタック TypeScript**: クライアント・サーバー間で型安全性を確保
- **モノレポ対応**: Turborepo による効率的なビルドオーケストレーション
- **Cloudflare 親和性**: Hono が Cloudflare Workers で最適化されている
- **軽量・高速**: Bun による高速な依存関係管理とビルド

## フロントエンド技術スタック

### コアフレームワーク

**React 19.2.0**
- 理由: UI構築の標準的な選択肢、豊富なエコシステム
- 用途: コンポーネントベースの UI 構築

**Vite 6.4.0**
- 理由: 高速な開発サーバー、効率的なバンドリング
- 用途: ビルドツール、開発サーバー、HMR

**TypeScript 5.7.3**
- 理由: 型安全性、IDE サポート、バグの早期発見
- 用途: 全体の型定義

### UI フレームワーク

**Tailwind CSS 4.1.14**
- 理由: ユーティリティファーストで高速開発、一貫性のあるデザイン
- 用途: スタイリング、ダークテーマ実装

**shadcn/ui**
- 理由: アクセシブルで再利用可能なコンポーネント、カスタマイズ容易
- 用途: ボタン、スライダー、ダイアログ等の基本 UI コンポーネント

**React Router**
- 理由: SPA のルーティング標準
- 用途: ページ遷移管理（将来拡張用、MVP では単一ページ）

### Google Maps 統合

**Google Maps JavaScript API**
- エンドポイント: `https://maps.googleapis.com/maps/api/js`
- 認証: API キー（環境変数 `VITE_GOOGLE_MAPS_API_KEY`）
- 用途: 地図表示、マーカー配置、ユーザーインタラクション

**依存関係**:
- `@googlemaps/js-api-loader`: Google Maps API の動的読み込み
- `@types/google.maps`: TypeScript 型定義

**セキュリティ設定**（Google Cloud Console）:
- HTTPリファラー制限: `https://yourdomain.com/*`
- API制限: Maps JavaScript API のみ有効化

### 日時処理

**date-fns**
- 理由: 軽量、Tree-shaking 対応、関数型アプローチ
- 用途: 営業時間判定、24時跨ぎ計算

**date-fns-tz**
- 理由: タイムゾーン対応（日本時間優先）
- 用途: タイムゾーン変換

### 状態管理

**React Hooks（useState, useEffect）**
- 理由: シンプルなアプリケーション、外部状態管理ライブラリ不要
- 用途: コンポーネントローカルステート

**将来的な拡張**（必要に応じて）:
- Zustand または Jotai（グローバルステート管理）

## バックエンド技術スタック

### フレームワーク

**Hono 4.10.1**
- 理由: 軽量、高速、Cloudflare Workers 最適化
- 用途: API ルーティング、ミドルウェア、プロキシ

**Cloudflare Workers**
- 理由: サーバーレス、グローバルエッジネットワーク、低レイテンシ
- 用途: API 実行環境、環境変数管理（Secrets）

### API 統合

**Google Places API (New)**
- エンドポイント: `https://places.googleapis.com/v1/places:searchNearby`
- 認証: `X-Goog-Api-Key` ヘッダー（Workers Secrets で管理）
- Field Mask: 必要最小限のフィールドのみ取得（コスト最適化）
  - `places.displayName`
  - `places.location`
  - `places.currentOpeningHours`
  - `places.formattedAddress`

**プロキシパターン**:
- クライアントから直接 Places API を呼び出さず、サーバー経由で実行
- 理由: API キーの保護、キャッシング統合、Field Mask 制御

### キャッシング

**Hono Cache Middleware**
- ストレージ: Web Standards Cache API（Cloudflare Workers）
- TTL: 5分（`Cache-Control: max-age=300`）
- キャッシュキー: `places:${lat}:${lng}:${radius}`（位置情報と半径の組み合わせ）
- 座標精度: 小数点3桁（約110m）

**キャッシュ戦略**:
```typescript
import { cache } from 'hono/cache';

app.post('/api/places/search',
  cache({
    cacheName: 'yonayona-dinner-places',
    cacheControl: 'max-age=300',
    keyGenerator: async (c) => {
      const body = await c.req.json();
      const lat = body.location.lat.toFixed(3);
      const lng = body.location.lng.toFixed(3);
      return `places:${lat}:${lng}:${body.radius}`;
    }
  }),
  async (c) => {
    // Places API 呼び出し処理
  }
);
```

### エラーハンドリング

**Result 型パターン**:
```typescript
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };
```

- 理由: 外部ライブラリ不要、TypeScript ネイティブ、シンプル
- 用途: API 呼び出しの成功/失敗ハンドリング

## 共通層（Shared）

### 型定義

**共通型の管理**:
```typescript
// shared/src/types/index.ts
export type Place = {
  id: string;
  displayName: string;
  location: LatLng;
  formattedAddress: string;
  currentOpeningHours?: OpeningHours;
};

export type OpeningHours = {
  openNow: boolean;
  periods: OpeningPeriod[];
  weekdayDescriptions: string[];
};

export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };
```

**インポート例**:
```typescript
// クライアント側
import type { Place, OpeningHours } from 'shared';

// サーバー側
import type { Place, Result } from 'shared';
```

## ビルドツールとモノレポ管理

### Turborepo

**タスクオーケストレーション**:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false
    }
  }
}
```

**キャッシング**:
- ビルド成果物のキャッシュ
- 並列ビルドの最適化

### Bun

**パッケージマネージャー**:
- 理由: 高速なインストール、ロックファイルの効率化
- 用途: 依存関係管理、スクリプト実行

**開発サーバー**:
```bash
bun run dev        # Turbo 経由で全ワークスペース起動
bun run dev:client # クライアントのみ起動
bun run dev:server # サーバーのみ起動
```

## 開発環境

### 必須ツール

- **Bun**: 1.2.4 以上
- **Node.js**: 20.x 以上（Bun が内部で使用）
- **Git**: バージョン管理
- **VSCode**（推奨）: TypeScript 統合、拡張機能サポート

### 推奨 VSCode 拡張機能

- **Biome**: コードフォーマット、リント
- **Tailwind CSS IntelliSense**: Tailwind クラスの補完
- **TypeScript**: 型チェック、IntelliSense

### 環境変数

**クライアント（.env.local）**:
```env
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_SERVER_URL=http://localhost:3000
```

**サーバー（Cloudflare Workers Secrets）**:
```bash
wrangler secret put GOOGLE_PLACES_API_KEY
```

## コード品質管理

### リントとフォーマット

**Biome**
- 理由: 高速、ESLint + Prettier の統合、設定不要
- 用途: コードフォーマット、リント

**設定**:
```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

**コマンド**:
```bash
bun run lint       # リント実行
bun run format     # フォーマット実行
```

### 型チェック

**TypeScript Compiler**:
```bash
bun run type-check  # Turbo 経由で全ワークスペースの型チェック
```

### テスト（将来拡張）

**推奨ツール**:
- **Vitest**: 高速なユニットテスト
- **Playwright**: E2E テスト
- **Testing Library**: React コンポーネントテスト

## デプロイ戦略

### フロントエンド（Cloudflare Pages）

**ビルドコマンド**:
```bash
bun run build:client
```

**出力ディレクトリ**: `client/dist`

**環境変数**（Cloudflare Pages 設定）:
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API キー
- `VITE_SERVER_URL`: サーバー URL（本番環境）

### バックエンド（Cloudflare Workers）

**デプロイコマンド**:
```bash
wrangler deploy
```

**wrangler.toml**:
```toml
name = "yonayona-dinner-server"
main = "server/dist/index.js"
compatibility_date = "2025-10-19"

[env.production]
vars = { ENVIRONMENT = "production" }
```

**Secrets 設定**:
```bash
wrangler secret put GOOGLE_PLACES_API_KEY
```

## アーキテクチャパターン

### サーバーサイド（クラスベース DI）

**適用範囲**: 外部通信を行うレイヤー（Repository, Usecase）のみ

**ディレクトリ構成**:
```
server/
├── loaders/          # DI エントリーポイント
├── usecases/         # ビジネスロジック（クラス）
├── repositories/     # データアクセス層（クラス）
│   └── interfaces/  # リポジトリインターフェース
└── utils/            # 純粋関数（関数ベース）
```

**実装パターン**:
```typescript
// インターフェース定義（type）
type IPlacesRepository = {
  searchNearby(params: SearchParams): Promise<Result<Place[], Error>>;
};

// 具象クラス
class GooglePlacesRepository implements IPlacesRepository {
  constructor(private apiKey: string) {}
  async searchNearby(params: SearchParams) { /* 実装 */ }
}

// Usecase（DI）
class SearchNearbyPlacesUsecase {
  constructor(private placesRepository: IPlacesRepository) {}
  async execute(params: SearchParams) { /* ロジック */ }
}

// Loader（DI 一元管理）
export function createSearchPlacesLoader(env: Env) {
  return async (params: SearchParams) => {
    const placesRepo = new GooglePlacesRepository(env.GOOGLE_PLACES_API_KEY);
    const usecase = new SearchNearbyPlacesUsecase(placesRepo);
    return await usecase.execute(params);
  };
}
```

### クライアントサイド（完全に関数ベース）

**ディレクトリ構成**:
```
client/
├── components/       # React コンポーネント（関数コンポーネント）
├── services/         # API 呼び出し（関数ベース）
├── hooks/            # カスタムフック
└── lib/              # ユーティリティ（純粋関数）
```

**実装パターン**:
```typescript
// サービス関数（純粋関数）
export async function searchNearby(location: LatLng, radius: number): Promise<Result<Place[], Error>> {
  const response = await fetch('/api/places/search', {
    method: 'POST',
    body: JSON.stringify({ location, radius })
  });
  return await response.json();
}

// カスタムフック
export function usePlacesSearch() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (location: LatLng, radius: number) => {
    setLoading(true);
    const result = await searchNearby(location, radius);
    if (result.success) setPlaces(result.data);
    setLoading(false);
  };

  return { places, loading, search };
}
```

## セキュリティ方針

### API キー管理

- **クライアント**: Google Maps API キー（HTTPリファラー制限）
- **サーバー**: Google Places API キー（Cloudflare Workers Secrets）

### CORS 設定

```typescript
import { cors } from 'hono/cors';

app.use('/api/*', cors({
  origin: 'https://yourdomain.com',
  allowMethods: ['GET', 'POST']
}));
```

### レート制限（将来拡張）

- Cloudflare Workers でクライアント IP ベースのレート制限
- 目標: 1分間に10リクエスト/IP

## パフォーマンス目標

### フロントエンド

- **FCP（First Contentful Paint）**: < 1.5秒
- **LCP（Largest Contentful Paint）**: < 2.0秒
- **TTI（Time to Interactive）**: < 3.0秒

### バックエンド

- **APIレスポンスタイム**: p95 < 500ms
- **キャッシュヒット率**: 70%以上

### 最適化手法

- **コード分割**: React.lazy による遅延ロード
- **Tree-shaking**: date-fns の個別インポート
- **Field Mask**: Places API で必要最小限のフィールドのみ取得
- **キャッシング**: 5分間の検索結果キャッシュ

## モニタリングとロギング

### パフォーマンス計測

**Web Vitals**:
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(metric => console.log('CLS', metric.value));
getFCP(metric => console.log('FCP', metric.value));
getLCP(metric => console.log('LCP', metric.value));
```

### エラートラッキング（将来拡張）

- Sentry または Cloudflare Workers Analytics
- エラーレート、エラータイプの計測

---

**最終更新**: 2025-10-19
**ステータス**: 技術スタック確定、実装準備中
