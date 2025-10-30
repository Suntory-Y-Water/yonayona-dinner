import { afterAll, afterEach, describe, expect, it, mock } from "bun:test";
import type { DisplayPlace } from "yonayona-dinner-shared";

type ListenerMap = Record<string, (() => void) | undefined>;

const markerInstances: AdvancedMarkerElementStub[] = [];

class PinElementStub {
  public readonly element: Record<string, never>;

  constructor() {
    this.element = {};
  }
}

class AdvancedMarkerElementStub {
  public map: google.maps.Map | null;
  public readonly position: { lat: number; lng: number };
  public readonly title: string;
  public readonly content: unknown;
  private readonly listeners: ListenerMap = {};

  constructor(options: {
    position: { lat: number; lng: number };
    map: google.maps.Map;
    title: string;
    content: unknown;
  }) {
    this.position = options.position;
    this.map = options.map;
    this.title = options.title;
    this.content = options.content;
    markerInstances.push(this);
  }

  addListener(
    eventName: string,
    handler: () => void,
  ): google.maps.MapsEventListener {
    this.listeners[eventName] = handler;
    return {
      remove: () => undefined,
    } as unknown as google.maps.MapsEventListener;
  }

  trigger(eventName: string): void {
    const handler = this.listeners[eventName];
    handler?.();
  }
}

mock.module("@googlemaps/js-api-loader", () => ({
  importLibrary: mock(async (library: string) => {
    if (library === "marker") {
      return {
        AdvancedMarkerElement: AdvancedMarkerElementStub,
        PinElement: PinElementStub,
      };
    }
    throw new Error(`想定外のライブラリが要求されました: ${library}`);
  }),
  setOptions: mock(() => undefined),
}));

const { displayMarkers, clearMarkers } = await import("./map-service");

afterEach(() => {
  markerInstances.length = 0;
  clearMarkers();
});

afterAll(() => {
  mock.restore();
});

describe("displayMarkers", () => {
  it("マーカーを表示し、クリック時にコールバックを実行する", async () => {
    // Given
    const map = {} as google.maps.Map;
    const places: DisplayPlace[] = [
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
    ];
    const onMarkerClick = mock(() => undefined);

    // When
    const result = await displayMarkers({ map, places, onMarkerClick });

    // Then
    expect(result.success).toBe(true);
    expect(markerInstances).toHaveLength(1);
    markerInstances[0]?.trigger("click");
    expect(onMarkerClick).toHaveBeenCalledWith(places[0]);
  });
});
