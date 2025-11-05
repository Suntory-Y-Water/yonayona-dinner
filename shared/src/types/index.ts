import { z } from "zod";

/**
 * 位置情報（緯度・経度）のスキーマ
 *
 * @example
 * ```ts
 * const result = LatLngSchema.safeParse({ lat: 35.6762, lng: 139.6503 });
 * if (result.success) {
 *   console.log(result.data); // { lat: 35.6762, lng: 139.6503 }
 * }
 * ```
 */
export const LatLngSchema = z.object({
  /** 緯度（-90~90） */
  lat: z
    .number()
    .refine(
      (value) => Number.isFinite(value),
      "緯度は有限数である必要があります",
    )
    .refine(
      (value) => value >= -90 && value <= 90,
      "緯度は-90から90の範囲である必要があります",
    ),
  /** 経度（-180~180） */
  lng: z
    .number()
    .refine(
      (value) => Number.isFinite(value),
      "経度は有限数である必要があります",
    )
    .refine(
      (value) => value >= -180 && value <= 180,
      "経度は-180から180の範囲である必要があります",
    ),
});

/**
 * 位置情報（緯度・経度）
 */
export type LatLng = z.infer<typeof LatLngSchema>;

/**
 * 時刻を表す値オブジェクトのスキーマ
 *
 * @example
 * ```ts
 * const result = TimePointSchema.safeParse({ day: 1, hour: 22, minute: 30 });
 * if (result.success) {
 *   console.log(result.data); // { day: 1, hour: 22, minute: 30 }
 * }
 * ```
 */
export const TimePointSchema = z.object({
  /** 曜日（0=日曜, 6=土曜） */
  day: z.number().int().min(0).max(6),
  /** 時（0-23） */
  hour: z.number().int().min(0).max(23),
  /** 分（0-59） */
  minute: z.number().int().min(0).max(59),
});

/**
 * 時刻を表す値オブジェクト
 */
export type TimePoint = z.infer<typeof TimePointSchema>;

/**
 * 営業時間の開始・終了を表す値オブジェクトのスキーマ
 *
 * @example
 * ```ts
 * const result = OpeningPeriodSchema.safeParse({
 *   open: { day: 1, hour: 18, minute: 0 },
 *   close: { day: 2, hour: 2, minute: 0 }
 * });
 * ```
 */
export const OpeningPeriodSchema = z.object({
  /** 開店時刻 */
  open: TimePointSchema,
  /** 閉店時刻 */
  close: TimePointSchema,
});

/**
 * 営業時間の開始・終了を表す値オブジェクト
 */
export type OpeningPeriod = z.infer<typeof OpeningPeriodSchema>;

/**
 * 営業時間情報のスキーマ
 *
 * @example
 * ```ts
 * const result = OpeningHoursSchema.safeParse({
 *   openNow: true,
 *   periods: [{ open: { day: 1, hour: 18, minute: 0 }, close: { day: 2, hour: 2, minute: 0 } }],
 *   weekdayDescriptions: ["月曜日: 18:00～翌2:00"]
 * });
 * ```
 */
export const OpeningHoursSchema = z.object({
  /** 現在営業中フラグ */
  openNow: z.boolean(),
  /** 営業時間帯リスト */
  periods: z.array(OpeningPeriodSchema),
  /** 曜日別営業時間説明 */
  weekdayDescriptions: z.array(z.string()),
});

/**
 * 営業時間情報
 */
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;

/**
 * 店舗情報のスキーマ
 *
 * @example
 * ```ts
 * const result = PlaceSchema.safeParse({
 *   id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
 *   displayName: "居酒屋やまと",
 *   location: { lat: 35.6762, lng: 139.6503 },
 *   formattedAddress: "東京都新宿区...",
 *   rating: 4.5
 * });
 * ```
 */
export const PlaceSchema = z.object({
  /** 一意識別子（Google Place ID） */
  id: z.string(),
  /** 表示名 */
  displayName: z.string(),
  /** 位置情報 */
  location: LatLngSchema,
  /** 住所 */
  formattedAddress: z.string(),
  /** 営業時間（任意） */
  currentOpeningHours: OpeningHoursSchema.optional(),
  /** 評価（0.0-5.0、任意） */
  rating: z.number().min(0).max(5).optional(),
});

