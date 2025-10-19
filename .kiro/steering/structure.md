# Project Structure - よなよなディナー

## ディレクトリ構成

### ルートディレクトリ

```
yonayona-dinner/
├── .kiro/                    # Kiro スペック駆動開発管理
│   ├── steering/            # ステアリングドキュメント
│   └── specs/               # 機能仕様
├── .claude/                  # Claude Code 設定
│   └── commands/            # スラッシュコマンド
├── client/                   # React フロントエンド
├── server/                   # Hono バックエンド
├── shared/                   # 共通型定義
├── docs/                     # プロジェクトドキュメント
├── package.json             # ルート package.json（workspaces）
├── turbo.json               # Turborepo 設定
├── tsconfig.json            # 共通 TypeScript 設定
├── biome.json               # Biome 設定
└── README.md                # プロジェクト README
```

## クライアント構成（client/）

### ディレクトリ階層

```
client/
├── src/
│   ├── components/          # React コンポーネント
│   │   ├── ui/             # shadcn/ui ベースコンポーネント
│   │   ├── map/            # 地図関連コンポーネント
│   │   ├── places/         # 店舗表示コンポーネント
│   │   └── shared/         # 共通コンポーネント
│   ├── services/            # API 呼び出し層（関数ベース）
│   ├── hooks/               # カスタムフック
│   ├── lib/                 # ユーティリティ関数
│   ├── assets/              # 静的アセット
│   ├── App.tsx              # アプリケーションルート
│   ├── main.tsx             # エントリーポイント
│   └── vite-env.d.ts        # Vite 型定義
├── public/                  # 公開静的ファイル
├── index.html               # HTML テンプレート
├── vite.config.ts           # Vite 設定
├── tsconfig.json            # TypeScript 設定
└── package.json             # クライアント依存関係
```

### コンポーネント設計パターン

**ファイル命名規則**:
- コンポーネント: PascalCase（例: `PlaceDetailPanel.tsx`）
- フック: camelCase + `use` プレフィックス（例: `usePlacesSearch.ts`）
- ユーティリティ: kebab-case（例: `opening-hours-filter.ts`）

**コンポーネント構造**:
```typescript
// components/places/PlaceDetailPanel.tsx
import type { Place } from 'shared';

type PlaceDetailPanelProps = {
  place: Place;
  onClose: () => void;
};

export function PlaceDetailPanel({ place, onClose }: PlaceDetailPanelProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background p-4">
      <h2 className="text-lg font-bold">{place.displayName}</h2>
      <p className="text-sm text-muted-foreground">{place.formattedAddress}</p>
      {/* 詳細情報 */}
    </div>
  );
}
```

**カスタムフック**:
```typescript
// hooks/usePlacesSearch.ts
import { useState } from 'react';
import { searchNearby } from '@/services/places-service';
import type { Place, LatLng } from 'shared';

export function usePlacesSearch() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = async (location: LatLng, radius: number) => {
    setLoading(true);
    setError(null);

    const result = await searchNearby({ location, radius });

    if (result.success) {
      setPlaces(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return { places, loading, error, search };
}
```

### インポートパス

**TypeScript Path Alias**（tsconfig.json）:
```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@services/*": ["./src/services/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

**インポート例**:
```typescript
import { Button } from '@/components/ui/button';
import { usePlacesSearch } from '@/hooks/usePlacesSearch';
import { filterOpenPlaces } from '@/lib/opening-hours-filter';
import type { Place } from 'shared';
```

## サーバー構成（server/）

### ディレクトリ階層

```
server/
├── src/
│   ├── loaders/             # DI エントリーポイント
│   │   └── search-places-loader.ts
│   ├── usecases/            # ビジネスロジック（クラス）
│   │   └── search-nearby-places.usecase.ts
│   ├── repositories/        # データアクセス層（クラス）
│   │   ├── interfaces/     # リポジトリインターフェース（type）
│   │   │   └── places-repository.interface.ts
│   │   └── google-places.repository.ts
│   ├── utils/               # 純粋関数
│   ├── index.ts             # Hono アプリケーションエントリーポイント
│   └── client.ts            # Cloudflare Workers 用エントリーポイント
├── dist/                    # ビルド成果物
├── wrangler.toml            # Cloudflare Workers 設定
├── tsconfig.json            # TypeScript 設定
└── package.json             # サーバー依存関係
```

### アーキテクチャパターン（DI）

**レイヤー構成**:
```
Loader（エントリーポイント）
  ↓ 具象Repositoryをインスタンス化
Usecase（ビジネスロジック）
  ↓ インターフェースに依存
IPlacesRepository（抽象）
  ↑ 実装
GooglePlacesRepository（具象）
```

**インターフェース定義**:
```typescript
// repositories/interfaces/places-repository.interface.ts
import type { Place, LatLng, Result } from 'shared';

export type SearchNearbyParams = {
  location: LatLng;
  radius: number;
};

