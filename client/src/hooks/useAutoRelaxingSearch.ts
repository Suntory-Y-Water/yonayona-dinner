import { useEffect, useState } from "react";
import type { DisplayPlace, LatLng } from "yonayona-dinner-shared";
import { CONSTANTS } from "@/lib/constants";
import { formatToJstTimeString } from "@/lib/time-utils";
import { searchNearby } from "@/services/places-service";

/**
 * 自動緩和機能付き店舗検索カスタムフックの戻り値。
 *
 * このフックは検索結果が0件の場合、以下の順で自動的に条件を緩和します：
 * 1. 半径800m, ユーザー選択時間
 * 2. 半径1200m, ユーザー選択時間
 * 3. 半径1200m, 22:00（ユーザー選択時間≠22:00の場合のみ）
 *
 * @example
 * ```ts
 * const { places, message, isSearching, error } = useAutoRelaxingSearch({
 *   location: currentLocation,
 *   map,
 *   userTargetTime: targetTime,
 * });
 * console.log(places.length); // 検索結果の件数
 * console.log(message); // "検索範囲を広げました" など
 * ```
 */
type UseAutoRelaxingSearchResult = {
  /** 検索結果の店舗リスト */
  places: DisplayPlace[];
  /** ユーザーへの通知メッセージ（緩和時の説明など） */
  message: string | null;
  /** 検索中フラグ */
  isSearching: boolean;
  /** エラーメッセージ */
  error: string | null;
};

/**
 * 自動緩和機能付き店舗検索カスタムフック。
 *
 * Places APIとの同期を行い、検索結果が0件の場合に以下の順で自動緩和：
 * 1. 半径800m, ユーザー選択時間 → 0件の場合
 * 2. 半径1200m, ユーザー選択時間 → 0件の場合
 * 3. 半径1200m, 22:00（ユーザー選択時間≠22:00の場合のみ）
 * 4. すべて0件 → メッセージ表示
 *
 * @param location - 検索中心位置
 * @param map - Google Mapsインスタンス（検索実行の前提条件）
 * @param userTargetTime - ユーザーが選択した時間帯（デフォルト: "23:00"）
 * @returns 検索結果、メッセージ、検索中フラグ、エラー
 *
 * @example
 * ```tsx
 * const { places, message, isSearching } = useAutoRelaxingSearch({
 *   location: currentLocation,
 *   map,
 *   userTargetTime: "23:00",
 * });
 *
 * if (isSearching) {
 *   return <div>検索中...</div>;
 * }
 *
 * if (message) {
 *   return <div>{message}</div>;
 * }
 *
 * return <PlacesList places={places} />;
 * ```
 */
export function useAutoRelaxingSearch({
  location,
  map,
  userTargetTime = CONSTANTS.DEFAULT_TARGET_TIME,
}: {
  location: LatLng | null;
  map: google.maps.Map | null;
  userTargetTime?: string;
}): UseAutoRelaxingSearchResult {
  const [places, setPlaces] = useState<DisplayPlace[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 外部システム（Places API）との同期
  useEffect(() => {
    if (!location || !map) {
      return;
    }

    // 型安全性のため、locationを安定した変数にコピー
    const stableLocation: LatLng = location;

    let isActive = true;
    setIsSearching(true);
    setError(null);
    setMessage(null);

    /**
     * 緩和ロジック付き検索を実行する。
     *
     * 検索結果が0件の場合、段階的に条件を緩和して再検索を実行。
     * すべての緩和策を実行しても0件の場合、メッセージを設定する。
     *
     * @example
     * ```ts
     * await performSearchWithRelaxation();
     * // 第1段階: 800m, 23:00 → 0件
     * // 第2段階: 1200m, 23:00 → 0件
     * // 第3段階: 1200m, 22:00 → 2件
     * // 結果: places=[...], message="時間帯を調整しました（22:00）"
     * ```
     */
    async function performSearchWithRelaxation() {
      const baseDate = new Date();

      // 第1段階: デフォルト条件（800m, ユーザー指定時間）
      const result1 = await searchNearby({
        location: stableLocation,
        radius: CONSTANTS.DEFAULT_SEARCH_RADIUS_METERS,
        targetTime: formatToJstTimeString({
          date: baseDate,
          time: userTargetTime,
        }),
      });

      if (!isActive) return;

      if (result1.success && result1.data.places.length > 0) {
        setPlaces(result1.data.places);
        setMessage(null);
        setIsSearching(false);
        return;
      }

      if (!result1.success) {
        setError(result1.error.message);
        setPlaces([]);
        setIsSearching(false);
        return;
      }

      // 第2段階: 半径を拡大（1200m, ユーザー指定時間）
      const result2 = await searchNearby({
        location: stableLocation,
        radius: CONSTANTS.RELAXED_SEARCH_RADIUS_METERS,
        targetTime: formatToJstTimeString({
          date: baseDate,
          time: userTargetTime,
        }),
      });

      if (!isActive) return;

      if (result2.success && result2.data.places.length > 0) {
        setPlaces(result2.data.places);
        setMessage("検索範囲を広げました");
        setIsSearching(false);
        return;
      }

      if (!result2.success) {
        setError(result2.error.message);
        setPlaces([]);
        setIsSearching(false);
        return;
      }

      // 第3段階: 時間帯を緩和（1200m, 22:00）
      // ユーザー選択時間が既に22:00の場合はスキップ
      if (userTargetTime !== CONSTANTS.RELAXED_TARGET_TIME) {
        const result3 = await searchNearby({
          location: stableLocation,
          radius: CONSTANTS.RELAXED_SEARCH_RADIUS_METERS,
          targetTime: formatToJstTimeString({
            date: baseDate,
            time: CONSTANTS.RELAXED_TARGET_TIME,
          }),
        });

        if (!isActive) return;

        if (result3.success && result3.data.places.length > 0) {
          setPlaces(result3.data.places);
          setMessage(
            `時間帯を調整しました（${CONSTANTS.RELAXED_TARGET_TIME}）`,
          );
          setIsSearching(false);
          return;
        }

        if (!result3.success) {
          setError(result3.error.message);
          setPlaces([]);
          setIsSearching(false);
          return;
        }
      }

      // すべての緩和策を実行しても0件
      setPlaces([]);
      setMessage("近くに営業中の店舗が見つかりませんでした");
      setIsSearching(false);
    }

    performSearchWithRelaxation();

    return () => {
      isActive = false;
    };
  }, [location, map, userTargetTime]); // 外部システムとの同期のトリガー

  return { places, message, isSearching, error };
}
