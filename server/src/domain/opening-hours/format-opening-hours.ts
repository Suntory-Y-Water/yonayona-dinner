import { TZDate } from "@date-fns/tz";
import type {
  JstTimeString,
  OpeningHours,
  OpeningHoursDisplay,
} from "yonayona-dinner-shared";

const JAPANESE_WEEKDAYS = [
  "日曜日",
  "月曜日",
  "火曜日",
  "水曜日",
  "木曜日",
  "金曜日",
  "土曜日",
];
const JAPANESE_SHORT_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const ENGLISH_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const ENGLISH_SHORT_WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

/**
 * 営業時間を表示用の文字列に整形する。
 *
 * @example
 * ```ts
 * const display = formatOpeningHours({
 *   openingHours,
 *   targetTime: "2025-10-27T20:00:00",
 * });
 * console.log(display.todayHours); // "18:00～翌2:00"
 * ```
 */
export function formatOpeningHours({
  openingHours,
  targetTime,
}: {
  openingHours: OpeningHours | undefined;
  targetTime: JstTimeString;
}): OpeningHoursDisplay {
  if (!openingHours) {
    return {
      todayHours: "営業時間情報なし",
    };
  }

  const targetDay = getDayOfWeekFromJst({ jstTimeString: targetTime });
  const todaysPeriods = openingHours.periods.filter(
    (period) => period.open.day === targetDay,
  );
  const todayHours =
    todaysPeriods.length > 0
      ? todaysPeriods.map((period) => formatPeriodRange({ period })).join(" / ")
      : (deriveTodayHoursFromDescriptions({
          descriptions: openingHours.weekdayDescriptions,
          dayIndex: targetDay,
        }) ?? "定休日");

  return {
    todayHours,
  };
}

/**
 * 営業区間を「開始～終了」の文字列へ変換する。
 *
 * @example
 * ```ts
 * const text = formatPeriodRange({
 *   period: {
 *     open: { day: 1, hour: 18, minute: 0 },
 *     close: { day: 2, hour: 2, minute: 0 },
 *   },
 * });
 * console.log(text); // "18:00～翌2:00"
 * ```
 */
function formatPeriodRange({
  period,
}: {
  period: OpeningHours["periods"][number];
}): string {
  const openText = formatTime({
    hour: period.open.hour,
    minute: period.open.minute,
  });
  const closeText = formatCloseLabel({
    openDay: period.open.day,
    closeDay: period.close.day,
    hour: period.close.hour,
    minute: period.close.minute,
  });
  return `${openText}～${closeText}`;
}

/**
 * 閉店時刻を曜日情報込みで表現する。
 *
 * @example
 * ```ts
 * const text = formatCloseLabel({
 *   openDay: 5,
 *   closeDay: 6,
 *   hour: 1,
 *   minute: 0,
 * });
 * console.log(text); // "翌1:00"
 * ```
 */
function formatCloseLabel({
  openDay,
  closeDay,
  hour,
  minute,
}: {
  openDay: number;
  closeDay: number;
  hour: number;
  minute: number;
}): string {
  const formattedTime = formatTime({ hour, minute });
  const dayDiff = (closeDay - openDay + 7) % 7;
  if (dayDiff === 0) {
    return formattedTime;
  }
  if (dayDiff === 1) {
    const hourWithoutLeadingZero = hour.toString();
    const minuteText = minute.toString().padStart(2, "0");
    return `翌${hourWithoutLeadingZero}:${minuteText}`;
  }
  return `${JAPANESE_WEEKDAYS[closeDay]} ${formattedTime}`;
}

/**
 * 「HH:MM」形式の文字列を生成する。
 *
 * @example
 * ```ts
 * const text = formatTime({ hour: 9, minute: 5 });
 * console.log(text); // "09:05"
 * ```
 */
function formatTime({
  hour,
  minute,
}: {
  hour: number;
  minute: number;
}): string {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

/**
 * JST時刻文字列から曜日番号を取得する。
 *
 * @example
 * ```ts
 * const day = getDayOfWeekFromJst({ jstTimeString: "2025-10-27T10:00:00" });
 * console.log(day); // 1 (月曜日)
 * ```
 */
function getDayOfWeekFromJst({
  jstTimeString,
}: {
  jstTimeString: JstTimeString;
}): number {
  const match = jstTimeString.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) {
    throw new Error(`JST時刻の形式が不正です: ${jstTimeString}`);
  }
  const [, year, month, day, hour, minute, second] = match;
  const date = new TZDate(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    0,
    "Asia/Tokyo",
  );
  return date.getDay();
}

/**
 * weekdayDescriptionsから本日の表示文字列を抽出する。
 *
 * @example
 * ```ts
 * const text = deriveTodayHoursFromDescriptions({
 *   descriptions: ["月曜日: 18:00～翌2:00"],
 *   dayIndex: 1,
 * });
 * console.log(text); // "18:00～翌2:00"
 * ```
 */
function deriveTodayHoursFromDescriptions({
  descriptions,
  dayIndex,
}: {
  descriptions: string[];
  dayIndex: number;
}): string | undefined {
  const candidates = buildDayPrefixes({ dayIndex });
  for (const prefix of candidates) {
    const target = descriptions.find(
      (description) =>
        description.startsWith(`${prefix}:`) ||
        description.startsWith(`${prefix}：`) ||
        description.startsWith(`${prefix} `),
    );
    if (!target) {
      continue;
    }
    const splitted = target.split(/[:：]/);
    if (splitted.length <= 1) {
      return target.slice(prefix.length).trim() || target;
    }
    const [, ...rest] = splitted;
    const joined = rest.join(":").trim();
    return joined.length > 0 ? joined : target.slice(prefix.length).trim();
  }
  return undefined;
}

/**
 * 曜日判定に利用するプレフィックス候補を生成する。
 *
 * @example
 * ```ts
 * const prefixes = buildDayPrefixes({ dayIndex: 1 });
 * console.log(prefixes.includes("Mon")); // true
 * ```
 */
function buildDayPrefixes({ dayIndex }: { dayIndex: number }): string[] {
  const normalizedIndex = ((dayIndex % 7) + 7) % 7;
  const japaneseFull = JAPANESE_WEEKDAYS[normalizedIndex] ?? "";
  const japaneseShort = JAPANESE_SHORT_WEEKDAYS[normalizedIndex] ?? "";
  const englishFull = ENGLISH_WEEKDAYS[normalizedIndex] ?? "";
  const englishShort = ENGLISH_SHORT_WEEKDAYS[normalizedIndex] ?? "";
  return [
    japaneseFull,
    japaneseShort ? `${japaneseShort}曜` : japaneseFull,
    englishFull,
    englishShort,
  ];
}
