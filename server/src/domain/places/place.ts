import type { Place, PlacesAPIError } from "yonayona-dinner-shared";

/**
 * Placeドメイン型（shared型の再エクスポート）
 *
 * @example
 * ```ts
 * const place: Place = {
 *   id: "ChIJ...",
 *   displayName: "居酒屋 example",
 *   location: { lat: 35.681, lng: 139.767 },
 *   formattedAddress: "東京都...",
 * };
 * ```
 */
export type { Place };

/**
 * Places APIエラー型（shared型の再エクスポート）
 *
 * @example
 * ```ts
 * const error: PlacesAPIError = {
 *   type: "RATE_LIMIT",
 *   message: "レート制限超過",
 * };
 * ```
 */
export type { PlacesAPIError };

/**
 * Placeが有効かを検証する。
 *
 * @example
 * ```ts
 * const valid = isValidPlace({ id: "abc", displayName: "Cafe", ... });
 * console.log(valid); // true
 * ```
 */
export function isValidPlace({ place }: { place: Place }): boolean {
  return place.id !== "" && place.displayName !== "";
}
