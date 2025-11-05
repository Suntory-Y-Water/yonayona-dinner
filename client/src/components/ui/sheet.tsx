import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * シートの表示状態を管理するルートコンポーネント。
 *
 * @param props Radix Sheetのルートに渡すプロパティ
 * @returns シートのルート要素
 *
 * @example
 * ```tsx
 * <Sheet open={true} onOpenChange={(open) => console.log(open)}>
 *   <SheetContent side="bottom">内容</SheetContent>
 * </Sheet>
 * ```
 */
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

/**
 * シートを開くためのトリガーコンポーネント。
 *
 * @param props トリガーに渡すプロパティ
 * @returns シートを開くトリガー要素
 *
 * @example
 * ```tsx
 * <Sheet>
 *   <SheetTrigger>詳細を開く</SheetTrigger>
 *   <SheetContent side="bottom">内容</SheetContent>
 * </Sheet>
 * ```
 */
function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/**
 * シートを閉じるためのコンポーネント。
 *
 * @param props 閉じる操作に使用するプロパティ
 * @returns シートを閉じるための要素
 *
 * @example
 * ```tsx
 * <Sheet>
 *   <SheetContent side="bottom">
 *     <SheetClose>閉じる</SheetClose>
 *   </SheetContent>
 * </Sheet>
 * ```
 */
function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

/**
 * ポータルとしてシート要素をDOMに挿入するコンポーネント。
 *
 * @param props ポータルに渡すプロパティ
 * @returns ポータル要素
 *
 * @example
 * ```tsx
 * <SheetPortal>
 *   <div>ポータル経由で描画されます</div>
 * </SheetPortal>
 * ```
 */
function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/**
 * シート表示時に背面へ描画するオーバーレイ。
 *
 * @param props オーバーレイに渡すプロパティ
 * @returns 背景オーバーレイ要素
 *
 * @example
 * ```tsx
 * <SheetOverlay className="bg-black/70" />
 * ```
 */
function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

/**
 * シート本体のコンテンツ領域。
 *
 * @param props コンテンツの配置に必要なプロパティ
 * @returns シートのコンテンツ要素
 *
 * @example
 * ```tsx
 * <SheetContent side="bottom">
 *   <div>ボトムシートの内容</div>
 * </SheetContent>
 * ```
 */
function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

/**
 * シート内のヘッダー領域。
 *
 * @param props ヘッダーに渡すプロパティ
 * @returns ヘッダー要素
 *
 * @example
 * ```tsx
 * <SheetHeader>
 *   <SheetTitle>タイトル</SheetTitle>
 * </SheetHeader>
 * ```
 */
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

/**
 * シート内のフッター領域。
 *
 * @param props フッターに渡すプロパティ
 * @returns フッター要素
 *
 * @example
 * ```tsx
 * <SheetFooter>
 *   <button type="button">閉じる</button>
 * </SheetFooter>
 * ```
 */
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

/**
 * シート内のタイトルテキスト。
 *
 * @param props タイトルに渡すプロパティ
 * @returns タイトル要素
 *
 * @example
 * ```tsx
 * <SheetTitle>詳細情報</SheetTitle>
 * ```
 */
function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

/**
 * シート内の説明テキスト。
 *
 * @param props 説明文に渡すプロパティ
 * @returns 説明テキスト要素
 *
 * @example
 * ```tsx
 * <SheetDescription>住所や補足情報を表示します。</SheetDescription>
 * ```
 */
function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
