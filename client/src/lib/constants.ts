/**
 * アプリケーション全体で使用する定数。
 *
 * @example
 * ```ts
 * import { CONSTANTS } from '@/lib/constants';
 * console.log(CONSTANTS.DEFAULT_TARGET_TIME); // "23:00"
 * ```
 */
export const CONSTANTS = {
  /** 時間帯選択の開始時刻（22時から選択可能） */
  TIME_FILTER_START_HOUR: 22,

  /** 時間帯選択の終了時刻（翌2時まで選択可能、26と表現） */
  TIME_FILTER_END_HOUR: 26,

  /** 時間帯選択の間隔（分） */
  TIME_FILTER_INTERVAL_MINUTES: 15,

  /** 1日の時間数 */
  HOURS_PER_DAY: 24,

  /** 1時間の分数 */
  MINUTES_PER_HOUR: 60,

  /** 時刻フォーマット時の桁数 */
  TIME_FORMAT_PADDING: 2,

  /** 時刻フォーマット時のパディング文字 */
  TIME_FORMAT_PAD_CHAR: "0",

  /** デフォルトの検索半径（メートル） */
  DEFAULT_SEARCH_RADIUS_METERS: 800,

  /** デフォルトの営業時刻（HH:mm形式） */
  DEFAULT_TARGET_TIME: "23:00",

  /** 検索結果0件時の緩和後の半径（メートル） */
  RELAXED_SEARCH_RADIUS_METERS: 1200,

  /** 検索結果0件時の緩和後の営業時刻（HH:mm形式） */
  RELAXED_TARGET_TIME: "22:00",
} as const;
