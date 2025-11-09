import type { JSX } from "react";

/**
 * アプリケーションのロゴコンポーネント。
 *
 * 白文字の「よなよなディナー」テキストに、
 * 右上にビールの泡が溢れる意匠をSVGで表現。
 * 装飾を最小限にし、静かで落ち着いたトーンを維持。
 *
 * @example
 * ```tsx
 * <Logo />
 * ```
 */
export function Logo(): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <h1 className="text-xl font-bold text-white tracking-wide">
        よなよなディナー
      </h1>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ビールの泡アイコン"
      >
        <title>ビールの泡</title>
        {/* 泡1（大） */}
        <circle cx="12" cy="8" r="3" fill="#FFD700" opacity="0.9" />
        {/* 泡2（中） */}
        <circle cx="8" cy="6" r="2" fill="#FFD700" opacity="0.7" />
        {/* 泡3（小） */}
        <circle cx="16" cy="6" r="1.5" fill="#FFD700" opacity="0.6" />
        {/* 泡4（小） */}
        <circle cx="14" cy="4" r="1" fill="#FFD700" opacity="0.5" />
      </svg>
    </div>
  );
}
