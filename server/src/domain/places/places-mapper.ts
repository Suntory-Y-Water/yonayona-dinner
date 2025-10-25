/**
 * Google Places APIのレスポンスをドメインモデルに変換する
 * アンチコラプション層の責務
 */
import type { Place, PlacesAPIError, TimePoint } from "yonayona-dinner-shared";

import { safeJson } from "../../utils/safe-json";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  currentOpeningHours?: GoogleOpeningHours;
  rating?: number;
};

type GoogleOpeningHours = {
  openNow?: boolean;
  periods?: GoogleOpeningPeriod[];
  weekdayDescriptions?: string[];
};

type GoogleOpeningPeriod = {
  open?: GoogleOpeningTime;
  close?: GoogleOpeningTime;
};

type GoogleOpeningTime = {
  day?: number;
  hour?: number;
  minute?: number;
};

type NormalizedOpeningHours = NonNullable<Place["currentOpeningHours"]>;
type NormalizedOpeningPeriod = NormalizedOpeningHours["periods"][number];
type NormalizedOpeningTime = NormalizedOpeningPeriod["open"];

/**
 * Google Places APIの素データをドメインのPlace型に正規化する。
 *
 * @example
 * ```ts
 * const place = mapGooglePlaceToPlace({
 *   raw: { id: "abc", displayName: { text: "Cafe" } }
 * });
 * console.log(place.displayName); // "Cafe"
 * ```
 */
export function mapGooglePlaceToPlace({ raw }: { raw: GooglePlace }): Place {
  return {
    id: raw.id ?? "",
    displayName: raw.displayName?.text ?? "",
    formattedAddress: raw.formattedAddress ?? "",
    location: {
      lat: raw.location?.latitude ?? 0,
      lng: raw.location?.longitude ?? 0,
    },
    currentOpeningHours: mapGoogleOpeningHours({
      raw: raw.currentOpeningHours,
    }),
    rating: raw.rating,
  };
}

/**
 * Googleの営業時間表現をアプリのOpeningHoursに変換する。
 *
 * @example
 * ```ts
 * const hours = mapGoogleOpeningHours({
 *   raw: { openNow: true, periods: [] }
 * });
 * console.log(hours?.openNow); // true
 * ```
 */
export function mapGoogleOpeningHours({
  raw,
}: {
  raw?: GoogleOpeningHours;
}): Place["currentOpeningHours"] {
  if (!raw) {
    return undefined;
  }

  return {
    openNow: raw.openNow ?? false,
    periods: (raw.periods ?? []).map((period) => ({
      open: mapGoogleOpeningTime({ raw: period.open }),
      close: mapGoogleOpeningTime({ raw: period.close }),
    })),
    weekdayDescriptions: raw.weekdayDescriptions ?? [],
  } satisfies NormalizedOpeningHours;
}

/**
 * Googleの時刻表現をTimePointに変換する。
 *
 * @example
 * ```ts
 * const time = mapGoogleOpeningTime({
 *   raw: { day: 1, hour: 10, minute: 30 }
 * });
 * console.log(time.hour); // 10
 * ```
 */
export function mapGoogleOpeningTime({
  raw,
}: {
  raw?: GoogleOpeningTime;
}): TimePoint {
  return {
    day: raw?.day ?? 0,
    hour: raw?.hour ?? 0,
    minute: raw?.minute ?? 0,
  } satisfies NormalizedOpeningTime;
}

/**
 * Places APIレスポンスからエラーメッセージを抽出する。
 *
 * @example
 * ```ts
 * const message = await extractErrorMessage({
 *   response: new Response("{}", { status: 400 })
 * });
 * console.log(message);
 * ```
 */
export async function extractErrorMessage({
  response,
}: {
  response: Response;
}): Promise<string> {
  const json = await safeJson<{ error?: { message?: string } }>({
    response,
  });
  return (
    json?.error?.message ??
    `Places API request failed with status ${response.status}`
  );
}

/**
 * HTTPステータスをPlacesAPIErrorに変換する。
 *
 * @example
 * ```ts
 * const error = mapHttpStatusToPlacesError({
 *   status: 429,
 *   message: "quota"
 * });
 * console.log(error.type); // "RATE_LIMIT"
 * ```
 */
export function mapHttpStatusToPlacesError({
  status,
  message,
}: {
  status: number;
  message: string;
}): PlacesAPIError {
  if (status === 400) {
    return { type: "INVALID_REQUEST", message };
  }

  if (status === 401 || status === 403) {
    return { type: "AUTH_ERROR", message };
  }

  if (status === 429) {
    return { type: "RATE_LIMIT", message };
  }

  if (status === 503) {
    return { type: "SERVICE_UNAVAILABLE", message };
  }

  return { type: "SERVICE_UNAVAILABLE", message };
}

/**
 * ネットワーク例外をPlacesAPIErrorへ正規化する。
 *
 * @example
 * ```ts
 * const error = mapNetworkErrorToPlacesError({
 *   error: new Error("down")
 * });
 * console.log(error.message); // "down"
 * ```
 */
export function mapNetworkErrorToPlacesError({
  error,
}: {
  error: unknown;
}): PlacesAPIError {
  if (error instanceof Error) {
    return { type: "NETWORK_ERROR", message: error.message };
  }
  return { type: "NETWORK_ERROR", message: "Unknown network error" };
}
