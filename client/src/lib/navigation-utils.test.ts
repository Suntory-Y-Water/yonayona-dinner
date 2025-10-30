import { afterEach, describe, expect, it, mock } from "bun:test";
import { openGoogleMaps } from "./navigation-utils";

const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow) {
    globalThis.window = originalWindow;
  } else {
    delete (globalThis as { window?: unknown }).window;
  }
  mock.restore();
});

describe("openGoogleMaps", () => {
  it("Googleマップの検索URLを生成してwindow.openを呼び出す", () => {
    // Given
    const openMock = mock(() => undefined);
    globalThis.window = {
      open: openMock,
    } as unknown as Window & typeof globalThis;

    // When
    openGoogleMaps({ lat: 35.6812, lng: 139.7671 });

    // Then
    expect(openMock).toHaveBeenCalledWith(
      "https://www.google.com/maps/search/?api=1&query=35.6812,139.7671",
      "_blank",
    );
  });
});