export type PlacesAPIError = {
  type: 'RATE_LIMIT' | 'AUTH_ERROR' | 'NETWORK_ERROR';
  message: string;
};

export type IPlacesRepository = {
  searchNearby(params: SearchNearbyParams): Promise<Result<Place[], PlacesAPIError>>;
};
```

**リポジトリ実装**:
```typescript
// repositories/google-places.repository.ts
import type { IPlacesRepository, SearchNearbyParams, PlacesAPIError } from './interfaces/places-repository.interface';
import type { Place, Result } from 'shared';

export class GooglePlacesRepository implements IPlacesRepository {
  constructor(private apiKey: string) {}

  async searchNearby({ location, radius }: SearchNearbyParams): Promise<Result<Place[], PlacesAPIError>> {
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.location,places.currentOpeningHours,places.formattedAddress'
        },
        body: JSON.stringify({
          includedTypes: ['restaurant', 'cafe', 'bar'],
          maxResultCount: 20,
          locationRestriction: {
            circle: { center: location, radius }
          }
        })
      });

      const data = await response.json();
      return { success: true, data: data.places || [] };
    } catch (error) {
      return {
        success: false,
        error: { type: 'NETWORK_ERROR', message: error.message }
      };
    }
  }
}
```

**Usecase 実装**:
```typescript
// usecases/search-nearby-places.usecase.ts
import type { IPlacesRepository } from '../repositories/interfaces/places-repository.interface';
import type { Place, LatLng, Result } from 'shared';

export type SearchNearbyPlacesParams = {
  location: LatLng;
  radius: number;
};

export class SearchNearbyPlacesUsecase {
  constructor(private placesRepository: IPlacesRepository) {}

  async execute({ location, radius }: SearchNearbyPlacesParams): Promise<Result<Place[], Error>> {
    // ビジネスロジック（例: バリデーション、エラーハンドリング）
    if (radius < 1 || radius > 50000) {
      return {
        success: false,
        error: { type: 'INVALID_RADIUS', message: 'Radius must be between 1 and 50000' }
      };
    }

    // Repository 呼び出し
    return await this.placesRepository.searchNearby({ location, radius });
  }
}
```

**Loader（DI 一元管理）**:
```typescript
// loaders/search-places-loader.ts
import { GooglePlacesRepository } from '../repositories/google-places.repository';
import { SearchNearbyPlacesUsecase } from '../usecases/search-nearby-places.usecase';
import type { Env } from '../types';

export function createSearchPlacesLoader(env: Env) {
  return async ({ location, radius }: { location: LatLng; radius: number }) => {
    // 具象Repositoryのインスタンス化（Loaderのみが実施）
    const placesRepo = new GooglePlacesRepository(env.GOOGLE_PLACES_API_KEY);

    // Usecaseへの注入
    const usecase = new SearchNearbyPlacesUsecase(placesRepo);

    // 実行
    return await usecase.execute({ location, radius });
  };
}
```

**Honoルーター**:
```typescript
// index.ts
import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { cors } from 'hono/cors';
import { createSearchPlacesLoader } from './loaders/search-places-loader';

const app = new Hono<{ Bindings: Env }>();

app.use(cors());

app.post(
  '/api/places/search',
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
    const loader = createSearchPlacesLoader(c.env);
    const body = await c.req.json();
    const result = await loader(body);

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }
    return c.json(result.data);
  }
);

export default app;
```

### ファイル命名規則

- **Loader**: kebab-case + `.loader.ts`（例: `search-places-loader.ts`）
- **Usecase**: kebab-case + `.usecase.ts`（例: `search-nearby-places.usecase.ts`）
- **Repository**: kebab-case + `.repository.ts`（例: `google-places.repository.ts`）
- **Interface**: kebab-case + `.interface.ts`（例: `places-repository.interface.ts`）
- **Utils**: kebab-case（例: `validate-coordinates.ts`）

## 共通層（shared/）

### ディレクトリ階層

```
shared/
├── src/
│   ├── types/               # 型定義
│   │   └── index.ts        # 共通型のエクスポート
│   └── index.ts             # パッケージエントリーポイント
├── dist/                    # ビルド成果物（.js, .d.ts）
├── tsconfig.json            # TypeScript 設定
└── package.json             # 共通依存関係
```

### 型定義パターン

**共通型定義**:
```typescript
// shared/src/types/index.ts

// 位置情報
export type LatLng = {
  lat: number;  // -90~90
  lng: number;  // -180~180
};

// 店舗情報
export type Place = {
  id: string;
  displayName: string;
  location: LatLng;
  formattedAddress: string;
  currentOpeningHours?: OpeningHours;
  rating?: number;
};

// 営業時間
export type OpeningHours = {
  openNow: boolean;
  periods: OpeningPeriod[];
  weekdayDescriptions: string[];
};

export type OpeningPeriod = {
  open: TimePoint;
  close: TimePoint;
};

