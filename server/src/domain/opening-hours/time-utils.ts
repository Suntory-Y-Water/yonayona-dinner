import { TZDate } from "@date-fns/tz";
import { getDay, getHours, getMinutes } from "date-fns";
import type { JstTimeString, TimePoint } from "yonayona-dinner-shared";

/** 1日の分数 */
export const MINUTES_PER_DAY = 24 * 60;
/** 1週間の分数 */
export const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7;

/**
 * JST時刻文字列を週の経過分数に変換する。
 *
 * Brand型により、フォーマット保証された文字列のみを受け入れる。
 *
 * @param jstTimeString - JST基準のISO 8601文字列（Brand型）
 * @returns 週の始まり（日曜0:00 JST）からの経過分数
 *
 * @example
 * ```ts
 * // Brand型の文字列を渡す
 * const time: JstTimeString = JstTimeStringSchema.parse("2025-10-27T20:00:00");
 * const minutes = toMinutesFromJstString({ jstTimeString: time });
 * // → 1(月曜) * 1440 + 20 * 60 + 0 = 2640分
 * ```
 */
export function toMinutesFromJstString({
  jstTimeString,
}: {
  jstTimeString: JstTimeString;
}): number {
  // JST時刻文字列をパース (yyyy-MM-ddTHH:mm:ss形式)
  const match = jstTimeString.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) {
    throw new Error(`Invalid JST time string format: ${jstTimeString}`);
  }

  const [, year, month, day, hour, minute, second] = match;

  // TZDateコンストラクタに数値で渡す（月は0始まりなので-1）
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

  // JST基準での曜日・時・分を取得
  const dayOfWeek = getDay(jstDate); // 0=日曜, 1=月曜, ..., 6=土曜
  const hourOfDay = getHours(jstDate);
  const minuteOfHour = getMinutes(jstDate);

  return dayOfWeek * MINUTES_PER_DAY + hourOfDay * 60 + minuteOfHour;
}

/**
 * TimePointを週の経過分数に変換する。
 *
 * @example
 * ```ts
 * const minutes = toMinutesFromTimePoint({
 *   timePoint: { day: 2, hour: 11, minute: 0 },
 * });
 * console.log(minutes); // 3540
 * ```
 */
export function toMinutesFromTimePoint({
  timePoint,
}: {
  timePoint: TimePoint;
}): number {
  return (
    timePoint.day * MINUTES_PER_DAY + timePoint.hour * 60 + timePoint.minute
  );
}

/**
 * 閉店時刻を週の経過分数として補正する。
 *
 * @example
 * ```ts
 * const adjusted = toClosingMinutes({
 *   openMinutes: 9960,
 *   closeTimePoint: { day: 0, hour: 5, minute: 0 },
 * });
 * console.log(adjusted > 9960); // true
 * ```
 */
export function toClosingMinutes({
  openMinutes,
  closeTimePoint,
}: {
  openMinutes: number;
  closeTimePoint: TimePoint;
}): number {
  const closeMinutes = toMinutesFromTimePoint({ timePoint: closeTimePoint });
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
 * const included = isWithinRange({ value: 150, start: 100, end: 200 });
 * console.log(included); // true
 * ```
 */
export function isWithinRange({
  value,
  start,
  end,
}: {
  value: number;
  start: number;
  end: number;
}): boolean {
  return value >= start && value < end;
}
