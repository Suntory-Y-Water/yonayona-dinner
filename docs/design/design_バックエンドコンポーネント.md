# バックエンドコンポーネント

### バックエンド層

#### PlacesProxyHandler

**責任と境界**
- **主要責任**: Places APIへのプロキシリクエスト、APIキー管理、レスポンスの整形
- **ドメイン境界**: インフラストラクチャ層（外部API統合）
- **データ所有権**: なし（プロキシのみ）
- **トランザクション境界**: なし（読み取り専用）

**依存関係**
- **Inbound**: Honoルーター（`/api/places/search`エンドポイント）
- **Outbound**: Google Places API（Honoキャッシュミドルウェアが自動的にキャッシング）
- **External**: Google Places API (New)

**外部依存関係調査**:
- **公式ドキュメント**: [Places API (New) - Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search)
- **エンドポイント**: `https://places.googleapis.com/v1/places:searchNearby`
- **認証方法**: `X-Goog-Api-Key`ヘッダーによるAPIキー認証
- **レート制限**: プロジェクトごとにQPS制限あり（Cloud Consoleで確認）
- **Field Mask**: `X-Goog-FieldMask`ヘッダーで取得フィールドを指定（課金最適化）
- **リクエスト形式**: JSON形式のPOSTリクエスト
- **既知の問題**: `openNow`フィルタは廃止、`currentOpeningHours`で営業時間を取得してフィルタリング
- **ベストプラクティス**: 必要最小限のフィールドのみ取得、キャッシングで呼び出し削減

**契約定義**

**API契約**:

| Method | Endpoint | Request | Response | Errors |
|--------|----------|---------|----------|--------|
| POST | /api/places/search | SearchNearbyRequest | PlacesSearchResponse | 400, 429, 500, 503 |

**リクエストスキーマ**:

```typescript
type SearchNearbyRequest = {
  location: {
    lat: number;  // -90~90
    lng: number;  // -180~180
  };
  radius: number; // メートル単位、1~50000
  targetTime: string; // ISO 8601形式 "yyyy-MM-ddTHH:mm:ss"
};
```

**レスポンススキーマ**:

```typescript
type FilteredPlacesResponse = {
  places: FilteredPlace[];
};

type FilteredPlace = Place & {
  remainingMinutes: number; // 閉店までの残り時間（分）
};

type Place = {
  id: string;
  displayName: string;
  location: { lat: number; lng: number };
  formattedAddress: string;
  currentOpeningHours?: OpeningHours;
  rating?: number;
}
```

**エラーレスポンス**:

| Status | Error Type | Description |
|--------|-----------|-------------|
| 400 | INVALID_REQUEST | リクエストパラメータが無効 |
| 429 | RATE_LIMIT | レート制限超過 |
| 500 | INTERNAL_ERROR | サーバー内部エラー |
| 503 | SERVICE_UNAVAILABLE | Places APIが利用不可 |

**事前条件**:
- リクエストボディが有効なJSON
- 位置情報座標が有効範囲内
- 半径が1~50000メートル
- targetTimeが有効なISO 8601形式

**事後条件**:
- 成功時: 営業中店舗のデータ配列を返す（最大20件、残り時間計算済み）
- 失敗時: エラーステータスとエラーメッセージを返す

#### Honoキャッシュミドルウェア

**責任と境界**
- **主要責任**: APIレスポンスの自動キャッシング、Cache-Control管理、キャッシュキー生成
- **ドメイン境界**: インフラストラクチャ層（HTTPキャッシング）
- **データ所有権**: HTTPレスポンスのキャッシュ
- **トランザクション境界**: なし

**依存関係**
- **Inbound**: Honoルーター（すべてのAPIエンドポイント）
- **Outbound**: Web Standards Cache API
- **External**: Cloudflare Workers Cache API

