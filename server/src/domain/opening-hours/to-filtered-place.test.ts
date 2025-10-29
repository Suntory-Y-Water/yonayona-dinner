import { describe, expect, test } from "bun:test";
import type { OpeningHours, Place } from "yonayona-dinner-shared";
import { JstTimeStringSchema } from "yonayona-dinner-shared";
import { toFilteredPlace } from "./to-filtered-place";

const descriptions = ["営業時間: サンプル"];

/**
 * テスト用Placeを生成する。
 *
 * @example
 * ```ts
 * const place = buildPlace({ id: "abc" });
 * console.log(place.id); // "abc"
 * ```
 */
function buildPlace(overrides?: Partial<Place>): Place {
  return {
    id: "sample-place",
    displayName: "テスト店舗",
    formattedAddress: "東京都",
    location: { lat: 35.0, lng: 139.0 },
    ...overrides,
  };
}

describe("toFilteredPlaceの挙動", () => {
  test("営業中の店舗には残り時間が設定される", () => {
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
    const place = buildPlace({ currentOpeningHours: openingHours });
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00");

    // When
    const result = toFilteredPlace({ place, targetTime });

    // Then
    expect(result.remainingMinutes).toBe(180);
  });

  test("営業時間外の店舗はremainingMinutesが0になる", () => {
    // Given
    const openingHours: OpeningHours = {
      openNow: false,
      periods: [
        {
          open: { day: 1, hour: 10, minute: 0 },
          close: { day: 1, hour: 12, minute: 0 },
        },
      ],
      weekdayDescriptions: descriptions,
    };
    const place = buildPlace({ currentOpeningHours: openingHours });
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00");

    // When
    const result = toFilteredPlace({ place, targetTime });

    // Then
    expect(result.remainingMinutes).toBe(0);
  });

  test("営業時間情報がない場合もremainingMinutesは0になる", () => {
    // Given
    const place = buildPlace();
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00");

    // When
    const result = toFilteredPlace({ place, targetTime });

    // Then
    expect(result.remainingMinutes).toBe(0);
  });

  test("元のPlaceプロパティは保持される", () => {
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
    const place = buildPlace({
      id: "keep-id",
      displayName: "元の店舗",
      rating: 4.5,
      currentOpeningHours: openingHours,
    });
    const targetTime = JstTimeStringSchema.parse("2025-10-27T20:00:00");

    // When
    const result = toFilteredPlace({ place, targetTime });

    // Then
    expect(result.id).toBe("keep-id");
    expect(result.displayName).toBe("元の店舗");
    expect(result.rating).toBe(4.5);
  });
});
