import type { LatLng } from "yonayona-dinner-shared";

const baseUrl = "https://www.google.com/maps/search/?api=1&query=";

/**
 * 指定した座標をGoogleマップで開く。
 *
 * @param location Googleマップで開く緯度・経度
 *
 * @example
 * ```ts
 * openGoogleMaps({ lat: 35.6812, lng: 139.7671 });
 * // => ブラウザで https://www.google.com/maps/search/?api=1&query=35.6812,139.7671 を新しいタブで開く
 * ```
 */
export function openGoogleMaps({ lat, lng }: LatLng): void {
  const url = `${baseUrl}${lat},${lng}`;
  window.open(url, "_blank");
}
