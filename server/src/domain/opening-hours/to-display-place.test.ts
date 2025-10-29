import { describe, expect, test } from "bun:test";
import {
  JstTimeStringSchema,
  type OpeningHours,
  type Place,
} from "yonayona-dinner-shared";
import { toDisplayPlace } from "./to-display-place";

const descriptions = [
  "日曜日: 休業",
  "月曜日: 18:00～翌2:00",
  "火曜日: 18:00～23:00",
  "水曜日: 18:00～23:00",
  "木曜日: 18:00～23:00",
  "金曜日: 18:00～翌3:00",
  "土曜日: 18:00～翌3:00",
];

/**
 * テスト用Placeを生成する。
 *
 * @example
 * ```ts
 * const place = buildPlace();
 * console.log(place.id);
 * ```
 */
function buildPlace(overrides?: Partial<Place>): Place {
  return {
    id: "p-1",
    displayName: "テスト居酒屋",
    formattedAddress: "東京都新宿区",
    location: { lat: 35.0, lng: 139.0 },
    ...overrides,
  };
}

/**
 * テスト用OpeningHoursを生成する。
 *
 * @example
 * ```ts
 * const hours = buildOpeningHours();
 * console.log(hours.periods.length);
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
    weekdayDescriptions: descriptions,
    ...overrides,
  };
}

describe("toDisplayPlaceの挙動", () => {
  test("営業時間がある店舗は営業ステータスと表示用文字列を返す", () => {
    // Given
    const place = buildPlace({
      currentOpeningHours: buildOpeningHours(),
    });
    const targetTime = JstTimeStringSchema.parse("2025-10-27T21:00:00");

    // When
    const result = toDisplayPlace({ place, targetTime });

    // Then
    expect(result.businessStatus.isOpenNow).toBe(true);
    expect(result.businessStatus.remainingMinutes).toBe(300);
    expect(result.businessStatus.statusText).toBe("営業中（あと5時間）");
    expect(result.openingHoursDisplay.todayHours).toBe("18:00～翌2:00");
  });

  test("営業時間情報が無い店舗は閉店中扱いで返す", () => {
    // Given
    const place = buildPlace({ currentOpeningHours: undefined });
    const targetTime = JstTimeStringSchema.parse("2025-10-27T21:00:00");

    // When
    const result = toDisplayPlace({ place, targetTime });

    // Then
    expect(result.businessStatus.isOpenNow).toBe(false);
    expect(result.businessStatus.remainingMinutes).toBe(0);
    expect(result.businessStatus.statusText).toBe("閉店中");
    expect(result.openingHoursDisplay.todayHours).toBe("営業時間情報なし");
  });

  test("閉店中の店舗は残り時間0で閉店中テキストになる", () => {
    // Given
    const place = buildPlace({
      currentOpeningHours: buildOpeningHours({
        openNow: false,
      }),
    });
    const targetTime = JstTimeStringSchema.parse("2025-10-27T09:00:00");

    // When
    const result = toDisplayPlace({ place, targetTime });

    // Then
    expect(result.businessStatus.isOpenNow).toBe(false);
    expect(result.businessStatus.remainingMinutes).toBe(0);
    expect(result.businessStatus.statusText).toBe("閉店中");
  });

  test("住所の先頭に付いた日本表記を除去する", () => {
    // Given
    const place = buildPlace({
      formattedAddress: "日本、〒103-8265 東京都中央区日本橋２丁目４−１",
      currentOpeningHours: buildOpeningHours(),
    });
    const targetTime = JstTimeStringSchema.parse("2025-10-27T21:00:00");

    // When
    const result = toDisplayPlace({ place, targetTime });

    // Then
    expect(result.formattedAddress).toBe(
      "〒103-8265 東京都中央区日本橋２丁目４−１",
    );
  });
});
