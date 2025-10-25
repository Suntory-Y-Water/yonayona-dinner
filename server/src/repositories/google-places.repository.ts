import type {
  Place,
  PlacesAPIError,
  Result,
  SearchNearbyRequest,
  TimePoint,
} from "yonayona-dinner-shared";
import type { IPlacesRepository } from "./interfaces/places-repository.interface";

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchNearby";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.currentOpeningHours",
  "places.formattedAddress",
  "places.rating",
].join(",");

type PlacesApiSuccessResponse = {
  places?: GooglePlace[];
};

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
 * Google Places APIを呼び出すRepository。
 *
 * @example
 * ```ts
 * const repository = new GooglePlacesRepository({ apiKey: "test-key" });
 * const result = await repository.searchNearby({
 *   location: { lat: 35.681236, lng: 139.767125 },
 *   radius: 800,
 * });
 * console.log(result.success);
 * ```
 */
export class GooglePlacesRepository implements IPlacesRepository {
  private readonly apiKey: string;

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
  }

  async searchNearby({
    location,
    radius,
  }: SearchNearbyRequest): Promise<Result<Place[], PlacesAPIError>> {
    const body = JSON.stringify({
      includedTypes: ["restaurant", "cafe", "bar"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng,
          },
          radius,
        },
      },
    });

    try {
      const response = await fetch(PLACES_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body,
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        return {
          success: false,
          error: mapHttpStatusToPlacesError(response.status, errorMessage),
        };
      }

      const payload =
        (await safeJson<PlacesApiSuccessResponse>(response)) ?? {};
      const places = Array.isArray(payload.places)
        ? payload.places.map(normalizePlace)
        : [];
      return { success: true, data: places };
    } catch (error) {
      return { success: false, error: toNetworkError(error) };
    }
  }
}

/**
 * Places APIの素データをドメインのPlace型に正規化する。
 *
 * @example
 * ```ts
 * const place = normalizePlace({ id: "abc", displayName: { text: "Cafe" } });
 * console.log(place.displayName);
 * ```
 */
function normalizePlace(raw: GooglePlace): Place {
  return {
    id: raw.id ?? "",
    displayName: raw.displayName?.text ?? "",
    formattedAddress: raw.formattedAddress ?? "",
    location: {
      lat: raw.location?.latitude ?? 0,
      lng: raw.location?.longitude ?? 0,
    },
    currentOpeningHours: normalizeOpeningHours(raw.currentOpeningHours),
    rating: raw.rating,
  };
}

/**
 * Googleの営業時間表現をアプリのOpeningHoursに変換する。
 *
 * @example
 * ```ts
 * const hours = normalizeOpeningHours({ openNow: true, periods: [] });
 * console.log(hours?.openNow);
 * ```
 */
function normalizeOpeningHours(
  raw?: GoogleOpeningHours,
): Place["currentOpeningHours"] {
  if (!raw) {
    return undefined;
  }

  return {
    openNow: raw.openNow ?? false,
    periods: (raw.periods ?? []).map((period) => ({
      open: normalizeOpeningTime(period.open),
      close: normalizeOpeningTime(period.close),
    })),
    weekdayDescriptions: raw.weekdayDescriptions ?? [],
  } satisfies NormalizedOpeningHours;
}

/**
 * Googleの時刻表現をTimePointに変換する。
 *
 * @example
 * ```ts
 * const time = normalizeOpeningTime({ day: 1, hour: 10, minute: 30 });
 * console.log(time.hour);
 * ```
 */
function normalizeOpeningTime(raw?: GoogleOpeningTime): TimePoint {
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
 * const message = await extractErrorMessage(new Response("{}", { status: 400 }));
 * console.log(message);
 * ```
 */
async function extractErrorMessage(response: Response): Promise<string> {
  const json = await safeJson<{ error?: { message?: string } }>(response);
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
 * const error = mapHttpStatusToPlacesError(429, "quota");
 * console.log(error.type);
 * ```
 */
function mapHttpStatusToPlacesError(
  status: number,
  message: string,
): PlacesAPIError {
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
 * const error = toNetworkError(new Error("down"));
 * console.log(error.message);
 * ```
 */
function toNetworkError(error: unknown): PlacesAPIError {
  if (error instanceof Error) {
    return { type: "NETWORK_ERROR", message: error.message };
  }
  return { type: "NETWORK_ERROR", message: "Unknown network error" };
}

/**
 * JSONレスポンスを安全にパースし、失敗しても例外を投げない。
 *
 * @example
 * ```ts
 * const data = await safeJson<{ ok: boolean }>(new Response('{"ok":true}'));
 * console.log(data?.ok);
 * ```
 */
async function safeJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.clone().json()) as T;
  } catch (error) {
    console.warn("Failed to parse JSON response", error);
    return undefined;
  }
}
