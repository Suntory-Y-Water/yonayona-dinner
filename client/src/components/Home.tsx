import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentLocation } from "@/services/geolocation-service";
import { initializeMap } from "@/services/map-service";

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          return;
        }

        // 地図を初期化
        if (!mapRef.current) {
          if (!isMounted) return;
          setError("地図の表示に失敗しました。");
          setIsLoading(false);
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
          return;
        }

        if (!isMounted) return;
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "予期しないエラーが発生しました。",
        );
        setIsLoading(false);
      }
    }

    initializeMapWithLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      {/* 地図コンテナ */}
      <div ref={mapRef} className="w-full h-full" />

      {/* ローディング表示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1d2c4d]">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-white text-lg">地図を読み込んでいます...</p>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1d2c4d]">
          <div className="max-w-md p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
            <h2 className="text-xl font-bold text-red-400 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-white">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              再読み込み
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
