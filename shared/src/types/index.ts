/**
 * 位置情報（緯度・経度）
 */
export type LatLng = {
  /** 緯度（-90~90） */
  lat: number;
  /** 経度（-180~180） */
  lng: number;
};

/**
 * 時刻を表す値オブジェクト
 */
export type TimePoint = {
  /** 曜日（0=日曜, 6=土曜） */
  day: number;
  /** 時（0-23） */
  hour: number;
  /** 分（0-59） */
  minute: number;
};

/**
 * 営業時間の開始・終了を表す値オブジェクト
 */
export type OpeningPeriod = {
  /** 開店時刻 */
  open: TimePoint;
  /** 閉店時刻 */
  close: TimePoint;
};

/**
 * 営業時間情報
 */
export type OpeningHours = {
  /** 現在営業中フラグ */
  openNow: boolean;
  /** 営業時間帯リスト */
  periods: OpeningPeriod[];
  /** 曜日別営業時間説明 */
  weekdayDescriptions: string[];
};

/**
 * 店舗情報
 */
export type Place = {
  /** 一意識別子（Google Place ID） */
  id: string;
  /** 表示名 */
  displayName: string;
  /** 位置情報 */
  location: LatLng;
  /** 住所 */
  formattedAddress: string;
  /** 営業時間（任意） */
  currentOpeningHours?: OpeningHours;
  /** 評価（0.0-5.0、任意） */
  rating?: number;
};

/**
 * Places APIでのエラー種別
 */
export type PlacesAPIError =
  | { type: "RATE_LIMIT"; message: string }
  | { type: "AUTH_ERROR"; message: string }
  | { type: "NETWORK_ERROR"; message: string }
  | { type: "INVALID_REQUEST"; message: string }
  | { type: "SERVICE_UNAVAILABLE"; message: string };

/**
 * 周辺検索の入力
 */
export type SearchNearbyRequest = {
  /** 検索中心位置 */
  location: LatLng;
  /** 検索半径（メートル） */
  radius: number;
};

/**
 * Places APIの検索レスポンス
 */
export type PlacesSearchResponse = {
  /** 検索結果 */
  places: Place[];
};

/**
 * 成功・失敗を表すResult型
 */
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * 位置情報取得エラーの種類
 */
export type GeolocationError =
  | { type: "PERMISSION_DENIED"; message: string }
  | { type: "POSITION_UNAVAILABLE"; message: string }
  | { type: "TIMEOUT"; message: string }
  | { type: "NOT_SUPPORTED"; message: string };

/**
 * パーミッション状態
 */
export type PermissionState = "granted" | "denied" | "prompt";

/**
 * Cloudflare Workersの環境変数バインディング
 */
export type Env = {
  /** Places APIキー */
  GOOGLE_PLACES_API_KEY: string;
};
