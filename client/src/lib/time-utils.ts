import { formatInTimeZone } from "date-fns-tz";
import {
  type JstTimeString,
  JstTimeStringSchema,
} from "yonayona-dinner-shared";

const timeZone = "Asia/Tokyo";

/**
 * 指定した日付と時刻文字列からJST時刻文字列を生成する。
 *
 * @param params 時刻計算に利用する日付と時刻
 * @returns JST（yyyy-MM-ddTHH:mm:ss形式）の時刻文字列
 *
 * @example
 * ```ts
 * const jst = formatToJstTimeString({
 *   date: new Date("2025-10-30T00:00:00Z"),
 *   time: "23:00",
 * });
 * console.log(jst); // "2025-10-30T23:00:00"
 * ```
 */
export function formatToJstTimeString({
  date,
  time,
}: {
  date: Date;
  time: string;
}): JstTimeString {
  const [hourString, minuteString] = time.split(":");
  const hours = Number.parseInt(hourString ?? "", 10);
  const minutes = Number.parseInt(minuteString ?? "", 10);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new Error(
      "時刻文字列が不正です。HH:mm形式の文字列を指定してください。",
    );
  }

  if (minutes < 0 || minutes >= 60) {
    throw new Error("分の値は0以上60未満で指定してください。");
  }

  const baseDateText = formatInTimeZone(date, timeZone, "yyyy-MM-dd");

  const baseDate = new Date(`${baseDateText}T00:00:00+09:00`);
  if (Number.isNaN(baseDate.getTime())) {
    throw new Error("日付の解析に失敗しました。");
  }

  const additionalDays = Math.floor(hours / 24);
  const normalizedHours = hours % 24;

  if (additionalDays > 0) {
    baseDate.setUTCDate(baseDate.getUTCDate() + additionalDays);
  }

  const formattedDate = formatInTimeZone(baseDate, timeZone, "yyyy-MM-dd");
  const hourText = String(normalizedHours).padStart(2, "0");
  const minuteText = String(minutes).padStart(2, "0");

  const formatted = `${formattedDate}T${hourText}:${minuteText}:00`;

  return JstTimeStringSchema.parse(formatted);
}
