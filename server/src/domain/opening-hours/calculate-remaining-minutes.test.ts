import { describe, expect, test } from "bun:test";
import type { OpeningHours } from "yonayona-dinner-shared";
import { JstTimeStringSchema } from "yonayona-dinner-shared";
import { calculateRemainingMinutes } from "./calculate-remaining-minutes";

const descriptions = ["営業時間: サンプル"];

/**
 * テスト用のOpeningHoursを組み立てる。
 *
 * @example
 * ```ts
 * const hours = buildOpeningHours({
 *   openDay: 1,
 *   openHour: 18,
 *   openMinute: 0,
 *   closeDay: 1,
 *   closeHour: 23,
 *   closeMinute: 0,
 * });
 * console.log(hours.periods.length); // 1
 * ```
 */
function buildOpeningHours({
  openDay,
  openHour,
  openMinute,
  closeDay,
  closeHour,
  closeMinute,
}: {
  openDay: number;
  openHour: number;
  openMinute: number;
  closeDay: number;
  closeHour: number;
  closeMinute: number;
}): OpeningHours {
  return {
    openNow: true,
    periods: [
      {
        open: { day: openDay, hour: openHour, minute: openMinute },
        close: { day: closeDay, hour: closeHour, minute: closeMinute },
      },
    ],
    weekdayDescriptions: descriptions,
  };
}

describe("calculateRemainingMinutesの挙動", () => {
  test("営業中なら残り時間を返す（180分）", () => {
    // Given
    const openingHours = buildOpeningHours({
      openDay: 1,
      openHour: 18,
      openMinute: 0,
      closeDay: 1,
      closeHour: 23,
      closeMinute: 0,
    });
    const currentTime = JstTimeStringSchema.parse("2025-10-27T20:00:00");

    // When
    const result = calculateRemainingMinutes({ openingHours, currentTime });

    // Then
    expect(result).toBe(180);
  });

  test("閉店30分前なら30を返す", () => {
    // Given
    const openingHours = buildOpeningHours({
      openDay: 1,
      openHour: 18,
      openMinute: 0,
      closeDay: 1,
      closeHour: 23,
      closeMinute: 0,
    });
    const currentTime = JstTimeStringSchema.parse("2025-10-27T22:30:00");

    // When
    const result = calculateRemainingMinutes({ openingHours, currentTime });

    // Then
    expect(result).toBe(30);
  });

  test("営業時間外ならnullを返す", () => {
    // Given
    const openingHours = buildOpeningHours({
      openDay: 1,
      openHour: 18,
      openMinute: 0,
      closeDay: 1,
      closeHour: 23,
      closeMinute: 0,
    });
    const currentTime = JstTimeStringSchema.parse("2025-10-27T15:00:00");

    // When
    const result = calculateRemainingMinutes({ openingHours, currentTime });

    // Then
    expect(result).toBeNull();
  });

  test("24時跨ぎ営業中であれば残り時間を返す", () => {
    // Given
    const openingHours = buildOpeningHours({
      openDay: 1,
      openHour: 23,
      openMinute: 30,
      closeDay: 2,
      closeHour: 5,
      closeMinute: 0,
    });
    const currentTime = JstTimeStringSchema.parse("2025-10-28T01:00:00");

    // When
    const result = calculateRemainingMinutes({ openingHours, currentTime });

    // Then
    expect(result).toBe(240);
  });

  test("閉店1分前なら1を返す", () => {
    // Given
    const openingHours = buildOpeningHours({
      openDay: 5,
      openHour: 18,
      openMinute: 0,
      closeDay: 5,
      closeHour: 23,
      closeMinute: 0,
    });
    const currentTime = JstTimeStringSchema.parse("2025-10-31T22:59:00");

    // When
    const result = calculateRemainingMinutes({ openingHours, currentTime });

    // Then
    expect(result).toBe(1);
  });

  test("閉店時刻ちょうどならnullを返す", () => {
    // Given
    const openingHours = buildOpeningHours({
      openDay: 5,
      openHour: 18,
      openMinute: 0,
      closeDay: 5,
      closeHour: 23,
      closeMinute: 0,
    });
    const currentTime = JstTimeStringSchema.parse("2025-10-31T23:00:00");

    // When
    const result = calculateRemainingMinutes({ openingHours, currentTime });

    // Then
    expect(result).toBeNull();
  });
});
