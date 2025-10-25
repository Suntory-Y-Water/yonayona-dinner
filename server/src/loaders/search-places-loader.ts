import type {
  Env,
  PlacesAPIError,
  PlacesSearchResponse,
  Result,
  SearchNearbyRequest,
} from "yonayona-dinner-shared";
import { GooglePlacesRepository } from "../repositories/google-places.repository";
import { SearchNearbyPlacesUsecase } from "../usecases/search-nearby-places.usecase";

/**
 * Places検索を実行するLoader。
 *
 * @example
 * ```ts
 * const loader = new SearchPlacesLoader({ GOOGLE_PLACES_API_KEY: "key" });
 * const result = await loader.run({ location: { lat: 35, lng: 139 }, radius: 500 });
 * console.log(result.success);
 * ```
 */
export class SearchPlacesLoader {
  private readonly usecase: SearchNearbyPlacesUsecase;

  constructor(env: Env) {
    const repository = new GooglePlacesRepository({
      apiKey: env.GOOGLE_PLACES_API_KEY,
    });
    this.usecase = new SearchNearbyPlacesUsecase({ repository });
  }

  async run(
    request: SearchNearbyRequest,
  ): Promise<Result<PlacesSearchResponse, PlacesAPIError>> {
    return this.usecase.execute(request);
  }
}
