import type {
  FilteredPlacesResponse,
  PlacesAPIError,
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
 * const result = await loader.run({
 *   location: { lat: 35, lng: 139 },
 *   radius: 500,
 *   targetTime: new Date("2025-10-27T23:00:00.000Z"),
 * });
 * console.log(result.success);
 * ```
 */
export class SearchPlacesLoader {
  private readonly usecase: SearchNearbyPlacesUsecase;

  constructor(key: string) {
    const repository = new GooglePlacesRepository({
      apiKey: key,
    });
    this.usecase = new SearchNearbyPlacesUsecase({ repository });
  }

  async run(
    request: SearchNearbyRequest,
  ): Promise<Result<FilteredPlacesResponse, PlacesAPIError>> {
    return this.usecase.execute(request);
  }
}
