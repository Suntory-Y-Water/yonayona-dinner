import type { JSX } from "react";
import type { DisplayPlace, LatLng } from "yonayona-dinner-shared";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * PlaceDetailPanelに渡すプロパティ。
 *
 * @example
 * ```ts
 * const props: PlaceDetailPanelProps = {
 *   place: null,
 *   isOpen: false,
 *   onClose: () => console.log("閉じました"),
 *   onNavigate: (location) => console.log(location.lat, location.lng),
 * };
 * ```
 */
type PlaceDetailPanelProps = {
  place: DisplayPlace | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (location: LatLng) => void;
};

/**
 * 選択中の店舗情報をボトムシートで表示するコンポーネント。
 *
 * @param props パネル表示に必要な情報
 * @returns 店舗詳細を表示するJSX
 *
 * @example
 * ```tsx
 * <PlaceDetailPanel
 *   place={{
 *     id: "sample",
 *     displayName: "居酒屋サンプル",
 *     formattedAddress: "東京都千代田区丸の内1-1-1",
 *     location: { lat: 35.6812, lng: 139.7671 },
 *     businessStatus: {
 *       isOpenNow: true,
 *       remainingMinutes: 90,
 *       statusText: "営業中（あと1時間30分）",
 *     },
 *     openingHoursDisplay: { todayHours: "18:00～翌2:00" },
 *   }}
 *   isOpen={true}
 *   onClose={() => console.log("パネルを閉じました")}
 *   onNavigate={(location) => console.log(location.lat, location.lng)}
 * />
 * ```
 */
export function PlaceDetailPanel({
  place,
  isOpen,
  onClose,
  onNavigate,
}: PlaceDetailPanelProps): JSX.Element {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="bg-[#1e1b3a] text-white border-none p-0 sm:max-w-full dark:bg-[#0c1220]"
      >
        <div className="space-y-4 p-6">
          {place ? (
            <>
              <SheetHeader className="items-start gap-3 text-left">
                <SheetTitle className="text-2xl font-semibold text-white">
                  {place.displayName}
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-300 dark:text-gray-300">
                  {place.formattedAddress}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-2 text-sm sm:text-base">
                <p className="text-sm text-gray-300 dark:text-gray-200">
                  今日の営業時間: {place.openingHoursDisplay.todayHours}
                </p>
                <p className="text-lg font-semibold text-[#FFD700]">
                  {place.businessStatus.statusText}
                </p>
              </div>
              <button
                type="button"
                className="w-full min-h-[44px] rounded-md bg-[#FFD700] px-4 py-3 text-base font-semibold text-black transition hover:bg-[#FFC600] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FFD700]"
                onClick={() => onNavigate(place.location)}
              >
                Googleマップで開く
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-300 dark:text-gray-200">
              店舗情報が選択されていません。
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
