import { useCallback, useEffect, useRef, useState } from "react";
import type { DisplayPlace, LatLng } from "shared";
import { Logo } from "@/components/Logo";
import { PlaceDetailPanel } from "@/components/PlaceDetailPanel";
import { TimeFilter } from "@/components/TimeFilter";
import { Button } from "@/components/ui/button";
import { useAutoRelaxingSearch } from "@/hooks/useAutoRelaxingSearch";
import { CONSTANTS } from "@/lib/constants";
import { openGoogleMaps } from "@/lib/navigation-utils";
import { getCurrentLocation } from "@/services/geolocation-service";
import {
  clearMarkers,
  displayMarkers,
  initializeMap,
} from "@/services/map-service";

/**
 * 地図表示と店舗検索を提供するホーム画面コンポーネント。
 *
 * @example
 * ```tsx
 * export function App(): JSX.Element {
 *   return <Home />;
 * }
 * ```
 */
export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<DisplayPlace | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [targetTime, setTargetTime] = useState<string>(
    CONSTANTS.DEFAULT_TARGET_TIME,
  );

  // カスタムフックで検索（外部API同期）
  const {
    places,
    message: searchMessage,
    isSearching,
    error: searchError,
  } = useAutoRelaxingSearch({
    location: currentLocation,
    map,
    userTargetTime: targetTime,
  });

  const handleMarkerClick = useCallback((place: DisplayPlace) => {
    setSelectedPlace(place);
    setIsPanelOpen(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initializeMapWithLocation() {
      try {
        // 位置情報を取得
        const locationResult = await getCurrentLocation();

        if (!locationResult.success) {
          if (!isMounted) return;

          // 位置情報取得エラー時のメッセージ
          const errorMessages: Record<
            typeof locationResult.error.type,
            string
          > = {
            PERMISSION_DENIED:
              "位置情報の利用が許可されていません。ブラウザの設定から位置情報を有効にしてください。",
            POSITION_UNAVAILABLE:
              "位置情報を取得できませんでした。しばらくしてから再度お試しください。",
            TIMEOUT:
              "位置情報の取得がタイムアウトしました。通信環境を確認してください。",
            NOT_SUPPORTED: "お使いのブラウザは位置情報機能に対応していません。",
          };

          setError(
            errorMessages[locationResult.error.type] ||
              locationResult.error.message,
          );
          setIsLoading(false);
          setCurrentLocation(null);
          setMap(null);
          return;
        }

        if (!isMounted) return;
        setCurrentLocation(locationResult.data);

        // 地図を初期化
        if (!mapRef.current) {
          if (!isMounted) return;
          setError("地図の表示に失敗しました。");
          setIsLoading(false);
          setMap(null);
          return;
        }

        const mapResult = await initializeMap({
          element: mapRef.current,
          center: locationResult.data,
        });

        if (!mapResult.success) {
          if (!isMounted) return;

          // 地図初期化エラー時のメッセージ
          const errorMessages: Record<typeof mapResult.error.type, string> = {
            API_KEY_INVALID: "Google Maps APIキーが設定されていません。",
            LOAD_FAILED: "Google Mapsの読み込みに失敗しました。",
            INITIALIZATION_FAILED: "地図の初期化に失敗しました。",
            INVALID_MAP: "地図の表示に失敗しました。",
          };

          setError(
            errorMessages[mapResult.error.type] || mapResult.error.message,
          );
          setIsLoading(false);
          setMap(null);
          return;
        }

        if (!isMounted) return;
        setMap(mapResult.data);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "予期しないエラーが発生しました。",
        );
        setIsLoading(false);
        setMap(null);
        setCurrentLocation(null);
      }
    }

    initializeMapWithLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // マーカー表示（外部システム: Google Maps API との同期）
  useEffect(() => {
    const mapInstance = map;

    clearMarkers();

    if (!mapInstance) {
      return;
    }

    const stableMap: google.maps.Map = mapInstance;

    if (places.length === 0) {
      return;
    }

    let isActive = true;

    async function placeMarkers() {
      const result = await displayMarkers({
        map: stableMap,
        places,
        onMarkerClick: handleMarkerClick,
      });

      if (!isActive) {
        return;
      }

      if (!result.success) {
        setError(result.error.message);
      }
    }

    placeMarkers();

    return () => {
      isActive = false;
      clearMarkers();
    };
  }, [map, places, handleMarkerClick]);

  return (
    <div className="relative w-full h-screen">
      {/* 地図コンテナ */}
      <div ref={mapRef} className="w-full h-full" />

      {/* ロゴ */}
      {!isLoading && !error && (
        <div className="absolute top-4 left-4 z-10">
          <Logo />
        </div>
      )}

      {/* 時間帯フィルタUI（画面下部に配置） */}
      {!isLoading && !error && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <TimeFilter selectedTime={targetTime} onTimeChange={setTargetTime} />
        </div>
      )}

      {/* 検索メッセージ表示 */}
      {searchMessage && !isSearching && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="bg-yellow-600/90 text-white px-4 py-2 rounded-lg shadow-lg text-center">
            {searchMessage}
          </div>
        </div>
      )}

      {/* ローディング表示 */}
      {(isLoading || isSearching) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1d2c4d]">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-white text-lg">
              {isLoading
                ? "地図を読み込んでいます..."
                : "店舗を検索しています..."}
            </p>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {(error || searchError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1d2c4d]">
          <div className="max-w-md p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
            <h2 className="text-xl font-bold text-red-400 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-white">{error || searchError}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              再読み込み
            </Button>
          </div>
        </div>
      )}

      <PlaceDetailPanel
        place={selectedPlace}
        isOpen={isPanelOpen && !!selectedPlace}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedPlace(null);
        }}
        onNavigate={openGoogleMaps}
      />
    </div>
  );
}
