import { describe, expect, test } from "bun:test";
import { JstTimeStringSchema, type OpeningHours } from "yonayona-dinner-shared";
import { isOpenAt } from "./is-open-at";

describe("isOpenAtの挙動", () => {
  const descriptions = ["営業時間: サンプル"];

  test("営業時間情報がないときはfalseを返す", () => {
    // Given
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00"); // JST 20:00

    // When
    const result = isOpenAt({ openingHours: undefined, targetTime });

    // Then
    expect(result).toBe(false);
  });

  test("通常営業時間内であればtrueを返す", () => {
    // Given
    const openingHours: OpeningHours = {
      openNow: true,
      periods: [
        {
          open: { day: 1, hour: 18, minute: 0 },
          close: { day: 1, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00"); // JST 20:00 (月曜20時、18-23時の営業時間内)

    // When
    const result = isOpenAt({ openingHours, targetTime });

    // Then
    expect(result).toBe(true);
  });

  test("営業時間外であればfalseを返す", () => {
    // Given
    const openingHours: OpeningHours = {
      openNow: false,
      periods: [
        {
          open: { day: 1, hour: 18, minute: 0 },
          close: { day: 1, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const targetTime = JstTimeStringSchema.parse("2025-10-27T15:00:00"); // JST 15:00 (月曜15時、18-23時の営業時間外)

    // When
    const result = isOpenAt({ openingHours, targetTime });

    // Then
    expect(result).toBe(false);
  });

  test("24時跨ぎ営業時間内ならtrueを返す", () => {
    // Given
    const openingHours: OpeningHours = {
      openNow: true,
      periods: [
        {
          open: { day: 1, hour: 23, minute: 30 },
          close: { day: 2, hour: 5, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const targetTime = JstTimeStringSchema.parse("2025-10-28T01:00:00"); // JST 01:00 (火曜、月曜23:30-火曜5:00の営業時間内)

    // When
    const result = isOpenAt({ openingHours, targetTime });

    // Then
    expect(result).toBe(true);
  });

  test("24時跨ぎ営業時間外ならfalseを返す", () => {
    // Given
    const openingHours: OpeningHours = {
      openNow: false,
      periods: [
        {
          open: { day: 1, hour: 23, minute: 30 },
          close: { day: 2, hour: 5, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const targetTime = JstTimeStringSchema.parse("2025-10-28T10:00:00"); // JST 10:00 (火曜、23:30-5:00の営業時間外)

    // When
    const result = isOpenAt({ openingHours, targetTime });

    // Then
    expect(result).toBe(false);
  });

  test("複数スロットの営業時間内ならtrueを返す", () => {
    // Given
    const openingHours: OpeningHours = {
      openNow: true,
      periods: [
        {
          open: { day: 2, hour: 11, minute: 0 },
          close: { day: 2, hour: 14, minute: 0 },
        },
        {
          open: { day: 2, hour: 17, minute: 0 },
          close: { day: 2, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const targetTime = JstTimeStringSchema.parse("2025-10-28T12:00:00"); // JST 12:00 (火曜、11-14時の営業時間内)

    // When
    const result = isOpenAt({ openingHours, targetTime });

    // Then
    expect(result).toBe(true);
  });

  test("複数スロットの休憩時間はfalseを返す", () => {
    // Given
    const openingHours: OpeningHours = {
      openNow: false,
      periods: [
        {
          open: { day: 2, hour: 11, minute: 0 },
          close: { day: 2, hour: 14, minute: 0 },
        },
        {
          open: { day: 2, hour: 17, minute: 0 },
          close: { day: 2, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const targetTime = JstTimeStringSchema.parse("2025-10-28T15:00:00"); // JST 15:00 (火曜、14-17時の休憩時間)

    // When
    const result = isOpenAt({ openingHours, targetTime });

    // Then
    expect(result).toBe(false);
  });

  test("閉店時刻ちょうどならfalseを返す", () => {
    // Given
    const openingHours: OpeningHours = {
      openNow: true,
      periods: [
        {
          open: { day: 5, hour: 18, minute: 0 },
          close: { day: 5, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const targetTime = JstTimeStringSchema.parse("2025-10-31T23:00:00"); // JST 23:00 (金曜、18-23時の閉店時刻ちょうど)

    // When
    const result = isOpenAt({ openingHours, targetTime });

    // Then
    expect(result).toBe(false);
  });

  test("開店時刻ちょうどならtrueを返す", () => {
    // Given
    const openingHours: OpeningHours = {
      openNow: true,
      periods: [
        {
          open: { day: 5, hour: 18, minute: 0 },
          close: { day: 5, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const targetTime = JstTimeStringSchema.parse("2025-10-31T18:00:00"); // JST 18:00 (金曜、18-23時の開店時刻ちょうど)

    // When
    const result = isOpenAt({ openingHours, targetTime });

    // Then
    expect(result).toBe(true);
  });
});
