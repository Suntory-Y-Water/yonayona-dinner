import type {
  DisplayPlace,
  JstTimeString,
  Place,
} from "yonayona-dinner-shared";
import { calculateRemainingMinutes } from "./calculate-remaining-minutes";
import { formatBusinessStatus } from "./format-business-status";
import { formatOpeningHours } from "./format-opening-hours";
import { isOpenAt } from "./is-open-at";

/**
 * PlaceをDisplayPlaceへ変換して表示専用データを生成する。
 *
 * @example
 * ```ts
 * const display = toDisplayPlace({ place, targetTime: "2025-10-27T20:00:00" });
 * console.log(display.businessStatus.statusText); // "営業中（あと2時間）"
 * ```
 */
export function toDisplayPlace({
  place,
  targetTime,
}: {
  place: Place;
  targetTime: JstTimeString;
}): DisplayPlace {
  const openingHoursDisplay = formatOpeningHours({
    openingHours: place.currentOpeningHours,
    targetTime,
  });
  const isOpenNow = isOpenAt({
    openingHours: place.currentOpeningHours,
    targetTime,
  });
  const safeRemainingMinutes =
    place.currentOpeningHours && isOpenNow
      ? (calculateRemainingMinutes({
          openingHours: place.currentOpeningHours,
          currentTime: targetTime,
        }) ?? 0)
      : 0;

  const businessStatus = {
    isOpenNow,
    remainingMinutes: safeRemainingMinutes,
    statusText: formatBusinessStatus({
      isOpenNow,
      remainingMinutes: safeRemainingMinutes,
    }),
  };

  return {
    id: place.id,
    displayName: place.displayName,
    formattedAddress: sanitizeFormattedAddress({
      formattedAddress: place.formattedAddress,
    }),
    location: place.location,
    rating: place.rating,
    currentOpeningHours: place.currentOpeningHours,
    businessStatus,
    openingHoursDisplay,
  };
}

/**
 * 日本語住所の先頭に付与される「日本、」などの冗長表現を除去する。
 */
function sanitizeFormattedAddress({
  formattedAddress,
}: {
  formattedAddress: string;
}): string {
  const trimmed = formattedAddress.trim();
  const normalized = trimmed.replace(/^日本[\s　]*(?:、|,)\s*/u, "");
  return normalized.length > 0 ? normalized : trimmed;
}
