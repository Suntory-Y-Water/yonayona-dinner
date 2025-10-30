# マーカー表示と店舗詳細パネル設計

## 概要

タスク5.1～5.3の実装における、地図上のマーカー表示、店舗詳細パネル、Googleマップ外部ナビゲーションの設計を定義します。

## 設計原則

- **関数ベース実装**: クラスを使用せず、React Hooksと純粋関数で実装
- **契約による設計**: 関数名と型定義で契約を明示
- **バックエンド依存**: 営業時間判定と表示テキスト整形はサーバー側で完結
- **型安全**: Hono RPCを使用したサーバーとの型安全な通信

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────┐
│           Home Component (React)                 │
│  ┌──────────────────────────────────────────┐   │
│  │  useEffect: 地図初期化 + 店舗検索        │   │
│  └──────────────────────────────────────────┘   │
│                     ↓                            │
│  ┌──────────────────────────────────────────┐   │
│  │  PlacesService.searchNearby()            │   │
│  │  (Hono RPC Client)                       │   │
│  └──────────────────────────────────────────┘   │
│                     ↓                            │
│  ┌──────────────────────────────────────────┐   │
│  │  MapService.displayMarkers()             │   │
│  │  + クリックイベント設定                  │   │
│  └──────────────────────────────────────────┘   │
│                     ↓                            │
│  ┌──────────────────────────────────────────┐   │
│  │  マーカークリック                        │   │
│  │  → setSelectedPlace()                    │   │
│  │  → setIsPanelOpen(true)                  │   │
│  └──────────────────────────────────────────┘   │
│                     ↓                            │
│  ┌──────────────────────────────────────────┐   │
│  │  PlaceDetailPanel (Sheet Component)      │   │
│  │  - 店名                                  │   │
│  │  - 住所                                  │   │
│  │  - 営業時間                              │   │
│  │  - 営業ステータス                        │   │
│  │  - Googleマップ起動ボタン                │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 5.1 営業中店舗のマーカー配置

### 店舗検索フロー

1. **トリガー**: 地図初期化完了後（`useEffect`内）
2. **検索条件**:
   - `location`: ユーザーの現在地（`LatLng`）
   - `radius`: 800メートル（初期値）
   - `targetTime`: JST 23:00固定（タスク6で可変化予定）
3. **API呼び出し**: `PlacesService.searchNearby()`（Hono RPCクライアント）
4. **レスポンス**: `DisplayPlace[]`（バックエンドで整形済み）

### targetTime（検索基準時刻）の管理

**状態変数での管理**:
```typescript
// Homeコンポーネント内
const [targetTime, setTargetTime] = useState<string>("23:00"); // デフォルトは23:00
```

**時刻文字列フォーマット関数**:
```typescript
/**
 * 日付と時刻文字列からJST時刻文字列を生成
 *
 * @param date - 基準日
 * @param time - 時刻文字列（"HH:mm"形式）
 * @returns JST時刻文字列（"yyyy-MM-ddTHH:mm:ss"形式）
 * @example
 * formatToJstTimeString({ date: new Date("2025-10-30"), time: "23:00" })
 * // => "2025-10-30T23:00:00"
 */
function formatToJstTimeString({ date, time }: { date: Date; time: string }): JstTimeString
```

実装方針:
- `date-fns`の`format`と`date-fns-tz`の`toZonedTime`を使用
- 指定日付の指定時刻をJSTで生成
- タスク6で時間調整UI実装時に`setTargetTime()`で時刻を変更可能

### マーカー配置処理

既存の`MapService.displayMarkers()`を拡張:

```typescript
/**
 * 店舗マーカーを地図上に配置
 *
 * @param map - Google Maps インスタンス
 * @param places - 表示する店舗リスト
 * @param onMarkerClick - マーカークリック時のコールバック
 * @returns クリーンアップ用のマーカー配列
 *
 * @example
 * const markers = await displayMarkers({
 *   map,
 *   places: [{ id: "abc", displayName: "居酒屋", ... }],
 *   onMarkerClick: (place) => setSelectedPlace(place)
 * });
 */
async function displayMarkers({
  map,
  places,
  onMarkerClick,
}: {
  map: google.maps.Map;
  places: DisplayPlace[];
  onMarkerClick: (place: DisplayPlace) => void;
}): Promise<google.maps.marker.AdvancedMarkerElement[]>
```

