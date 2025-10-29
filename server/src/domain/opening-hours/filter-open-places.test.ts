import { describe, expect, test } from "bun:test";
import type { OpeningHours, Place } from "yonayona-dinner-shared";
import { JstTimeStringSchema } from "yonayona-dinner-shared";
import { filterOpenPlaces } from "./filter-open-places";

const descriptions = ["営業時間: サンプル"];

/**
 * テスト用にPlaceオブジェクトを生成するユーティリティ。
 *
 * @example
 * ```ts
 * const place = buildPlace({ id: "1" });
 * console.log(place.id); // "1"
 * ```
 */
function buildPlace({
  id,
  openingHours,
}: {
  id: string;
  openingHours?: OpeningHours;
}): Place {
  return {
    id,
    displayName: `店舗${id}`,
    formattedAddress: "東京都",
    location: { lat: 35.0, lng: 139.0 },
    currentOpeningHours: openingHours,
  };
}

describe("filterOpenPlacesの挙動", () => {
  test("空配列なら空配列を返す", () => {
    // Given
    const places: Place[] = [];
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00");

    // When
    const result = filterOpenPlaces({ places, targetTime });

    // Then
    expect(result).toEqual([]);
  });

  test("すべて営業中ならそのまま返す", () => {
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
    const places = [
      buildPlace({ id: "1", openingHours }),
      buildPlace({ id: "2", openingHours }),
    ];
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00");

    // When
    const result = filterOpenPlaces({ places, targetTime });

    // Then
    expect(result).toHaveLength(2);
    expect(result.map((place) => place.id)).toEqual(["1", "2"]);
  });

  test("すべて閉店中なら空配列を返す", () => {
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
    const places = [
      buildPlace({ id: "1", openingHours }),
      buildPlace({ id: "2", openingHours }),
    ];
    const targetTime = JstTimeStringSchema.parse("2025-10-27T10:00:00");

    // When
    const result = filterOpenPlaces({ places, targetTime });

    // Then
    expect(result).toEqual([]);
  });

  test("一部営業中なら営業中のみ返す", () => {
    // Given
    const openHours: OpeningHours = {
      openNow: true,
      periods: [
        {
          open: { day: 1, hour: 18, minute: 0 },
          close: { day: 1, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const closedHours: OpeningHours = {
      openNow: false,
      periods: [
        {
          open: { day: 1, hour: 10, minute: 0 },
          close: { day: 1, hour: 12, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const places = [
      buildPlace({ id: "1", openingHours: openHours }),
      buildPlace({ id: "2", openingHours: closedHours }),
      buildPlace({ id: "3", openingHours: openHours }),
    ];
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00");

    // When
    const result = filterOpenPlaces({ places, targetTime });

    // Then
    expect(result.map((place) => place.id)).toEqual(["1", "3"]);
  });

  test("営業時間情報なしの店舗は除外される", () => {
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
    const places = [
      buildPlace({ id: "1", openingHours }),
      buildPlace({ id: "2" }),
    ];
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00");

    // When
    const result = filterOpenPlaces({ places, targetTime });

    // Then
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("1");
  });

  test("元の配列は変更されない", () => {
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
    const places = [buildPlace({ id: "1", openingHours })];
    const snapshot = [...places];
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00");

    // When
    filterOpenPlaces({ places, targetTime });

    // Then
    expect(places).toEqual(snapshot);
  });
});
