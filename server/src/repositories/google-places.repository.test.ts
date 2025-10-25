import { afterEach, describe, expect, mock, test } from "bun:test";
import type { LatLng, SearchNearbyRequest } from "yonayona-dinner-shared";
import { GooglePlacesRepository } from "./google-places.repository";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const defaultLocation: LatLng = { lat: 35.0, lng: 139.0 };
const defaultRequest: SearchNearbyRequest = {
  location: defaultLocation,
  radius: 500,
};

type FetchMock = (
  url: string,
  init?: {
    headers?: Record<string, string>;
    method?: string;
    body?: string;
  },
) => Promise<Response>;

describe("GooglePlacesRepositoryの挙動", () => {
  test("正常系: Google Placesが成功レスポンスを返すと正規化された配列を返す", async () => {
    const responseBody = {
      places: [
        {
          id: "sample-place",
          displayName: { text: "サンプル店舗", languageCode: "ja" },
          formattedAddress: "東京都",
          location: { latitude: 35.0, longitude: 139.0 },
          currentOpeningHours: {
            openNow: true,
            periods: [],
            weekdayDescriptions: [],
          },
          rating: 4.2,
        },
      ],
    };

    const fetchSpy = mock<FetchMock>(
      async () =>
        new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const repository = new GooglePlacesRepository({ apiKey: "secret" });
    const result = await repository.searchNearby(defaultRequest);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("成功レスポンスを想定していました");
    }
    expect(result.data).toEqual([
      {
        id: "sample-place",
        displayName: "サンプル店舗",
        formattedAddress: "東京都",
        location: defaultLocation,
        currentOpeningHours: {
          openNow: true,
          periods: [],
          weekdayDescriptions: [],
        },
        rating: 4.2,
      },
    ]);

    expect(fetchSpy.mock.calls.length).toBe(1);
    const firstCall = fetchSpy.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error("fetchが1度だけ呼ばれる想定でした");
    }
    const [url, requestInit] = firstCall;
    expect(url).toBe("https://places.googleapis.com/v1/places:searchNearby");
    expect(requestInit?.method).toBe("POST");
    expect(requestInit?.headers?.["X-Goog-Api-Key"]).toBe("secret");
    expect(requestInit?.headers?.["X-Goog-FieldMask"]).toContain("places.id");
  });

  test("異常系: レート制限レスポンスの場合はRATE_LIMITエラーを返す", async () => {
    const fetchSpy = mock<FetchMock>(
      async () =>
        new Response(JSON.stringify({ error: { message: "クォータ超過" } }), {
          status: 429,
        }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const repository = new GooglePlacesRepository({ apiKey: "secret" });
    const result = await repository.searchNearby(defaultRequest);

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("エラー結果を想定していました");
    }
    expect(result.error.type).toBe("RATE_LIMIT");
    expect(result.error.message).toContain("クォータ");
  });

  test("異常系: ネットワークエラー時はNETWORK_ERRORを返す", async () => {
    const fetchSpy = mock<FetchMock>(async () => {
      throw new Error("ネットワーク障害");
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const repository = new GooglePlacesRepository({ apiKey: "secret" });
    const result = await repository.searchNearby(defaultRequest);

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("エラー結果を想定していました");
    }
    expect(result.error.type).toBe("NETWORK_ERROR");
    expect(result.error.message).toContain("ネットワーク障害");
  });
});