/**
 * 店舗情報
 */
export type Place = z.infer<typeof PlaceSchema>;

/**
 * 営業状態情報のスキーマ
 *
 * バックエンドで整形済みの営業ステータスを表現し、
 * フロントエンドは`statusText`をそのまま表示するだけでよい。
 *
 * @example
 * ```ts
 * const result = BusinessStatusSchema.parse({
 *   isOpenNow: true,
 *   remainingMinutes: 75,
 *   statusText: "営業中（あと1時間15分）",
 * });
 * console.log(result.statusText); // "営業中（あと1時間15分）"
 * ```
 */
export const BusinessStatusSchema = z.object({
  /** 現在営業中かどうか */
  isOpenNow: z.boolean(),
  /** 閉店までの残り時間（分、0の場合は閉店済みまたは情報無し扱い） */
  remainingMinutes: z.number().int().min(0),
  /** 表示用ステータステキスト（例: 営業中（あと20分）） */
  statusText: z.string(),
});

/**
 * 営業状態情報
 *
 * @example
 * ```ts
 * const status: BusinessStatus = {
 *   isOpenNow: true,
 *   remainingMinutes: 75,
 *   statusText: "営業中（あと1時間15分）",
 * };
 * console.log(status.statusText); // "営業中（あと1時間15分）"
 * ```
 */
export type BusinessStatus = z.infer<typeof BusinessStatusSchema>;

/**
 * 表示用営業時間情報のスキーマ
 *
 * @example
 * ```ts
 * const result = OpeningHoursDisplaySchema.parse({
 *   todayHours: "18:00～翌2:00",
 * });
 * console.log(result.todayHours); // "18:00～翌2:00"
 * ```
 */
export const OpeningHoursDisplaySchema = z.object({
  /** 今日の営業時間（例: "10:30～19:30", "定休日"） */
  todayHours: z.string(),
});

/**
 * 表示用営業時間情報
 *
 * @example
 * ```ts
 * const display: OpeningHoursDisplay = {
 *   todayHours: "18:00～翌2:00",
 * };
 * console.log(display.todayHours); // "18:00～翌2:00"
 * ```
 */
export type OpeningHoursDisplay = z.infer<typeof OpeningHoursDisplaySchema>;

/**
 * 表示用店舗情報のスキーマ
 *
 * PlaceSchemaから営業時間の生データを除き、
 * バックエンドで加工済みの情報を付与する。
 *
 * @example
 * ```ts
 * const display = DisplayPlaceSchema.parse({
 *   id: "ChIJ...",
 *   displayName: "居酒屋やまと",
 *   formattedAddress: "東京都新宿区...",
 *   location: { lat: 35.6762, lng: 139.6503 },
 *   businessStatus: {
 *     isOpenNow: true,
 *     remainingMinutes: 120,
 *     statusText: "営業中（あと2時間）",
 *   },
 *   openingHoursDisplay: {
 *     todayHours: "18:00～翌2:00",
 *   },
 * });
 * console.log(display.businessStatus.statusText); // "営業中（あと2時間）"
 * ```
 */
export const DisplayPlaceSchema = PlaceSchema.extend({
  /** 営業ステータス */
  businessStatus: BusinessStatusSchema,
  /** 表示用営業時間 */
  openingHoursDisplay: OpeningHoursDisplaySchema,
});

/**
 * 表示用店舗情報
 *
 * @example
 * ```ts
 * const place: DisplayPlace = {
 *   id: "ChIJ123456",
 *   displayName: "居酒屋サンプル",
 *   formattedAddress: "東京都千代田区丸の内1-1-1",
 *   location: { lat: 35.6812, lng: 139.7671 },
 *   businessStatus: {
 *     isOpenNow: true,
 *     remainingMinutes: 120,
 *     statusText: "営業中（あと2時間）",
 *   },
 *   openingHoursDisplay: {
 *     todayHours: "18:00～翌2:00",
 *   },
 * };
 * console.log(place.businessStatus.statusText); // "営業中（あと2時間）"
 * ```
 */
export type DisplayPlace = z.infer<typeof DisplayPlaceSchema>;

