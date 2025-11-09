/**
 * @happydom
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import type { DisplayPlace, LatLng } from "yonayona-dinner-shared";
import { useAutoRelaxingSearch } from "./useAutoRelaxingSearch";

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

describe("useAutoRelaxingSearch", () => {
  const mockLocation: LatLng = { lat: 35.6812, lng: 139.7671 };
  const mockMap = {} as google.maps.Map;
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

  test("第1段階で結果がある場合、そのまま返す", async () => {
    // Given: 第1段階（800m, 23:00）で結果がある
    mockSearchNearby.mockResolvedValueOnce({
      success: true,
      data: { places: [mockPlace] },
    });

    // When: フックを実行
    const { result } = renderHook(() =>
      useAutoRelaxingSearch({
        location: mockLocation,
        map: mockMap,
        userTargetTime: "23:00",
      }),
    );

    // Then: 検索が1回だけ実行される
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(mockSearchNearby).toHaveBeenCalledTimes(1);
    expect(result.current.places).toEqual([mockPlace]);
    expect(result.current.message).toBeNull();
  });

  test("第1段階が0件の場合、第2段階（半径拡大）で再検索", async () => {
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

    // When: フックを実行
    const { result } = renderHook(() =>
      useAutoRelaxingSearch({
        location: mockLocation,
        map: mockMap,
        userTargetTime: "23:00",
      }),
    );

    // Then: 検索が2回実行される
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(mockSearchNearby).toHaveBeenCalledTimes(2);
    expect(result.current.places).toEqual([mockPlace]);
    expect(result.current.message).toBe("検索範囲を広げました");
  });

  test("第2段階も0件の場合、第3段階（時間帯緩和）で再検索", async () => {
    // Given: 第1・第2段階が0件、第3段階（22:00）で結果がある
    mockFormatToJstTimeString
      .mockReturnValueOnce("2025-10-30T23:00:00")
      .mockReturnValueOnce("2025-10-30T23:00:00")
      .mockReturnValueOnce("2025-10-30T22:00:00");

    mockSearchNearby
      .mockResolvedValueOnce({
        success: true,
        data: { places: [] },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { places: [] },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { places: [mockPlace] },
      });

    // When: フックを実行
    const { result } = renderHook(() =>
      useAutoRelaxingSearch({
        location: mockLocation,
        map: mockMap,
        userTargetTime: "23:00",
      }),
    );

    // Then: 検索が3回実行される
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(mockSearchNearby).toHaveBeenCalledTimes(3);
    expect(result.current.places).toEqual([mockPlace]);
    expect(result.current.message).toBe("時間帯を調整しました（22:00）");
  });

  test("すべての緩和策を実行しても0件の場合、メッセージを表示", async () => {
    // Given: すべての段階で0件
    mockSearchNearby
      .mockResolvedValueOnce({
        success: true,
        data: { places: [] },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { places: [] },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { places: [] },
      });

    // When: フックを実行
    const { result } = renderHook(() =>
      useAutoRelaxingSearch({
        location: mockLocation,
        map: mockMap,
        userTargetTime: "23:00",
      }),
    );

    // Then: 検索が3回実行され、最終メッセージが表示される
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(mockSearchNearby).toHaveBeenCalledTimes(3);
    expect(result.current.places).toEqual([]);
    expect(result.current.message).toBe(
      "近くに営業中の店舗が見つかりませんでした",
    );
  });

  test("ユーザー選択時間が22:00の場合、第3段階をスキップ", async () => {
    // Given: ユーザー選択時間が22:00、第1・第2段階が0件
    mockSearchNearby
      .mockResolvedValueOnce({
        success: true,
        data: { places: [] },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { places: [] },
      });

    // When: フックを実行
    const { result } = renderHook(() =>
      useAutoRelaxingSearch({
        location: mockLocation,
        map: mockMap,
        userTargetTime: "22:00",
      }),
    );

    // Then: 検索が2回のみ実行される（第3段階スキップ）
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(mockSearchNearby).toHaveBeenCalledTimes(2);
    expect(result.current.places).toEqual([]);
    expect(result.current.message).toBe(
      "近くに営業中の店舗が見つかりませんでした",
    );
  });

  test("location または map が null の場合、検索を実行しない", () => {
    // Given: locationがnull
    const { result } = renderHook(() =>
      useAutoRelaxingSearch({
        location: null,
        map: mockMap,
        userTargetTime: "23:00",
      }),
    );

    // Then: 検索が実行されない
    expect(mockSearchNearby).not.toHaveBeenCalled();
    expect(result.current.isSearching).toBe(false);
    expect(result.current.places).toEqual([]);
  });
});
