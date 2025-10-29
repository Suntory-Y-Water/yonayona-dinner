import type { JstTimeString, OpeningHours } from "yonayona-dinner-shared";
import {
  isWithinRange,
  MINUTES_PER_WEEK,
  toClosingMinutes,
  toMinutesFromJstString,
  toMinutesFromTimePoint,
} from "./time-utils";

/**
 * 営業中であれば閉店までの残り分数を返す。
 *
 * @example
 * ```ts
 * const minutes = calculateRemainingMinutes({
 *   openingHours,
 *   currentTime: new Date("2025-10-27T20:00:00.000Z"),
 * });
 * console.log(minutes); // 例: 180
 * ```
 */
export function calculateRemainingMinutes({
  openingHours,
  currentTime,
}: {
  openingHours: OpeningHours;
  currentTime: JstTimeString;
}): number | null {
  if (openingHours.periods.length === 0) {
    return null;
  }

  const currentMinutes = toMinutesFromJstString({ jstTimeString: currentTime });
  const shiftedMinutes = currentMinutes + MINUTES_PER_WEEK;

  for (const period of openingHours.periods) {
    const openMinutes = toMinutesFromTimePoint({ timePoint: period.open });
    const closeMinutes = toClosingMinutes({
      openMinutes,
      closeTimePoint: period.close,
    });

    const remaining =
      pickRemainingMinutes({
        candidateMinutes: currentMinutes,
        openMinutes,
        closeMinutes,
      }) ??
      pickRemainingMinutes({
        candidateMinutes: shiftedMinutes,
        openMinutes,
        closeMinutes,
      });

    if (typeof remaining === "number") {
      return remaining;
    }
  }

  return null;
}

/**
 * 指定した候補分数が営業時間内なら残り分数を算出する。
 *
 * @example
 * ```ts
 * const remaining = pickRemainingMinutes({
 *   candidateMinutes: 2700,
 *   openMinutes: 2520,
 *   closeMinutes: 2820,
 * });
 * console.log(remaining); // 120
 * ```
 */
function pickRemainingMinutes({
  candidateMinutes,
  openMinutes,
  closeMinutes,
}: {
  candidateMinutes: number;
  openMinutes: number;
  closeMinutes: number;
}): number | null {
  if (
    !isWithinRange({
      value: candidateMinutes,
      start: openMinutes,
      end: closeMinutes,
    })
  ) {
    return null;
  }
  return Math.floor(closeMinutes - candidateMinutes);
}
