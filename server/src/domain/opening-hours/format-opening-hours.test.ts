import { describe, expect, test } from "bun:test";
import { JstTimeStringSchema, type OpeningHours } from "yonayona-dinner-shared";
import { formatOpeningHours } from "./format-opening-hours";

const baseDescriptions = [
  "日曜日: 休業",
  "月曜日: 18:00～翌2:00",
  "火曜日: 18:00～23:00",
  "水曜日: 18:00～23:00",
  "木曜日: 18:00～23:00",
  "金曜日: 18:00～翌3:00",
  "土曜日: 18:00～翌3:00",
];

/**
 * テスト用のOpeningHoursを生成する。
 *
 * @example
 * ```ts
 * const hours = buildOpeningHours();
 * console.log(hours.weekdayDescriptions.length); // 7
 * ```
 */
function buildOpeningHours(overrides?: Partial<OpeningHours>): OpeningHours {
  return {
    openNow: true,
    periods: [
      {
        open: { day: 1, hour: 18, minute: 0 },
        close: { day: 2, hour: 2, minute: 0 },
      },
    ],
    weekdayDescriptions: baseDescriptions,
    ...overrides,
  };
}

describe("formatOpeningHoursの挙動", () => {
  test("営業時間情報が無い場合は定型文で応答する", () => {
    // Given
    const targetTime = JstTimeStringSchema.parse("2025-10-27T10:00:00");

    // When
    const result = formatOpeningHours({
      openingHours: undefined,
      targetTime,
    });

    // Then
    expect(result.todayHours).toBe("営業時間情報なし");
  });

  test("同一日の営業時間はHH:MM～HH:MM形式で表示する", () => {
    // Given
    const openingHours = buildOpeningHours({
      periods: [
        {
          open: { day: 1, hour: 10, minute: 30 },
          close: { day: 1, hour: 19, minute: 30 },
        },
      ],
    });
    const targetTime = JstTimeStringSchema.parse("2025-10-27T12:00:00");

    // When
    const result = formatOpeningHours({
      openingHours,
      targetTime,
    });

    // Then
    expect(result.todayHours).toBe("10:30～19:30");
  });

  test("日付跨ぎの営業時間は翌を付けて表示する", () => {
    // Given
    const openingHours = buildOpeningHours();
    const targetTime = JstTimeStringSchema.parse("2025-10-27T21:00:00");

    // When
    const result = formatOpeningHours({
      openingHours,
      targetTime,
    });

    // Then
    expect(result.todayHours).toBe("18:00～翌2:00");
  });

  test("複数スロットがある場合はスラッシュ区切りで全て表示する", () => {
    // Given
    const openingHours = buildOpeningHours({
      periods: [
        {
          open: { day: 1, hour: 11, minute: 0 },
          close: { day: 1, hour: 14, minute: 0 },
        },
        {
          open: { day: 1, hour: 17, minute: 0 },
          close: { day: 1, hour: 22, minute: 0 },
        },
      ],
    });
    const targetTime = JstTimeStringSchema.parse("2025-10-27T09:00:00");

    // When
    const result = formatOpeningHours({
      openingHours,
      targetTime,
    });

    // Then
    expect(result.todayHours).toBe("11:00～14:00 / 17:00～22:00");
  });

  test("当日のperiodが無い場合はweekdayDescriptionsから抽出する", () => {
    // Given
    const openingHours = buildOpeningHours({
      periods: [],
    });
    const targetTime = JstTimeStringSchema.parse("2025-10-27T09:00:00");

    // When
    const result = formatOpeningHours({
      openingHours,
      targetTime,
    });

    // Then
    expect(result.todayHours).toBe("18:00～翌2:00");
  });

  test("2日以上跨ぐ場合は曜日を明示して閉店時間を表示する", () => {
    // Given
    const openingHours = buildOpeningHours({
      periods: [
        {
          open: { day: 5, hour: 22, minute: 0 },
          close: { day: 0, hour: 2, minute: 0 },
        },
      ],
    });
    const targetTime = JstTimeStringSchema.parse("2025-10-31T22:30:00");

    // When
    const result = formatOpeningHours({
      openingHours,
      targetTime,
    });

    // Then
    expect(result.todayHours).toBe("22:00～日曜日 02:00");
  });
});