/**
 * 営業中店舗情報（残り時間付き）のスキーマ
 *
 * @example
 * ```ts
 * const result = FilteredPlaceSchema.safeParse({
 *   id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
 *   displayName: "居酒屋やまと",
 *   location: { lat: 35.6762, lng: 139.6503 },
 *   formattedAddress: "東京都新宿区...",
 *   remainingMinutes: 120,
 * });
 * if (result.success) {
 *   console.log(result.data.remainingMinutes); // 120
 * }
 * ```
 * @deprecated DisplayPlaceSchemaを使用してください。
 */
export const FilteredPlaceSchema = PlaceSchema.extend({
  /** 閉店までの残り時間（分、0以上の整数） */
  remainingMinutes: z
    .number()
    .int()
    .min(0, "remainingMinutesは0以上の整数である必要があります"),
});

/**
 * 営業中店舗情報（残り時間付き）
 *
 * @deprecated DisplayPlaceを使用してください。
 */
export type FilteredPlace = z.infer<typeof FilteredPlaceSchema>;

/**
 * Places APIでのエラー種別のスキーマ
 *
 * @example
 * ```ts
 * const result = PlacesAPIErrorSchema.safeParse({
 *   type: "RATE_LIMIT",
 *   message: "リクエスト制限を超えました"
 * });
 * ```
 */
export const PlacesAPIErrorSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("RATE_LIMIT"), message: z.string() }),
  z.object({ type: z.literal("AUTH_ERROR"), message: z.string() }),
  z.object({ type: z.literal("NETWORK_ERROR"), message: z.string() }),
  z.object({ type: z.literal("INVALID_REQUEST"), message: z.string() }),
  z.object({ type: z.literal("SERVICE_UNAVAILABLE"), message: z.string() }),
]);

/**
 * Places APIでのエラー種別
 */
export type PlacesAPIError = z.infer<typeof PlacesAPIErrorSchema>;

/**
 * JST時刻文字列のスキーマ（yyyy-MM-ddTHH:mm:ss形式）
 *
 * Brand型により、単なる文字列と区別し、型安全性を確保する。
 * 営業中判定、残り時間計算など、様々な用途で使用される。
 *
 * @example
 * ```ts
 * const schema = JstTimeStringSchema;
 * const result = schema.parse("2025-10-27T20:00:00");
 * // result型: string & { readonly __brand: "JstTimeString" }
 * ```
 */
export const JstTimeStringSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
    "JST時刻はyyyy-MM-ddTHH:mm:ss形式である必要があります",
  )
  .brand("JstTimeString");

/**
 * JST時刻文字列の型（yyyy-MM-ddTHH:mm:ss形式）
 *
 * Brand型により、フォーマット保証された時刻文字列のみを表現する。
 *
 * @example
 * ```ts
 * const time: JstTimeString = JstTimeStringSchema.parse("2025-10-27T20:00:00");
 * ```
 */
export type JstTimeString = z.infer<typeof JstTimeStringSchema>;

/**
 * 周辺検索の入力のスキーマ
 *
 * @example
 * ```ts
 * const result = SearchNearbyRequestSchema.safeParse({
 *   location: { lat: 35.6762, lng: 139.6503 },
 *   radius: 800,
 *   targetTime: "2025-10-30T23:00:00",
 * });
 * if (result.success) {
 *   console.log(result.data.targetTime); // "2025-10-30T23:00:00"
 * }
 * ```
 */
export const SearchNearbyRequestSchema = z.object({
  /** 検索中心位置 */
  location: LatLngSchema,
  /** 検索半径（メートル） */
  radius: z
    .number()
    .refine(
      (value) => Number.isFinite(value),
      "半径は有限数である必要があります",
    )
    .refine(
      (value) => value >= 1 && value <= 50000,
      "半径は1から50000の範囲である必要があります",
    ),
  /**
   * 営業中判定に使用する目標時刻（JST基準、ISO 8601形式）
   *
   * 形式: "yyyy-MM-ddTHH:mm:ss" (例: "2025-10-27T20:00:00")
   * タイムゾーン: 常にJST（Asia/Tokyo）として解釈される
   * Brand型により、フォーマット保証された文字列のみを受け入れる
   */
  targetTime: JstTimeStringSchema,
});

/**
 * 周辺検索の入力
 *
 * @example
 * ```ts
 * const request: SearchNearbyRequest = {
 *   location: { lat: 35.6762, lng: 139.6503 },
 *   radius: 800,
 *   targetTime: "2025-10-30T23:00:00",
 * };
 * console.log(request.targetTime); // "2025-10-30T23:00:00"
 * ```
 */
