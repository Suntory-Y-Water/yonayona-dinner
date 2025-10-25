import { describe, expect, mock, test } from "bun:test";
import type {
  Place,
  PlacesAPIError,
  Result,
  SearchNearbyRequest,
} from "yonayona-dinner-shared";
import type { IPlacesRepository } from "../repositories/interfaces/places-repository.interface";
import { SearchNearbyPlacesUsecase } from "./search-nearby-places.usecase";

const baseRequest: SearchNearbyRequest = {
  location: { lat: 35, lng: 139 },
  radius: 500,
};

describe("SearchNearbyPlacesUsecaseの挙動", () => {
  test("正常系: リポジトリが成功した場合はPlace配列を返す", async () => {
    const mockResult: Result<Place[], PlacesAPIError> = {
      success: true,
      data: [
        {
          id: "1",
          displayName: "店舗A",
          formattedAddress: "東京都",
          location: baseRequest.location,
        },
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
    expect(result.data.places[0]?.id).toBe("1");
    expect(searchNearbyMock.mock.calls.length).toBe(1);
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