実装内容:
- `AdvancedMarkerElement`で黄金色（`#FFD700`）のピンを配置
- `marker.addListener("click", () => onMarkerClick(place))`でイベント設定
- マーカー配列を返却（クリーンアップ用）

### エラーハンドリング

- **位置情報取得失敗**: 既存の`GeolocationService`のエラーハンドリングを活用
- **API呼び出し失敗**: `Result`型で処理し、エラーメッセージを表示
- **マーカー配置失敗**: エラーログ出力し、ユーザーに通知

## 5.2 店舗詳細パネルの構築

### UIコンポーネント選定

**選定**: shadcn/uiの`Sheet`コンポーネント

理由:
- モバイル最適化要件（8.1～8.4）に適合
- 画面下部からスライドイン形式で、地図の視認性を保つ
- 親指で到達可能な位置に配置可能
- ダークテーマ対応

### コンポーネント構造

```typescript
/**
 * 店舗詳細パネルコンポーネント
 *
 * @param place - 表示する店舗情報（バックエンド整形済み）
 * @param isOpen - パネルの開閉状態
 * @param onClose - パネルを閉じるコールバック
 * @param onNavigate - Googleマップ起動コールバック
 *
 * @example
 * <PlaceDetailPanel
 *   place={{
 *     displayName: "居酒屋 example",
 *     formattedAddress: "東京都...",
 *     businessStatus: { statusText: "営業中（あと2時間）", ... },
 *     openingHoursDisplay: { todayHours: "18:00～翌2:00" },
 *     location: { lat: 35.6812, lng: 139.7671 }
 *   }}
 *   isOpen={true}
 *   onClose={() => setIsPanelOpen(false)}
 *   onNavigate={(location) => openGoogleMaps(location)}
 * />
 */
function PlaceDetailPanel({
  place,
  isOpen,
  onClose,
  onNavigate,
}: {
  place: DisplayPlace | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (location: LatLng) => void;
}): JSX.Element
```

### 表示内容

バックエンドで整形済みのため、フロントエンドはそのまま表示:

1. **店名**: `place.displayName`
   - フォントサイズ: 18px以上（見出し）
   - 色: 白（`text-foreground`）

2. **住所**: `place.formattedAddress`
   - フォントサイズ: 14px以上
   - 色: グレー（`text-muted-foreground`）

3. **今日の営業時間**: `place.openingHoursDisplay.todayHours`
   - 例: "18:00～翌2:00"
   - フォントサイズ: 14px以上

4. **営業ステータス**: `place.businessStatus.statusText`
   - 例: "営業中（あと2時間）"
   - 色: 黄金色（`text-[#FFD700]`）
   - フォントサイズ: 16px以上（強調）

5. **Googleマップ起動ボタン**:
   - ラベル: "Googleマップで開く"
   - タップ領域: 最小44x44ピクセル
   - 背景色: 黄金色（`bg-[#FFD700]`）
   - 文字色: 黒（`text-black`）

### レイアウト

```
┌─────────────────────────────────────┐
│ Sheet (画面下部からスライドイン)    │
│                                     │
│  [×] 閉じるボタン                   │
│                                     │
│  店名: 居酒屋 example                │
│                                     │
│  住所: 東京都...                     │
│                                     │
│  営業時間: 18:00～翌2:00             │
│                                     │
│  営業中（あと2時間）                 │
│  ↑ 黄金色で強調                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Googleマップで開く           │   │
│  │  (44x44px以上のタップ領域)    │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### アクセシビリティ

- モバイル最適化: 最小フォントサイズ14px（要件8.4）
- タッチ操作: ボタンのタップ領域は最小44x44ピクセル（要件8.2）
- 配置: 画面下部に主要操作UIを配置（要件8.3）
- 読みやすさ: 白文字 + 暗い背景でコントラスト確保

## 5.3 Googleマップ外部ナビゲーション連携

### URLスキーム

Google Maps URL API: `https://www.google.com/maps/search/?api=1&query={lat},{lng}`

参考: [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started)

### 実装

```typescript
/**
 * Googleマップアプリ/Webで店舗位置を開く
 *
 * @param location - 店舗の位置情報
 *
 * @example
 * openGoogleMaps({ lat: 35.6812, lng: 139.7671 })
 * // => https://www.google.com/maps/search/?api=1&query=35.6812,139.7671 を新しいタブで開く
 */
function openGoogleMaps({ lat, lng }: LatLng): void {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  window.open(url, "_blank");
}
```