**外部依存関係調査**:
- **公式ドキュメント**: [Hono Cache Middleware](https://hono.dev/docs/middleware/builtin/cache)
- **Cache API**: [Web Standards Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- **Cloudflare実装**: [Cache on Cloudflare Docs](https://developers.cloudflare.com/workers/runtime-apis/cache/)
- **TTL設定**: `Cache-Control`ヘッダーで`max-age`を指定
- **既知の問題**: Cloudflare Workersではカスタムドメイン必須
- **ベストプラクティス**: `cacheControl`オプションで適切なTTLを設定

**実装パターン**

**Honoルーター統合**:

```typescript
import { Hono } from 'hono';
import { cache } from 'hono/cache';

const app = new Hono();

// Places API検索エンドポイントにキャッシュミドルウェアを適用
app.post(
  '/api/places/search',
  cache({
    cacheName: 'yonayona-dinner-places',
    cacheControl: 'max-age=300', // 5分間キャッシュ
    keyGenerator: (c) => {
      // リクエストボディから位置情報と半径を取得してキャッシュキーを生成
      const body = await c.req.json();
      return `places:${body.location.lat}:${body.location.lng}:${body.radius}`;
    }
  }),
  async (c) => {
    // Places API呼び出し処理
    const body = await c.req.json();
    const result = await searchNearbyPlaces(body.location, body.radius, c.env);
    return c.json(result);
  }
);
```

**キャッシュキー生成戦略**:

```typescript
// 位置情報、半径、targetTimeに基づくキャッシュキー生成
function generateCacheKey({
  location,
  radius,
  targetTime
}: SearchNearbyRequest): string {
  // 座標を小数点3桁に丸める（約110mの精度）
  const lat = location.lat.toFixed(3);
  const lng = location.lng.toFixed(3);
  // 5分単位で丸める（300000ミリ秒 = 5分）
  const timeKey = Math.floor(new Date(targetTime).getTime() / 300000);
  return `places:${lat}:${lng}:${radius}:${timeKey}`;
}
```

**事前条件**:
- Cloudflare Workersでカスタムドメインが設定されている
- リクエストボディが有効なJSON

**事後条件**:
- キャッシュヒット時: Cache APIから直接レスポンスを返す（Places API呼び出しなし）
- キャッシュミス時: Places APIを呼び出し、レスポンスをキャッシュに保存

**不変条件**:
- キャッシュキーは一意（位置情報、半径、targetTimeから生成）
- TTLは5分（300秒）固定（`max-age=300`）
- ステータスコード200のみキャッシュ（デフォルト動作）

#### OpeningHoursService (Domain Service)

**責任と境界**
- **主要責任**: 営業時間判定ロジック、24時跨ぎ対応、営業中店舗フィルタリング、残り時間計算
- **ドメイン境界**: ドメイン層（営業時間ビジネスルール）
- **データ所有権**: なし（純粋関数として実装）
- **トランザクション境界**: なし

**依存関係**
- **Inbound**: SearchNearbyPlacesUsecase（フィルタリング処理）
- **Outbound**: date-fns（日時計算）
- **External**: date-fns ^4.1.0

**契約定義**

```typescript
/**
 * 指定時刻に営業中かを判定する
 */
function isOpenAt({
  openingHours,
  targetTime
}: {
  openingHours: OpeningHours | undefined;
  targetTime: Date;
}): boolean;

/**
 * 営業中店舗のみフィルタリングする
 */
function filterOpenPlaces({
  places,
  targetTime
}: {
  places: Place[];
  targetTime: Date;
}): Place[];

/**
 * 閉店までの残り時間を計算する（分単位）
 */
function calculateRemainingMinutes({
  openingHours,
  currentTime
}: {
  openingHours: OpeningHours;
  currentTime: Date;
}): number | null;

/**
 * FilteredPlace型を生成する
 */
function toFilteredPlace({
  place,
  targetTime
}: {
  place: Place;
  targetTime: Date;
}): FilteredPlace;
```

**事前条件**:
- `targetTime`は有効なDateオブジェクト
- `openingHours.periods`は空でない配列（営業時間が存在する場合）

**事後条件**:
- `isOpenAt()`: 営業中の場合`true`、閉店中または営業時間情報なしの場合`false`を返す
- `filterOpenPlaces()`: 営業中店舗のみを含む配列を返す（元の配列は変更しない）
- `calculateRemainingMinutes()`: 閉店までの分数を返す、営業時間外の場合`null`を返す
- `toFilteredPlace()`: Place + remainingMinutesを持つFilteredPlaceを返す

**不変条件**:
- すべての関数は純粋関数（副作用なし）
- 元のデータを変更しない（イミュータブル）
- 24時跨ぎ営業時間に対応
- 複数営業時間スロットに対応
