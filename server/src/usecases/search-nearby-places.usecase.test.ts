import { describe, expect, mock, test } from "bun:test";
import {
  JstTimeStringSchema,
  type OpeningHours,
  type Place,
  type PlacesAPIError,
  type Result,
  type SearchNearbyRequest,
} from "yonayona-dinner-shared";
import type { IPlacesRepository } from "../repositories/interfaces/places-repository.interface";
import { SearchNearbyPlacesUsecase } from "./search-nearby-places.usecase";

const baseRequest: SearchNearbyRequest = {
  location: { lat: 35, lng: 139 },
  radius: 500,
  targetTime: JstTimeStringSchema.parse("2025-10-27T20:00:00"), // JST 20:00
};

/**
 * テスト用のPlaceを構築する。
 *
 * @example
 * ```ts
 * const place = buildPlace({ id: "p1" });
 * console.log(place.id); // "p1"
 * ```
 */
function buildPlace(overrides?: Partial<Place>): Place {
  return {
    id: "p1",
    displayName: "店舗A",
    formattedAddress: "東京都",
    location: baseRequest.location,
    ...overrides,
  };
}

describe("SearchNearbyPlacesUsecaseの挙動", () => {
  test("正常系: 営業中店舗をDisplayPlaceとして返す", async () => {
    const openingHours: OpeningHours = {
      openNow: true,
      periods: [
        {
          open: { day: 1, hour: 18, minute: 0 },
          close: { day: 1, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: ["月: 18-23"],
    };
    const mockResult: Result<Place[], PlacesAPIError> = {
      success: true,
      data: [buildPlace({ id: "1", currentOpeningHours: openingHours })],
    };
    const searchNearbyMock = mock(async () => mockResult);
    const repository: IPlacesRepository = {
      searchNearby:
        searchNearbyMock as unknown as IPlacesRepository["searchNearby"],
    };
    const usecase = new SearchNearbyPlacesUsecase({ repository });

    const result = await usecase.execute(baseRequest);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("成功レスポンスを想定していました");
    }
    expect(result.data.places).toHaveLength(1);
    const firstPlace = result.data.places[0];
    expect(firstPlace?.id).toBe("1");
    expect(firstPlace?.businessStatus.remainingMinutes).toBe(180);
    expect(firstPlace?.businessStatus.statusText).toBe("営業中（あと3時間）");
    expect(firstPlace?.openingHoursDisplay.todayHours).toBe("18:00～23:00");
    expect(searchNearbyMock.mock.calls.length).toBe(1);
  });

  test("正常系: 営業中のみ返し閉店中は除外する", async () => {
    const openHours: OpeningHours = {
      openNow: true,
      periods: [
        {
          open: { day: 1, hour: 18, minute: 0 },
          close: { day: 1, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: ["月: 18-23"],
    };
    const closedHours: OpeningHours = {
      openNow: false,
      periods: [
        {
          open: { day: 1, hour: 10, minute: 0 },
          close: { day: 1, hour: 12, minute: 0 },
        },
      ],
      weekdayDescriptions: ["月: 10-12"],
    };
    const mockResult: Result<Place[], PlacesAPIError> = {
      success: true,
      data: [
        buildPlace({ id: "open", currentOpeningHours: openHours }),
        buildPlace({ id: "closed", currentOpeningHours: closedHours }),
      ],
    };
    const searchNearbyMock = mock(async () => mockResult);
    const repository: IPlacesRepository = {
      searchNearby:
        searchNearbyMock as unknown as IPlacesRepository["searchNearby"],
    };
    const usecase = new SearchNearbyPlacesUsecase({ repository });

    const result = await usecase.execute(baseRequest);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("成功レスポンスを想定していました");
    }
    expect(result.data.places).toHaveLength(1);
    expect(result.data.places[0]?.id).toBe("open");
  });

  test("正常系: 営業時間情報なしの店舗は除外される", async () => {
    const openingHours: OpeningHours = {
      openNow: true,
      periods: [
        {
          open: { day: 1, hour: 18, minute: 0 },
          close: { day: 1, hour: 23, minute: 0 },
        },
      ],
      weekdayDescriptions: ["月: 18-23"],
    };
    const mockResult: Result<Place[], PlacesAPIError> = {
      success: true,
      data: [
        buildPlace({ id: "withHours", currentOpeningHours: openingHours }),
        buildPlace({ id: "noHours", currentOpeningHours: undefined }),
      ],
    };
    const searchNearbyMock = mock(async () => mockResult);
    const repository: IPlacesRepository = {
      searchNearby:
        searchNearbyMock as unknown as IPlacesRepository["searchNearby"],
    };
    const usecase = new SearchNearbyPlacesUsecase({ repository });

    const result = await usecase.execute(baseRequest);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("成功レスポンスを想定していました");
    }
    expect(result.data.places).toHaveLength(1);
    expect(result.data.places[0]?.id).toBe("withHours");
  });

  test("異常系: 緯度が範囲外ならINVALID_REQUESTになる", async () => {
    const searchNearbyMock = mock(async () => ({
      success: true,
      data: [] as Place[],
    }));
    const repository: IPlacesRepository = {
      searchNearby:
        searchNearbyMock as unknown as IPlacesRepository["searchNearby"],
    };
    const usecase = new SearchNearbyPlacesUsecase({ repository });

    const result = await usecase.execute({
      ...baseRequest,
      location: { lat: 100, lng: 0 },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("バリデーション失敗を想定していました");
    }
    expect(result.error.type).toBe("INVALID_REQUEST");
    expect(searchNearbyMock.mock.calls.length).toBe(0);
  });

  test("異常系: 半径が範囲外ならINVALID_REQUESTになる", async () => {
    const searchNearbyMock = mock(async () => ({
      success: true,
      data: [] as Place[],
    }));
    const repository: IPlacesRepository = {
      searchNearby:
        searchNearbyMock as unknown as IPlacesRepository["searchNearby"],
    };
    const usecase = new SearchNearbyPlacesUsecase({ repository });

    const result = await usecase.execute({ ...baseRequest, radius: 0 });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("バリデーション失敗を想定していました");
    }
    expect(result.error.type).toBe("INVALID_REQUEST");
    expect(searchNearbyMock.mock.calls.length).toBe(0);
  });

  // NOTE: targetTimeのバリデーションはZodスキーマ（JstTimeStringSchema）で行われるため、
  // 無効な形式の文字列はSearchNearbyRequestSchemaのparseで弾かれる。
  // Usecase内でのバリデーションは不要になったため、このテストは削除。
  // test("異常系: targetTimeが不正ならINVALID_REQUESTになる", async () => { ... });

  test("異常系: リポジトリのエラーはそのまま伝播する", async () => {
    const repositoryError: PlacesAPIError = {
      type: "RATE_LIMIT",
      message: "リクエスト過多",
    };
    const searchNearbyMock = mock(async () => ({
      success: false,
      error: repositoryError,
    }));
    const repository: IPlacesRepository = {
      searchNearby:
        searchNearbyMock as unknown as IPlacesRepository["searchNearby"],
    };
    const usecase = new SearchNearbyPlacesUsecase({ repository });

    const result = await usecase.execute(baseRequest);

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("エラー伝播を想定していました");
    }
    expect(result.error).toEqual(repositoryError);
    expect(searchNearbyMock.mock.calls.length).toBe(1);
  });
});