動作:
- デスクトップ: ブラウザの新しいタブでGoogleマップを開く
- モバイル: Googleマップアプリがインストールされている場合はアプリで開く、なければブラウザで開く
- 経路案内: ユーザーがGoogleマップ内で「ルート」ボタンをタップして設定（アプリ側に委任）

### セキュリティ

- `window.open(url, "_blank")`に`rel="noopener noreferrer"`は不要（URLは完全に制御下）
- 位置情報は店舗の緯度経度のみ（ユーザーの現在地は送信しない）

## データフロー

### 初期化フロー

```
1. アプリ起動
   ↓
2. 位置情報取得（GeolocationService）
   ↓
3. 地図初期化（MapService）
   ↓
4. 店舗検索（PlacesService）
   - location: ユーザーの現在地
   - radius: 800m
   - targetTime: formatToJstTimeString({ date: new Date(), time: "23:00" })
     → "2025-10-30T23:00:00"
   ↓
5. マーカー配置（MapService）
   - DisplayPlace[] → AdvancedMarkerElement[]
   - クリックイベント設定
```

### ユーザーインタラクションフロー

```
1. マーカークリック
   ↓
2. setSelectedPlace(place)
   + setIsPanelOpen(true)
   ↓
3. Sheet表示
   - 店名、住所、営業時間、営業ステータス表示
   ↓
4. [Googleマップで開く]ボタンクリック
   ↓
5. openGoogleMaps(place.location)
   ↓
6. 新しいタブでGoogleマップ起動
```

## 型定義

### DisplayPlace型（バックエンドから受け取る）

```typescript
type DisplayPlace = Omit<Place, "currentOpeningHours"> & {
  businessStatus: BusinessStatus;
  openingHoursDisplay: OpeningHoursDisplay;
}

type BusinessStatus = {
  /** 現在営業中かどうか */
  isOpenNow: boolean;
  /** 閉店までの残り時間（分） */
  remainingMinutes: number;
  /** 表示用テキスト（例: "営業中（あと2時間）"） */
  statusText: string;
}

type OpeningHoursDisplay = {
  /** 今日の営業時間（例: "18:00～翌2:00"） */
  todayHours: string;
}
```

### SearchNearbyRequest型

```typescript
type SearchNearbyRequest = {
  location: LatLng;
  radius: number;
  targetTime: JstTimeString;
}
```

### Result型

```typescript
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E }
```

## パフォーマンス要件

- **地図表示**: 起動から2秒以内（要件1.4）
- **店舗検索**: キャッシュ利用（TTL 5分、バックエンド実装済み）
- **マーカー配置**: 非同期処理で地図のUIブロックを防ぐ
- **パネル表示**: Sheetのアニメーション最適化（60fps維持）

## テスト方針

### ユニットテスト

- `createDefaultTargetTime()`: JST 23:00の時刻文字列生成を検証
- `openGoogleMaps()`: 正しいURL生成を検証（`window.open`のモック）
- `PlaceDetailPanel`: 各プロパティの表示を検証

### 統合テスト

- 地図初期化 → 店舗検索 → マーカー配置のフロー
- マーカークリック → パネル表示のフロー
- Googleマップ起動ボタン → 外部ナビゲーションのフロー

## セキュリティとプライバシー

- **位置情報**: ユーザーの現在地はサーバーに送信（店舗検索に必要）
- **APIキー保護**: Google Maps API KeyはHTTPリファラー制限設定（Cloud Console）
- **データ保存**: 位置情報をローカルストレージに保存しない
- **外部ナビゲーション**: 店舗の緯度経度のみをGoogleマップに渡す

## 将来の拡張性

タスク6（時間帯調整UI）での変更点:
- `targetTime`を状態変数化（`useState`）
- 時間調整UIで`targetTime`を変更
- クライアント側で`DisplayPlace[]`を再フィルタリング（サーバー再検索不要）

タスク7（検索結果0件時の自動緩和）での変更点:
- `radius`を段階的に拡大（800m → 1200m）
- `targetTime`を段階的に緩和（23:00 → 22:00）

## 参考資料

- [Google Maps JavaScript API - Advanced Markers](https://developers.google.com/maps/documentation/javascript/advanced-markers/overview)
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started)
- [shadcn/ui - Sheet](https://ui.shadcn.com/docs/components/sheet)
- [設計ドキュメント - フロントエンドコンポーネント](./design_フロントエンドコンポーネント.md)
