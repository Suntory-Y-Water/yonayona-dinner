import { hcWithType } from "yonayona-dinner-server/dist/client";
import {
  type DisplayPlacesResponse,
  DisplayPlacesResponseSchema,
  type PlacesAPIError,
  type Result,
  type SearchNearbyRequest,
} from "yonayona-dinner-shared";

// APIのベースURLは設定値を優先し、それ以外は同一オリジンでの呼び出しを許容する。
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseUrl =
  configuredBaseUrl && configuredBaseUrl.length > 0
    ? configuredBaseUrl
    : typeof window !== "undefined" && window.location
      ? window.location.origin
      : "";

const client = hcWithType(baseUrl);

/**
 * 周辺店舗検索を実行する。
 *
 * @param request 検索に必要な条件
 * @returns APIレスポンスまたはエラーをResult型で返す
 *
 * @example
 * ```ts
 * const result = await searchNearby({
 *   location: { lat: 35.6812, lng: 139.7671 },
 *   radius: 800,
 *   targetTime: "2025-10-30T23:00:00",
 * });
 * if (result.success) {
 *   console.log(result.data.places[0]?.displayName); // 店舗名が取得できる
 * }
 * ```
 */
export async function searchNearby(
  request: SearchNearbyRequest,
): Promise<Result<DisplayPlacesResponse, PlacesAPIError>> {
  try {
    const response = await client.api.places.search.$post({
      json: request,
    });

    if (!response.ok) {
      const mappedType = mapStatusToErrorType(response.status);
      return {
        success: false,
        error: {
          type: mappedType,
          message: `Places APIの呼び出しに失敗しました（HTTP ${response.status}）`,
        },
      };
    }

    const json = await response.json();
    const parseResult = DisplayPlacesResponseSchema.safeParse(json);

    if (!parseResult.success) {
      return {
        success: false,
        error: {
          type: "INVALID_REQUEST",
          message: "Places APIから不正なレスポンスが返されました。",
        },
      };
    }

    return {
      success: true,
      data: parseResult.data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "NETWORK_ERROR",
        message:
          error instanceof Error
            ? `ネットワークエラーが発生しました: ${error.message}`
            : "予期しないネットワークエラーが発生しました。",
      },
    };
  }
}

/**
 * HTTPステータスコードからPlacesAPIErrorの種別を導出する。
 *
 * @param status HTTPステータスコード
 * @returns PlacesAPIErrorの種別
 *
 * @example
 * ```ts
 * const errorType = mapStatusToErrorType(429);
 * console.log(errorType); // "RATE_LIMIT"
 * ```
 */
function mapStatusToErrorType(status: number): PlacesAPIError["type"] {
  if (status === 400) {
    return "INVALID_REQUEST";
  }
  if (status === 401) {
    return "AUTH_ERROR";
  }
  if (status === 429) {
    return "RATE_LIMIT";
  }
  if (status === 503) {
    return "SERVICE_UNAVAILABLE";
  }
  return "NETWORK_ERROR";
}
