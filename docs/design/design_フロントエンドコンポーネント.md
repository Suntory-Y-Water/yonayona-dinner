# フロントエンドコンポーネント

### フロントエンド層

#### MapManager

**責任と境界**
- **主要責任**: Google Maps APIの初期化、地図表示、マーカー管理、インタラクション処理
- **ドメイン境界**: UI/プレゼンテーション層（地図表示とユーザーインタラクション）
- **データ所有権**: 地図インスタンス、マーカーインスタンス、Info Windowインスタンス
- **トランザクション境界**: なし（UIのみ）

**依存関係**
- **Inbound**: PlaceSearchController（検索結果を受け取る）
- **Outbound**: Google Maps JavaScript API、PlaceDetailPanel（詳細表示）
- **External**: `@googlemaps/js-api-loader`、`@types/google.maps`

**外部依存関係調査**:
- **公式ドキュメント**: [Google Maps JavaScript API Overview](https://developers.google.com/maps/documentation/javascript/)
- **API署名**: `Loader.load()` はPromiseを返し、`google.maps`グローバルオブジェクトを初期化
- **認証方法**: APIキーによる認証（`apiKey`パラメータ）
- **レート制限**: QPS制限あり（デフォルト値は非公開、プロジェクトごとに設定）
- **バージョン管理**: `version: 'weekly'`で最新機能を取得、`version: 'quarterly'`で安定版を取得
- **既知の問題**: Advanced Markersは`mapId`が必須（Cloud Consoleで設定）
- **ベストプラクティス**: `importLibrary()`による動的インポートでバンドルサイズを削減

**契約定義**

```typescript
  // 地図の初期化
  initializeMap({
    element,
    center
  }: {
    element: HTMLElement;
    center: LatLng;
  }): Promise<Result<google.maps.Map, MapError>>;

  // マーカーの配置
  displayMarkers({
    places
  }: {
    places: Place[];
  }): Result<void, MarkerError>;

  // マーカーのクリア
  clearMarkers(): void;

  // 地図の中心移動
  centerMap({ location }: { location: LatLng }): void;

  // ズームレベル設定
  setZoom({ level }: { level: number }): void;

type MapError =
  | { type: 'LOAD_FAILED'; message: string }
  | { type: 'API_KEY_INVALID'; message: string }
  | { type: 'INITIALIZATION_FAILED'; message: string };

type MarkerError =
  | { type: 'INVALID_LOCATION'; message: string }
  | { type: 'MARKER_CREATION_FAILED'; message: string };
```

**事前条件**:
- Google Maps APIキーが環境変数に設定されている
- 地図を表示するDOM要素が存在する
- 位置情報座標が有効な範囲内（緯度: -90~90、経度: -180~180）

**事後条件**:
- 地図が指定された要素に正常に描画される
- マーカーが地図上に配置される
- ユーザーのインタラクション（ズーム、パン、マーカークリック）が可能

**不変条件**:
- 地図インスタンスは1つのみ（シングルトンパターン）
- マーカーは営業中店舗のみ表示

#### PlacesService

**責任と境界**
- **主要責任**: Places API呼び出しの抽象化、サーバーとの通信、エラーハンドリング
- **ドメイン境界**: データアクセス層（外部API統合）
- **データ所有権**: API呼び出し結果のキャッシュ、リクエスト履歴
- **トランザクション境界**: なし（読み取り専用）

**依存関係**
- **Inbound**: PlaceSearchController（検索リクエスト）
- **Outbound**: Honoサーバー（`/api/places/search`エンドポイント）
- **External**: なし（標準fetch API使用）

**契約定義**

```typescript
  // 近隣店舗検索
  searchNearby({
    location,
    radius
  }: {
    location: LatLng;
    radius: number;
  }): Promise<Result<Place[], PlacesAPIError>>;

  // 店舗詳細取得（将来拡張用）
  getPlaceDetails({
    placeId
  }: {
    placeId: string;
  }): Promise<Result<PlaceDetail, PlacesAPIError>>;

type PlacesAPIError =
  | { type: 'RATE_LIMIT'; retryAfter: number }
  | { type: 'AUTH_ERROR'; message: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'INVALID_REQUEST'; message: string }
  | { type: 'UNKNOWN_ERROR'; message: string };

type Place = {
  id: string;
  displayName: string;
  location: LatLng;
  formattedAddress: string;
  currentOpeningHours?: OpeningHours;
  rating?: number;
};

type OpeningHours = {
  openNow: boolean;
  periods: OpeningPeriod[];
  weekdayDescriptions: string[];
};

type OpeningPeriod = {
  open: { day: number; hour: number; minute: number };
  close: { day: number; hour: number; minute: number };
}
```

**事前条件**:
- サーバーが起動している
- 有効な位置情報座標が渡される
- 半径が正の数値

**事後条件**:
- 成功時: 店舗データの配列を返す（最大20件）
- 失敗時: エラータイプに応じた適切なエラーオブジェクトを返す

**不変条件**:
- リクエストは常にサーバー経由で実行される（クライアントから直接Places APIを呼び出さない）
- キャッシュは5分間有効

#### OpeningHoursFilter

**責任と境界**
- **主要責任**: 営業時間判定ロジック、24時跨ぎ対応、営業中店舗フィルタリング
- **ドメイン境界**: ビジネスロジック層（営業時間計算）
- **データ所有権**: なし（純粋関数として実装）
- **トランザクション境界**: なし

**依存関係**
- **Inbound**: PlaceSearchController（フィルタリング処理）
- **Outbound**: date-fns（日時計算）
- **External**: date-fns ^3.0.0

**外部依存関係調査**:
- **公式ドキュメント**: [date-fns Documentation](https://date-fns.org/)
- **API署名**: 関数型アプローチで、Dateオブジェクトを引数に取る
- **バージョン互換性**: v3.0.0以降で安定、v2からv3への移行ガイドあり
- **パフォーマンス**: Tree-shakingに対応、必要な関数のみインポート可能
- **既知の問題**: タイムゾーン処理にはdate-fns-tzが必要
- **ベストプラクティス**: `import { format, addHours } from 'date-fns'`で個別インポート

**契約定義**

```typescript
  // 指定時刻に営業中かを判定
  isOpenAt({
    openingHours,
    targetTime
  }: {
    openingHours: OpeningHours | undefined;
    targetTime: Date;
  }): boolean;

  // 営業中店舗のみフィルタリング
  filterOpenPlaces({
    places,
    targetTime
  }: {
    places: Place[];
    targetTime: Date;
  }): Place[];

  // 閉店までの残り時間を計算（分単位）
  calculateRemainingMinutes({
    openingHours,
    currentTime
  }: {
    openingHours: OpeningHours;
    currentTime: Date;
  }): number | null;

  // 営業時間情報の存在確認
  hasOpeningHours({ place }: { place: Place }): boolean;
```

**事前条件**:
- `targetTime`は有効なDateオブジェクト
- `openingHours.periods`は空でない配列（営業時間が存在する場合）

**事後条件**:
- `isOpenAt()`: 営業中の場合`true`、閉店中または営業時間情報なしの場合`false`を返す
- `filterOpenPlaces()`: 営業中店舗のみを含む配列を返す（元の配列は変更しない）
- `calculateRemainingMinutes()`: 閉店までの分数を返す、営業時間外の場合`null`を返す

**不変条件**:
- すべての関数は純粋関数（副作用なし）
- 元のデータを変更しない（イミュータブル）

#### GeolocationService

**責任と境界**
- **主要責任**: 位置情報の取得、パーミッション管理、エラーハンドリング
- **ドメイン境界**: インフラストラクチャ層（ブラウザAPI統合）
- **データ所有権**: 現在地座標、パーミッション状態
- **トランザクション境界**: なし

**依存関係**
- **Inbound**: PlaceSearchController（位置情報要求）
- **Outbound**: Geolocation API（ブラウザ標準）
- **External**: なし（ブラウザ標準API）

**契約定義**

```typescript
  // 現在地取得
  getCurrentLocation(): Promise<Result<LatLng, GeolocationError>>;

  // パーミッション確認
  checkPermission(): Promise<PermissionState>;

type GeolocationError =
  | { type: 'PERMISSION_DENIED'; message: string }
  | { type: 'POSITION_UNAVAILABLE'; message: string }
  | { type: 'TIMEOUT'; message: string }
  | { type: 'NOT_SUPPORTED'; message: string };

type PermissionState = 'granted' | 'denied' | 'prompt';
```

**事前条件**:
- ブラウザがGeolocation APIをサポートしている
- HTTPS接続または localhost環境（Geolocation APIの要件）

**事後条件**:
- 成功時: 緯度・経度を含む座標オブジェクトを返す
- 失敗時: エラータイプに応じた適切なエラーオブジェクトを返す

**不変条件**:
- 位置情報は端末内でのみ使用し、サーバーに送信しない（プライバシー要件）

#### TimeFilterUI

**責任と境界**
- **主要責任**: 時間帯調整UIの表示、ユーザー入力の処理、プリセット時間帯の提供
- **ドメイン境界**: UI/プレゼンテーション層
- **データ所有権**: 選択された時間帯、プリセット時間帯リスト
- **トランザクション境界**: なし

**依存関係**
- **Inbound**: PlaceSearchController（時間帯変更通知）
- **Outbound**: なし
- **External**: React 19.2.0、shadcn/ui（Slider、Select）

**契約定義**

**Reactコンポーネントインターフェース**:

```typescript
type TimeFilterUIProps = {
  // 現在選択されている時間帯
  selectedTime: Date;

  // 時間帯変更時のコールバック
  onTimeChange: ({ newTime }: { newTime: Date }) => void;

  // プリセット時間帯
  presetTimes?: Date[];
}

const PRESET_TIMES = [
  { label: '22:00', hour: 22 },
  { label: '23:00', hour: 23 },
  { label: '24:00', hour: 24 },
  { label: '01:00', hour: 1 }
];
```

**状態管理**:

```typescript
type TimeFilterState = {
  selectedTime: Date;
  isCustomTime: boolean;
};
```

**事前条件**:
- `selectedTime`は有効なDateオブジェクト
- `onTimeChange`は関数

**事後条件**:
- 時間帯変更時に`onTimeChange`コールバックが呼び出される
- UIは選択された時間帯を反映
