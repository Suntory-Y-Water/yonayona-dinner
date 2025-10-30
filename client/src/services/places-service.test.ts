import { afterEach, describe, expect, it, mock } from "bun:test";
import {
  JstTimeStringSchema,
  type SearchNearbyRequest,
} from "yonayona-dinner-shared";
import { searchNearby } from "./places-service";

const originalFetch = globalThis.fetch;

function createFetchMock(
  implementation: (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) => ReturnType<typeof fetch>,
): typeof fetch {
  const handler = mock(implementation as unknown as typeof fetch);
  const preconnect = mock(async () => undefined);
  return Object.assign(handler, {
    preconnect,
  }) as unknown as typeof fetch;
}

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
  mock.restore();
});

describe("PlacesService.searchNearby", () => {
  it("API呼び出しが成功したとき、店舗情報リストを含むResultを返す", async () => {
    // Given
    const request: SearchNearbyRequest = {
      location: { lat: 35.6812, lng: 139.7671 },
      radius: 800,
      targetTime: JstTimeStringSchema.parse("2025-10-30T23:00:00"),
    };
    const responseBody = {
      places: [
        {
          id: "sample",
          displayName: "居酒屋サンプル",
          formattedAddress: "東京都千代田区丸の内1-1-1",
          location: { lat: 35.6812, lng: 139.7671 },
          businessStatus: {
            isOpenNow: true,
            remainingMinutes: 120,
            statusText: "営業中（あと2時間）",
          },
          openingHoursDisplay: {
            todayHours: "18:00～翌2:00",
          },
        },
      ],
    };

    globalThis.fetch = createFetchMock(async (_input, _init) => {
      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    // Then
    const result = await searchNearby(request);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.places).toHaveLength(1);
      expect(result.data.places[0]?.displayName).toBe("居酒屋サンプル");
    }
  });

  it("ネットワークエラー発生時、NETWORK_ERRORを含むResultを返す", async () => {
    // Given
    const request: SearchNearbyRequest = {
      location: { lat: 35.6812, lng: 139.7671 },
      radius: 800,
      targetTime: JstTimeStringSchema.parse("2025-10-30T23:00:00"),
    };

    globalThis.fetch = createFetchMock(async (_input, _init) => {
      throw new Error("network down");
    });

    // When
    const result = await searchNearby(request);

    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("NETWORK_ERROR");
      expect(result.error.message).toContain("network");
    }
  });
});