export type SearchNearbyRequest = z.infer<typeof SearchNearbyRequestSchema>;

/**
 * Places APIの検索レスポンスのスキーマ
 *
 * @example
 * ```ts
 * const result = PlacesSearchResponseSchema.safeParse({
 *   places: [{ id: "...", displayName: "居酒屋", location: {...}, formattedAddress: "..." }]
 * });
 * ```
 */
export const PlacesSearchResponseSchema = z.object({
  /** 検索結果 */
  places: z.array(PlaceSchema),
});

/**
 * Places APIの検索レスポンス
 */
export type PlacesSearchResponse = z.infer<typeof PlacesSearchResponseSchema>;

/**
 * 営業中店舗レスポンスのスキーマ
 *
 * @example
 * ```ts
 * const result = FilteredPlacesResponseSchema.safeParse({
 *   places: [
 *     {
 *       id: "ChIJ...",
 *       displayName: "居酒屋 example",
 *       location: { lat: 35.68, lng: 139.76 },
 *       formattedAddress: "東京都...",
 *       remainingMinutes: 60,
 *     },
 *   ],
 * });
 * if (result.success) {
 *   console.log(result.data.places[0]?.remainingMinutes); // 60
 * }
 * ```
 * @deprecated DisplayPlacesResponseSchemaを使用してください。
 */
export const FilteredPlacesResponseSchema = z.object({
  /** 営業中店舗リスト */
  places: z.array(FilteredPlaceSchema),
});

/**
 * 営業中店舗レスポンス
 */
export type FilteredPlacesResponse = z.infer<
  typeof FilteredPlacesResponseSchema
>;

/**
 * 表示用店舗レスポンスのスキーマ
 *
 * @example
 * ```ts
 * const result = DisplayPlacesResponseSchema.parse({
 *   places: [
 *     {
 *       id: "ChIJ...",
 *       displayName: "居酒屋 example",
 *       formattedAddress: "東京都...",
 *       location: { lat: 35.68, lng: 139.76 },
 *       businessStatus: {
 *         isOpenNow: true,
 *         remainingMinutes: 90,
 *         statusText: "営業中（あと1時間30分）",
 *       },
 *       openingHoursDisplay: {
 *         todayHours: "17:00～23:00",
 *       },
 *     },
 *   ],
 * });
 * console.log(result.places[0]?.openingHoursDisplay.todayHours); // "17:00～23:00"
 * ```
 */
export const DisplayPlacesResponseSchema = z.object({
  /** 表示用の営業中店舗リスト */
  places: z.array(DisplayPlaceSchema),
});

/**
 * 表示用店舗レスポンス
 */
export type DisplayPlacesResponse = z.infer<typeof DisplayPlacesResponseSchema>;

/**
 * 成功・失敗を表すResult型
 */
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * 位置情報取得エラーの種類のスキーマ
 *
 * @example
 * ```ts
 * const result = GeolocationErrorSchema.safeParse({
 *   type: "PERMISSION_DENIED",
 *   message: "位置情報の取得が拒否されました"
 * });
 * ```
 */
export const GeolocationErrorSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("PERMISSION_DENIED"), message: z.string() }),
  z.object({ type: z.literal("POSITION_UNAVAILABLE"), message: z.string() }),
  z.object({ type: z.literal("TIMEOUT"), message: z.string() }),
  z.object({ type: z.literal("NOT_SUPPORTED"), message: z.string() }),
]);

/**
 * 位置情報取得エラーの種類
 */
export type GeolocationError = z.infer<typeof GeolocationErrorSchema>;

/**
 * パーミッション状態
 */
export type PermissionState = "granted" | "denied" | "prompt";

/**
 * Cloudflare Workersの環境変数バインディングのスキーマ
 *
 * @example
 * ```ts
 * const result = EnvSchema.safeParse({ GOOGLE_PLACES_API_KEY: "your-api-key" });
 * ```
 */
export const EnvSchema = z.object({
  /** Places APIキー */
  GOOGLE_PLACES_API_KEY: z.string(),
});

/**
 * Cloudflare Workersの環境変数バインディング
 */
export type Env = z.infer<typeof EnvSchema>;
