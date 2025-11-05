import { describe, expect, test } from "bun:test";
import type { DisplayPlace, JstTimeString } from "shared";
import { filterOpenPlaces, isOpenAt } from "./opening-hours-utils";

describe("isOpenAt", () => {
  test("営業時間内の場合はtrueを返す", () => {
    const openingHours = {
      openNow: true,
      periods: [
        {
          open: { day: 1, hour: 18, minute: 0 },
          close: { day: 1, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: ["月曜日: 18:00-23:00"],
    };

    const result = isOpenAt(
      openingHours,
      "2025-10-27T20:00:00" as JstTimeString,
    );

    expect(result).toBe(true);
  });

  test("営業時間外の場合はfalseを返す", () => {
    const openingHours = {
      openNow: false,
      periods: [
        {
          open: { day: 1, hour: 18, minute: 0 },
          close: { day: 1, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: ["月曜日: 18:00-23:00"],
    };

    const result = isOpenAt(
      openingHours,
      "2025-10-27T12:00:00" as JstTimeString,
    );

    expect(result).toBe(false);
  });

  test("24時跨ぎ営業の場合に正しく判定する", () => {
    const openingHours = {
      openNow: true,
      periods: [
        {
          open: { day: 0, hour: 22, minute: 0 },
          close: { day: 1, hour: 2, minute: 0 },
        },
      ],
      weekdayDescriptions: ["日曜日: 22:00-翌2:00"],
    };

    const result = isOpenAt(
      openingHours,
      "2025-10-27T00:30:00" as JstTimeString,
    );

    expect(result).toBe(true);
  });

  test("営業時間情報がない場合はfalseを返す", () => {
    const result = isOpenAt(undefined, "2025-10-27T20:00:00" as JstTimeString);

    expect(result).toBe(false);
  });
});

describe("filterOpenPlaces", () => {
  test("営業中の店舗のみをフィルタリングする", () => {
    const places: DisplayPlace[] = [
      {
        id: "place1",
        displayName: "営業中の店",
        formattedAddress: "東京都",
        location: { lat: 35.6812, lng: 139.7671 },
        currentOpeningHours: {
          openNow: true,
          periods: [
            {
              open: { day: 1, hour: 18, minute: 0 },
              close: { day: 1, hour: 23, minute: 0 },
            },
          ],
          weekdayDescriptions: ["月曜日: 18:00-23:00"],
        },
        businessStatus: {
          isOpenNow: true,
          remainingMinutes: 120,
          statusText: "営業中（あと2時間）",
        },
        openingHoursDisplay: {
          todayHours: "18:00～23:00",
        },
      },
      {
        id: "place2",
        displayName: "閉店中の店",
        formattedAddress: "東京都",
        location: { lat: 35.6812, lng: 139.7671 },
        currentOpeningHours: {
          openNow: false,
          periods: [
            {
              open: { day: 1, hour: 11, minute: 0 },
              close: { day: 1, hour: 14, minute: 0 },
            },
          ],
          weekdayDescriptions: ["月曜日: 11:00-14:00"],
        },
        businessStatus: {
          isOpenNow: false,
          remainingMinutes: 0,
          statusText: "営業終了",
        },
        openingHoursDisplay: {
          todayHours: "11:00～14:00",
        },
      },
    ];

    const result = filterOpenPlaces(
      places,
      "2025-10-27T20:00:00" as JstTimeString,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("place1");
  });

  test("営業時間情報がない店舗は除外する", () => {
    const places: DisplayPlace[] = [
      {
        id: "place1",
        displayName: "営業時間不明の店",
        formattedAddress: "東京都",
        location: { lat: 35.6812, lng: 139.7671 },
        businessStatus: {
          isOpenNow: false,
          remainingMinutes: 0,
          statusText: "営業時間不明",
        },
        openingHoursDisplay: {
          todayHours: "不明",
        },
      },
    ];

    const result = filterOpenPlaces(
      places,
      "2025-10-27T20:00:00" as JstTimeString,
    );

    expect(result).toHaveLength(0);
  });
});
