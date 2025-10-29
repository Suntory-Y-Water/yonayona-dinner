/**
 * 営業ステータスを日本語の表示用テキストに整形する。
 *
 * @example
 * ```ts
 * const text = formatBusinessStatus({
 *   isOpenNow: true,
 *   remainingMinutes: 125,
 * });
 * console.log(text); // "営業中（あと2時間5分）"
 * ```
 */
export function formatBusinessStatus({
  isOpenNow,
  remainingMinutes,
}: {
  isOpenNow: boolean;
  remainingMinutes: number;
}): string {
  if (isOpenNow) {
    if (remainingMinutes <= 0) {
      return "営業中（まもなく閉店）";
    }
    return `営業中（あと${formatRemainingText({
      minutes: remainingMinutes,
    })}）`;
  }
  return "閉店中";
}

/**
 * 分数を「X時間Y分」形式へ整形する。
 *
 * @example
 * ```ts
 * const text = formatRemainingText({ minutes: 85 });
 * console.log(text); // "1時間25分"
 * ```
 */
function formatRemainingText({ minutes }: { minutes: number }): string {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours > 0 && restMinutes > 0) {
    return `${hours}時間${restMinutes}分`;
  }
  if (hours > 0) {
    return `${hours}時間`;
  }
  return `${restMinutes}分`;
}
