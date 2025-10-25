import z from "zod";

/**
 * 近くの場所を検索するためのリクエストスキーマ
 * - 緯度(lat): -90から90の範囲の有限数
 * - 経度(lng): -180から180の範囲の有限数
 * - 半径(radius): 1から50000の範囲の有限数（メートル単位）
 */
export const searchNearbySchema = z.object({
  location: z.object({
    lat: z
      .number()
      .refine(
        (value) => Number.isFinite(value),
        "緯度は有限数である必要があります",
      )
      .min(-90)
      .max(90),
    lng: z
      .number()
      .refine(
        (value) => Number.isFinite(value),
        "経度は有限数である必要があります",
      )
      .min(-180)
      .max(180),
  }),
  radius: z
    .number()
    .refine(
      (value) => Number.isFinite(value),
      "半径は有限数である必要があります",
    )
    .min(1)
    .max(50000),
});
