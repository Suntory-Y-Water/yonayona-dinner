import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { cache } from "hono/cache";
import { cors } from "hono/cors";
import type {
  Env,
  PlacesAPIError,
  SearchNearbyRequest,
} from "yonayona-dinner-shared";
import { SearchNearbyRequestSchema } from "yonayona-dinner-shared";
import { SearchPlacesLoader } from "./loaders/search-places-loader";

type AppEnv = {
  Bindings: Env;
  Variables: {
    searchNearbyRequest: SearchNearbyRequest;
  };
};

const app = new Hono<AppEnv>();

app.use(cors());

app.get("/", async (c) => {
  return c.text("Hello Hono!");
});

app.post(
  "/api/places/search",
  zValidator(
    "json",
    SearchNearbyRequestSchema,
    (result, c: Context<AppEnv>) => {
      if (!result.success) {
        const message = formatValidationError(result.error.issues);
        return c.json({ message }, 400);
      }
      c.set("searchNearbyRequest", result.data);
    },
  ),
  cache({
    cacheName: "yonayona-dinner-places",
    cacheControl: "max-age=300",
    keyGenerator: (c: Context<AppEnv>) => {
      const request = c.var.searchNearbyRequest;
      const lat = request.location.lat.toFixed(3);
      const lng = request.location.lng.toFixed(3);
      return `places:${lat}:${lng}:${request.radius}`;
    },
  }),
  async (c) => {
    const { GOOGLE_PLACES_API_KEY } = env<Env>(c);
    const loader = new SearchPlacesLoader(GOOGLE_PLACES_API_KEY);
    const result = await loader.run(c.var.searchNearbyRequest);
    if (result.success) {
      return c.json(result.data);
    }
    return c.json(
      { message: result.error.message },
      mapErrorToStatus(result.error),
    );
  },
);

export { app };

export default {
  port: 8787,
  fetch: app.fetch,
};

type ErrorStatusCode = 400 | 401 | 429 | 500 | 503;

/**
 * PlacesAPIErrorからHTTPステータスコードを導出する。
 *
 * @example
 * ```ts
 * const status = mapErrorToStatus({ type: "RATE_LIMIT", message: "多すぎるリクエスト" });
 * console.log(status);
 * ```
 */
function mapErrorToStatus(error: PlacesAPIError): ErrorStatusCode {
  if (error.type === "INVALID_REQUEST") {
    return 400;
  }
  if (error.type === "AUTH_ERROR") {
    return 401;
  }
  if (error.type === "RATE_LIMIT") {
    return 429;
  }
  if (error.type === "SERVICE_UNAVAILABLE") {
    return 503;
  }
  return 500;
}

/**
 * Zodエラーを整形してメッセージにする。
 *
 * @example
 * ```ts
 * const message = formatValidationError(zodError);
 * console.log(message);
 * ```
 */
function formatValidationError(
  issues: ReadonlyArray<{ message: string }>,
): string {
  const fieldMessages = issues.map((issue) => issue.message);
  return fieldMessages.join("; ") || "リクエストボディが不正です";
}
