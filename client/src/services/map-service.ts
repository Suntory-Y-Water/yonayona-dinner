import {
  APIOptions,
  importLibrary,
  setOptions,
} from "@googlemaps/js-api-loader";
import type { LatLng, Result } from "shared";
import { DARK_THEME_STYLES } from "@/lib/map-styles";

/**
 * 地図エラーの種類
 */
export type MapError =
  | { type: "LOAD_FAILED"; message: string }
  | { type: "API_KEY_INVALID"; message: string }
  | { type: "INITIALIZATION_FAILED"; message: string }
  | { type: "INVALID_MAP"; message: string };

/**
 * マーカーエラーの種類
 */
export type MarkerError =
  | { type: "INVALID_LOCATION"; message: string }
  | { type: "MARKER_CREATION_FAILED"; message: string }
  | { type: "INVALID_MAP"; message: string };

/**
 * 簡易的な店舗情報（マーカー表示用）
 */
export type PlaceForMarker = {
  id: string;
  displayName: string;
  location: LatLng;
  formattedAddress: string;
};

/**
 * Google Maps APIを初期化し、地図を表示する
 * @param element 地図を表示するDOM要素
 * @param center 地図の中心位置
 */
/**
 * マーカーのインスタンスを保持する配列
 */
let markers: google.maps.marker.AdvancedMarkerElement[] = [];

export async function initializeMap({
  element,
  center,
}: {
  element: HTMLElement;
  center: LatLng;
}): Promise<Result<google.maps.Map, MapError>> {
  // DOM要素のバリデーション
  if (!element) {
    return {
      success: false,
      error: {
        type: "INITIALIZATION_FAILED",
        message: "Invalid DOM element provided",
      },
    };
  }

  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: {
          type: "API_KEY_INVALID",
          message: "Google Maps API key is not configured",
        },
      };
    }

    const options: APIOptions = {
      key: apiKey,
      v: "weekly",
    };
    setOptions(options);

    // importLibraryを使用してmapsライブラリを読み込む
    const { Map } = await importLibrary("maps");

    // Google Maps APIが利用可能か確認
    if (!Map) {
      return {
        success: false,
        error: {
          type: "LOAD_FAILED",
          message: "Failed to load Google Maps API",
        },
      };
    }

    // 地図を初期化（AdvancedMarkerElementを使用するためmapIdが必須）
    const map = new Map(element, {
      center: { lat: center.lat, lng: center.lng },
      zoom: 15,
      mapId: "YONAYONA_DINNER_MAP",
      styles: DARK_THEME_STYLES,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    return {
      success: true,
      data: map,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "LOAD_FAILED",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

/**
 * 地図上にマーカーを表示する
 * @param map Google Mapsインスタンス
 * @param places 店舗情報の配列
 */
export async function displayMarkers({
  map,
  places,
}: {
  map: google.maps.Map;
  places: PlaceForMarker[];
}): Promise<Result<void, MarkerError>> {
  // 地図インスタンスのバリデーション
  if (!map) {
    return {
      success: false,
      error: {
        type: "INVALID_MAP",
        message: "Invalid map instance provided",
      },
    };
  }

  try {
    const { AdvancedMarkerElement, PinElement } = await importLibrary("marker");

    // 新しいマーカーを作成
    const newMarkers = places.map((place) => {
      // カスタムピンエレメントを作成
      const pin = new PinElement({
        background: "#FFD700",
        borderColor: "#FFFFFF",
        glyphColor: "#FFFFFF",
        scale: 1.2,
      });

      const marker = new AdvancedMarkerElement({
        position: { lat: place.location.lat, lng: place.location.lng },
        map,
        title: place.displayName,
        content: pin.element,
      });

      return marker;
    });

    // マーカー配列に追加
    markers.push(...newMarkers);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "MARKER_CREATION_FAILED",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

/**
 * すべてのマーカーをクリアする
 */
export function clearMarkers(): void {
  // すべてのマーカーを地図から削除
  markers.forEach((marker) => {
    marker.map = null;
  });

  // マーカー配列をクリア
  markers = [];
}
