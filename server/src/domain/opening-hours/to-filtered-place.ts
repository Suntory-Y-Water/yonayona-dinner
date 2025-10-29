import type {
  FilteredPlace,
  JstTimeString,
  Place,
} from "yonayona-dinner-shared";
import { calculateRemainingMinutes } from "./calculate-remaining-minutes";

/**
 * PlaceをFilteredPlaceへ変換する。
 *
 * @example
 * ```ts
 * const filtered = toFilteredPlace({
 *   place,
 *   targetTime: new Date("2025-10-27T20:00:00.000Z"),
 * });
 * console.log(filtered.remainingMinutes); // 例: 120
 * ```
 */
export function toFilteredPlace({
  place,
  targetTime,
}: {
  place: Place;
  targetTime: JstTimeString;
}): FilteredPlace {
  const remainingMinutes = place.currentOpeningHours
    ? calculateRemainingMinutes({
        openingHours: place.currentOpeningHours,
        currentTime: targetTime,
      })
    : null;
  return {
    ...place,
    remainingMinutes: remainingMinutes ?? 0,
  };
}
