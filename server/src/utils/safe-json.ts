/**
 * JSONレスポンスを安全にパースし、失敗しても例外を投げない。
 *
 * @example
 * ```ts
 * const data = await safeJson<{ ok: boolean }>({
 *   response: new Response('{"ok":true}')
 * });
 * console.log(data?.ok); // true
 * ```
 */
export async function safeJson<T>({
  response,
}: {
  response: Response;
}): Promise<T | undefined> {
  try {
    return (await response.clone().json()) as T;
  } catch (error) {
    return undefined;
  }
}
