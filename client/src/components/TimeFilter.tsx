type TimeOption = {
  value: string;
  label: string;
};

/**
 * 15分刻みの時間選択肢を生成する。
 *
 * @param startHour - 開始時刻（時）
 * @param endHour - 終了時刻（時）
 * @returns 時間選択肢の配列
 *
 * @example
 * ```ts
 * const options = generateTimeOptions({ startHour: 22, endHour: 26 });
 * // [{ value: "22:00", label: "22:00" }, { value: "22:15", label: "22:15" }, ...]
 * ```
 */
function generateTimeOptions({
  startHour,
  endHour,
}: {
  startHour: number;
  endHour: number;
}): TimeOption[] {
  const options: TimeOption[] = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const displayHour = hour > 23 ? hour - 24 : hour;
      const value = `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const label =
        hour > 23
          ? `翌${displayHour}:${String(minute).padStart(2, "0")}`
          : `${displayHour}:${String(minute).padStart(2, "0")}`;
      options.push({ value, label });
    }
  }

  return options;
}

const TIME_OPTIONS = generateTimeOptions({ startHour: 22, endHour: 26 });

/**
 * 時間帯フィルタUIコンポーネント。
 *
 * デフォルトで23:00基準の営業中フィルタを提供し、
 * 15分刻みで時間帯を調整可能。
 *
 * @example
 * ```tsx
 * <TimeFilter
 *   selectedTime="23:00"
 *   onTimeChange={(time) => console.log(time)}
 * />
 * ```
 */
export function TimeFilter({
  selectedTime,
  onTimeChange,
}: {
  /** 選択中の時刻（HH:mm形式） */
  selectedTime: string;
  /** 時刻変更時のコールバック */
  onTimeChange: (time: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#1e1b3a]/90 backdrop-blur-sm border border-yellow-400/20 rounded-lg shadow-lg">
      <label
        htmlFor="time-filter"
        className="text-sm font-medium text-white whitespace-nowrap"
      >
        営業時刻
      </label>
      <select
        id="time-filter"
        value={selectedTime}
        onChange={(event) => onTimeChange(event.target.value)}
        className="flex-1 min-w-0 h-9 px-3 bg-[#1d2c4d] border border-yellow-400/30 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400"
      >
        {TIME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
