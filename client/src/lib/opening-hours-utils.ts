import { getDay, getHours, getMinutes } from "date-fns";
import { TZDate } from "date-fns-tz";
import type { DisplayPlace, JstTimeString, OpeningHours, TimePoint } from "shared";

/** 1日の分数 */
const MINUTES_PER_DAY = 24 * 60;
/** 1週間の分数 */
const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7;

/**
 * JST時刻文字列を週の経過分数に変換する。
 *
 * @param jstTimeString - JST基準のISO 8601文字列
 * @returns 週の始まり（日曜0:00 JST）からの経過分数
 *
 * @example
 * ```ts
 * const minutes = toMinutesFromJstString("2025-10-27T20:00:00");
 * // → 1(月曜) * 1440 + 20 * 60 + 0 = 2640分
 * ```
 */
function toMinutesFromJstString(jstTimeString: JstTimeString): number {
  const match = jstTimeString.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) {
    throw new Error(`Invalid JST time string format: ${jstTimeString}`);
  }

  const [, year, month, day, hour, minute, second] = match;

  const jstDate = new TZDate(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    0,
    "Asia/Tokyo",
  );

  const dayOfWeek = getDay(jstDate);
  const hourOfDay = getHours(jstDate);
  const minuteOfHour = getMinutes(jstDate);

  return dayOfWeek * MINUTES_PER_DAY + hourOfDay * 60 + minuteOfHour;
}

/**
 * TimePointを週の経過分数に変換する。
 *
 * @example
 * ```ts
 * const minutes = toMinutesFromTimePoint({ day: 2, hour: 11, minute: 0 });
 * console.log(minutes); // 3540
 * ```
 */
function toMinutesFromTimePoint(timePoint: TimePoint): number {
  return timePoint.day * MINUTES_PER_DAY + timePoint.hour * 60 + timePoint.minute;
}

/**
 * 閉店時刻を週の経過分数として補正する。
 *
 * @example
 * ```ts
 * const adjusted = toClosingMinutes(9960, { day: 0, hour: 5, minute: 0 });
 * console.log(adjusted > 9960); // true
 * ```
 */
function toClosingMinutes(openMinutes: number, closeTimePoint: TimePoint): number {
  const closeMinutes = toMinutesFromTimePoint(closeTimePoint);
  if (closeMinutes <= openMinutes) {
    return closeMinutes + MINUTES_PER_WEEK;
  }
  return closeMinutes;
}

/**
 * 開始以上・終了未満の半開区間に値が含まれるかを判定する。
 *
 * @example
 * ```ts
 * const included = isWithinRange(150, 100, 200);
 * console.log(included); // true
 * ```
 */
function isWithinRange(value: number, start: number, end: number): boolean {
  return value >= start && value < end;
}

/**
 * 指定した時刻に店舗が営業中かを判定する。
 *
 * @param openingHours - 営業時間情報
 * @param targetTime - 判定対象のJST時刻
 * @returns 営業中の場合true
 *
 * @example
 * ```ts
 * const open = isOpenAt(
 *   {
 *     openNow: true,
 *     periods: [
 *       { open: { day: 1, hour: 18, minute: 0 }, close: { day: 1, hour: 23, minute: 0 } },
 *     ],
 *     weekdayDescriptions: ["月曜日: 18:00-23:00"],
 *   },
 *   "2025-10-27T20:00:00"
 * );
 * console.log(open); // true
 * ```
 */
export function isOpenAt(
  openingHours: OpeningHours | undefined,
  targetTime: JstTimeString,
): boolean {
  if (!openingHours) {
    return false;
  }

  const targetMinutes = toMinutesFromJstString(targetTime);
  const shiftedTargetMinutes = targetMinutes + MINUTES_PER_WEEK;

  return openingHours.periods.some((period) => {
    const openMinutes = toMinutesFromTimePoint(period.open);
    const closeMinutes = toClosingMinutes(openMinutes, period.close);
    return (
      isWithinRange(targetMinutes, openMinutes, closeMinutes) ||
      isWithinRange(shiftedTargetMinutes, openMinutes, closeMinutes)
    );
  });
}

/**
 * 指定した時刻に営業中の店舗のみをフィルタリングする。
 *
 * @param places - 全店舗リスト
 * @param targetTime - 判定対象のJST時刻
 * @returns 営業中の店舗のみの配列
 *
 * @example
 * ```ts
 * const openPlaces = filterOpenPlaces(allPlaces, "2025-10-27T23:00:00");
 * console.log(openPlaces.length); // 営業中の店舗数
 * ```
 */
export function filterOpenPlaces(
  places: DisplayPlace[],
  targetTime: JstTimeString,
): DisplayPlace[] {
  return places.filter((place) =>
    isOpenAt(place.currentOpeningHours, targetTime),
  );
}