export type TimePoint = {
  day: number;    // 0=日曜, 6=土曜
  hour: number;   // 0-23
  minute: number; // 0-59
};

// Result型
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };
```

**エクスポート**:
```typescript
// shared/src/index.ts
export * from './types';
```

## Kiro ステアリング・スペック管理（.kiro/）

### ディレクトリ階層

```
.kiro/
├── steering/                # ステアリングドキュメント
│   ├── product.md          # 製品概要とビジネス目標
│   ├── tech.md             # 技術スタックとアーキテクチャ方針
│   └── structure.md        # ファイル構成とコードパターン
└── specs/                   # 機能仕様
    └── yonayona-dinner/    # プロジェクトスペック
        ├── spec.json       # スペックメタデータ
        ├── requirements.md # 要件定義
        ├── design.md       # 技術設計
        └── tasks.md        # 実装タスク（生成後）
```

### スペック管理ワークフロー

1. **初期化**: `/kiro:spec-init [詳細説明]`
2. **要件定義**: `/kiro:spec-requirements [feature]`
3. **設計**: `/kiro:spec-design [feature]`
4. **タスク生成**: `/kiro:spec-tasks [feature]`
5. **実装**: `/kiro:spec-impl [feature] [task-numbers]`

## Claude Code コマンド（.claude/commands/）

### ディレクトリ階層

```
.claude/
├── commands/
│   ├── kiro/               # Kiro ワークフロー
│   │   ├── spec-init.md
│   │   ├── spec-requirements.md
│   │   ├── spec-design.md
│   │   ├── spec-tasks.md
│   │   ├── spec-impl.md
│   │   ├── spec-status.md
│   │   └── steering.md
│   ├── tdd-pair.md         # TDD ペアプログラミング
│   └── coding-plan.md      # コーディング計画
└── settings.local.json     # Claude Code ローカル設定
```

## コーディング規約

### TypeScript スタイル

**型定義**:
```typescript
// ✅ Good: type を使用（関数型アプローチ）
type User = {
  id: string;
  name: string;
};

// ❌ Bad: interface の使用は避ける（クラスベースではないため）
interface User {
  id: string;
  name: string;
}
```

**関数定義**:
```typescript
// ✅ Good: 名前付き関数（トレーサビリティ向上）
export function calculateRemainingMinutes({ openingHours, currentTime }: {
  openingHours: OpeningHours;
  currentTime: Date;
}): number | null {
  // 実装
}

// ❌ Bad: アロー関数の export
export const calculateRemainingMinutes = (openingHours: OpeningHours, currentTime: Date): number | null => {
  // 実装
};
```

**非同期処理**:
```typescript
// ✅ Good: async/await
async function searchNearby({ location, radius }: SearchParams): Promise<Result<Place[], Error>> {
  const response = await fetch('/api/places/search', {
    method: 'POST',
    body: JSON.stringify({ location, radius })
  });
  return await response.json();
}

// ❌ Bad: Promise チェーン
function searchNearby({ location, radius }: SearchParams): Promise<Result<Place[], Error>> {
  return fetch('/api/places/search', {
    method: 'POST',
    body: JSON.stringify({ location, radius })
  })
  .then(response => response.json());
}
```

### React パターン

**コンポーネント定義**:
```typescript
// ✅ Good: 名前付き関数コンポーネント
export function PlaceCard({ place }: { place: Place }) {
  return <div>{place.displayName}</div>;
}

// ❌ Bad: デフォルトエクスポート
const PlaceCard = ({ place }: { place: Place }) => {
  return <div>{place.displayName}</div>;
};
export default PlaceCard;
```

**状態管理**:
```typescript
// ✅ Good: useState による明示的な状態管理
const [places, setPlaces] = useState<Place[]>([]);

// ❌ Bad: let による状態管理
let places: Place[] = [];
```

### CSS/Tailwind スタイル

**クラス命名**:
```tsx
// ✅ Good: Tailwind ユーティリティクラス
<div className="fixed bottom-0 left-0 right-0 bg-background p-4 shadow-lg">
  <h2 className="text-lg font-bold text-foreground">{title}</h2>
</div>

// ❌ Bad: カスタム CSS クラス（Tailwind で代替可能な場合）
<div className="detail-panel">
  <h2 className="panel-title">{title}</h2>
</div>
```

## ビルドとデプロイ

### ビルドコマンド

```bash
# 全ワークスペースビルド
bun run build

# クライアントのみ
bun run build:client

# サーバーのみ
bun run build:server
```

### デプロイフロー

**クライアント（Cloudflare Pages）**:
1. `bun run build:client` でビルド
2. `client/dist` を Cloudflare Pages にデプロイ

**サーバー（Cloudflare Workers）**:
1. `bun run build:server` でビルド
2. `wrangler deploy` で Cloudflare Workers にデプロイ

---

**最終更新**: 2025-10-19
**ステータス**: プロジェクト構造確定、実装準備中
