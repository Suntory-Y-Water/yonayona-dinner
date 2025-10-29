import type { JstTimeString, Place } from "yonayona-dinner-shared";
import { isOpenAt } from "./is-open-at";

/**
 * 指定時刻に営業中の店舗のみを抽出する。
 *
 * @example
 * ```ts
 * const openPlaces = filterOpenPlaces({
 *   places,
 *   targetTime: new Date("2025-10-27T23:00:00.000Z"),
 * });
 * console.log(openPlaces.length); // 営業中店舗数
 * ```
 */
export function filterOpenPlaces({
  places,
  targetTime,
}: {
  places: Place[];
  targetTime: JstTimeString;
}): Place[] {
  if (places.length === 0) {
    return [];
  }
  return places.filter((place) => {
    if (!place.currentOpeningHours) {
      return false;
    }
    return isOpenAt({
      openingHours: place.currentOpeningHours,
      targetTime,
    });
  });
}
