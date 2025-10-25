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
 * 周辺検索の入力のスキーマ
 *
 * @example
 * ```ts
 * const result = SearchNearbyRequestSchema.safeParse({
 *   location: { lat: 35.6762, lng: 139.6503 },
 *   radius: 1000
 * });
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
});

/**
 * 周辺検索の入力
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
