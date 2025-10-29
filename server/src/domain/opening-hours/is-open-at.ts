import type { JstTimeString, OpeningHours } from "yonayona-dinner-shared";
import {
  isWithinRange,
  MINUTES_PER_WEEK,
  toClosingMinutes,
  toMinutesFromJstString,
  toMinutesFromTimePoint,
} from "./time-utils";

/**
 * 指定した時刻に店舗が営業中かを判定する。
 *
 * @example
 * ```ts
 * const open = isOpenAt({
 *   openingHours: {
 *     openNow: true,
 *     periods: [
 *       {
 *         open: { day: 1, hour: 18, minute: 0 },
 *         close: { day: 1, hour: 23, minute: 0 },
 *       },
 *     ],
 *     weekdayDescriptions: ["月曜日: 18:00-23:00"],
 *   },
 *   targetTime: new Date("2025-10-27T20:00:00.000Z"),
 * });
 * console.log(open); // true
 * ```
 */
export function isOpenAt({
  openingHours,
  targetTime,
}: {
  openingHours: OpeningHours | undefined;
  targetTime: JstTimeString;
}): boolean {
  if (!openingHours) {
    return false;
  }

  const targetMinutes = toMinutesFromJstString({ jstTimeString: targetTime });
  const shiftedTargetMinutes = targetMinutes + MINUTES_PER_WEEK;

  return openingHours.periods.some((period) => {
    const openMinutes = toMinutesFromTimePoint({ timePoint: period.open });
    const closeMinutes = toClosingMinutes({
      openMinutes,
      closeTimePoint: period.close,
    });
    return (
      isWithinRange({
        value: targetMinutes,
        start: openMinutes,
        end: closeMinutes,
      }) ||
      isWithinRange({
        value: shiftedTargetMinutes,
        start: openMinutes,
        end: closeMinutes,
      })
    );
  });
}
