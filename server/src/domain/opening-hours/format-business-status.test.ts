import { describe, expect, test } from "bun:test";
import { formatBusinessStatus } from "./format-business-status";

describe("formatBusinessStatusの挙動", () => {
  test("営業中かつ60分超の場合は時間と分で残り時間を表現する", () => {
    // Given
    const input = { isOpenNow: true, remainingMinutes: 125 };

    // When
    const result = formatBusinessStatus(input);

    // Then
    expect(result).toBe("営業中（あと2時間5分）");
  });

  test("営業中かつ60分未満の場合は分のみで残り時間を表現する", () => {
    // Given
    const input = { isOpenNow: true, remainingMinutes: 45 };

    // When
    const result = formatBusinessStatus(input);

    // Then
    expect(result).toBe("営業中（あと45分）");
  });

  test("営業中でも残り時間が0以下の場合はまもなく閉店メッセージを返す", () => {
    // Given
    const input = { isOpenNow: true, remainingMinutes: 0 };

    // When
    const result = formatBusinessStatus(input);

    // Then
    expect(result).toBe("営業中（まもなく閉店）");
  });

  test("閉店中の場合は閉店中メッセージを返す", () => {
    // Given
    const input = { isOpenNow: false, remainingMinutes: 0 };

    // When
    const result = formatBusinessStatus(input);

    // Then
    expect(result).toBe("閉店中");
  });
});
