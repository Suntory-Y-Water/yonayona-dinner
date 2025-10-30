import { describe, expect, it } from "bun:test";
import { JstTimeStringSchema } from "yonayona-dinner-shared";
import { formatToJstTimeString } from "./time-utils";

describe("formatToJstTimeString", () => {
  it("22時を指定すると同日の22:00:00を返す", () => {
    // Given
    const baseDate = new Date("2025-10-30T12:00:00Z");

    // When
    const result = formatToJstTimeString({ date: baseDate, time: "22:00" });

    // Then
    const expected = JstTimeStringSchema.parse("2025-10-30T22:00:00");
    expect(result).toBe(expected);
  });

  it("23時を指定すると同日の23:00:00を返す", () => {
    // Given
    const baseDate = new Date("2025-10-30T12:00:00Z");

    // When
    const result = formatToJstTimeString({ date: baseDate, time: "23:00" });

    // Then
    const expected = JstTimeStringSchema.parse("2025-10-30T23:00:00");
    expect(result).toBe(expected);
  });

  it("24時を指定すると翌日の00:00:00を返す", () => {
    // Given
    const baseDate = new Date("2025-10-30T12:00:00Z");

    // When
    const result = formatToJstTimeString({ date: baseDate, time: "24:00" });

    // Then
    const expected = JstTimeStringSchema.parse("2025-10-31T00:00:00");
    expect(result).toBe(expected);
  });

  it("結果は必ずyyyy-MM-ddTHH:mm:ss形式になる", () => {
    // Given
    const baseDate = new Date("2025-10-30T12:00:00Z");

    // When
    const result = formatToJstTimeString({ date: baseDate, time: "23:00" });

    // Then
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });
});
