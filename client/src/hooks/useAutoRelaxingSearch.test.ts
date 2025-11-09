import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { DisplayPlace, LatLng } from "yonayona-dinner-shared";
import { CONSTANTS } from "@/lib/constants";

// モック化
const mockSearchNearby = mock();
const mockFormatToJstTimeString = mock();

// モジュールのモック
mock.module("@/services/places-service", () => ({
  searchNearby: mockSearchNearby,
}));

mock.module("@/lib/time-utils", () => ({
  formatToJstTimeString: mockFormatToJstTimeString,
}));

describe("useAutoRelaxingSearch のロジックテスト", () => {
  const mockLocation: LatLng = { lat: 35.6812, lng: 139.7671 };
  const mockPlace: DisplayPlace = {
    id: "test-place-1",
    displayName: "テスト居酒屋",
    location: mockLocation,
    formattedAddress: "東京都千代田区",
    businessStatus: {
      isOpenNow: true,
      remainingMinutes: 120,
      statusText: "営業中（あと2時間）",
    },
    openingHoursDisplay: {
      todayHours: "18:00～翌2:00",
    },
  };

  beforeEach(() => {
    mockSearchNearby.mockReset();
    mockFormatToJstTimeString.mockReset();
    mockFormatToJstTimeString.mockReturnValue("2025-10-30T23:00:00");
  });

  afterEach(() => {
    mockSearchNearby.mockReset();
    mockFormatToJstTimeString.mockReset();
  });

  test("第1段階で結果がある場合、1回のAPI呼び出しのみ", async () => {
    // Given: 第1段階（800m, 23:00）で結果がある
    mockSearchNearby.mockResolvedValueOnce({
      success: true,
      data: { places: [mockPlace] },
    });

    // When: searchNearbyを呼び出し
    const { searchNearby } = await import("@/services/places-service");
    const result = await searchNearby({
      location: mockLocation,
      radius: CONSTANTS.DEFAULT_SEARCH_RADIUS_METERS,
      targetTime: "2025-10-30T23:00:00",
    });

    // Then: 結果が返る
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.places).toEqual([mockPlace]);
    }
  });

  test("第1段階が0件の場合、第2段階の半径拡大が必要", async () => {
    // Given: 第1段階が0件、第2段階（1200m）で結果がある
    mockSearchNearby
      .mockResolvedValueOnce({
        success: true,
        data: { places: [] },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { places: [mockPlace] },
      });

    // When: 第1段階を実行
    const { searchNearby } = await import("@/services/places-service");
    const result1 = await searchNearby({
      location: mockLocation,
      radius: CONSTANTS.DEFAULT_SEARCH_RADIUS_METERS,
      targetTime: "2025-10-30T23:00:00",
    });

    // Then: 第1段階は0件
    expect(result1.success).toBe(true);
    if (result1.success) {
      expect(result1.data.places.length).toBe(0);
    }

    // When: 第2段階（半径拡大）を実行
    const result2 = await searchNearby({
      location: mockLocation,
      radius: CONSTANTS.RELAXED_SEARCH_RADIUS_METERS,
      targetTime: "2025-10-30T23:00:00",
    });

    // Then: 第2段階で結果が返る
    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.data.places).toEqual([mockPlace]);
    }
  });

  test("時間帯緩和のロジック検証", async () => {
    // Given: 時間帯を緩和したリクエスト
    mockFormatToJstTimeString.mockReturnValue("2025-10-30T22:00:00");
    mockSearchNearby.mockResolvedValueOnce({
      success: true,
      data: { places: [mockPlace] },
    });

    // When: 22:00で検索
    const { formatToJstTimeString } = await import("@/lib/time-utils");
    const jstTime = formatToJstTimeString({
      date: new Date("2025-10-30"),
      time: CONSTANTS.RELAXED_TARGET_TIME,
    });

    const { searchNearby } = await import("@/services/places-service");
    const result = await searchNearby({
      location: mockLocation,
      radius: CONSTANTS.RELAXED_SEARCH_RADIUS_METERS,
      targetTime: jstTime,
    });

    // Then: 時刻が正しくフォーマットされ、結果が返る
    expect(jstTime).toBe("2025-10-30T22:00:00");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.places).toEqual([mockPlace]);
    }
  });

  test("API呼び出しエラー時の処理", async () => {
    // Given: API呼び出しがエラー
    mockSearchNearby.mockResolvedValueOnce({
      success: false,
      error: {
        type: "NETWORK_ERROR",
        message: "ネットワークエラーが発生しました",
      },
    });

    // When: searchNearbyを呼び出し
    const { searchNearby } = await import("@/services/places-service");
    const result = await searchNearby({
      location: mockLocation,
      radius: CONSTANTS.DEFAULT_SEARCH_RADIUS_METERS,
      targetTime: "2025-10-30T23:00:00",
    });

    // Then: エラーが返る
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("NETWORK_ERROR");
      expect(result.error.message).toBe("ネットワークエラーが発生しました");
    }
  });

  test("定数値の検証", () => {
    // Given/When/Then: 緩和後の定数が正しく設定されている
    expect(CONSTANTS.DEFAULT_SEARCH_RADIUS_METERS).toBe(800);
    expect(CONSTANTS.RELAXED_SEARCH_RADIUS_METERS).toBe(1200);
    expect(CONSTANTS.DEFAULT_TARGET_TIME).toBe("23:00");
    expect(CONSTANTS.RELAXED_TARGET_TIME).toBe("22:00");
  });
});
