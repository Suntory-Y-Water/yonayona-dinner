import { afterEach, describe, expect, mock, test } from "bun:test";
import type { Env, SearchNearbyRequest } from "yonayona-dinner-shared";
import { SearchPlacesLoader } from "./search-places-loader";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

type FetchMock = (
  url: string,
  init?: {
    headers?: Record<string, string>;
    method?: string;
    body?: string;
  },
) => Promise<Response>;

describe("SearchPlacesLoaderの挙動", () => {
  test("APIキー付き環境を渡すとGoogleリポジトリにキーが設定される", async () => {
    const env = "loader-key";
    const request: SearchNearbyRequest = {
      location: { lat: 35, lng: 139 },
      radius: 600,
    };

    const fetchSpy = mock<FetchMock>(
      async () =>
        new Response(JSON.stringify({ places: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const loader = new SearchPlacesLoader(env);
    const result = await loader.run(request);

    expect(result.success).toBe(true);
    expect(fetchSpy.mock.calls.length).toBe(1);
    const firstCall = fetchSpy.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error("fetchが1度だけ呼ばれる想定でした");
    }
    const [, init] = firstCall;
    expect(init?.headers?.["X-Goog-Api-Key"]).toBe("loader-key");
  });
});
