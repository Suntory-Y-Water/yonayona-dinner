import type {
  PlacesAPIError,
  PlacesSearchResponse,
  Result,
  SearchNearbyRequest,
} from "yonayona-dinner-shared";
import type { IPlacesRepository } from "../repositories/interfaces/places-repository.interface";

/**
 * 店舗検索ユースケース。
 *
 * @example
 * ```ts
 * const usecase = new SearchNearbyPlacesUsecase({ repository });
 * const result = await usecase.execute({
 *   location: { lat: 35.0, lng: 139.0 },
 *   radius: 500,
 * });
 * console.log(result.success);
 * ```
 */
export class SearchNearbyPlacesUsecase {
  private readonly repository: IPlacesRepository;

  constructor({ repository }: { repository: IPlacesRepository }) {
    this.repository = repository;
  }

  async execute(
    request: SearchNearbyRequest,
  ): Promise<Result<PlacesSearchResponse, PlacesAPIError>> {
    const validationError = validateSearchNearbyRequest(request);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const searchResult = await this.repository.searchNearby(request);
    if (!searchResult.success) {
      return searchResult;
    }

    return {
      success: true,
      data: { places: searchResult.data },
    };
  }
}

/**
 * SearchNearbyRequestの事前条件を検証する。
 *
 * @example
 * ```ts
 * const error = validateSearchNearbyRequest({
 *   location: { lat: 100, lng: 0 },
 *   radius: 10,
 * });
 * console.log(error?.type);
 * ```
 */
function validateSearchNearbyRequest(
  request: SearchNearbyRequest,
): PlacesAPIError | undefined {
  if (!isNumberFinite(request.location.lat)) {
    return buildInvalidRequestError("Latitude must be a finite number.");
  }

  if (!isNumberWithin({ value: request.location.lat, min: -90, max: 90 })) {
    return buildInvalidRequestError("Latitude must be between -90 and 90.");
  }

  if (!isNumberFinite(request.location.lng)) {
    return buildInvalidRequestError("Longitude must be a finite number.");
  }

  if (!isNumberWithin({ value: request.location.lng, min: -180, max: 180 })) {
    return buildInvalidRequestError("Longitude must be between -180 and 180.");
  }

  if (!isNumberFinite(request.radius)) {
    return buildInvalidRequestError("Radius must be a finite number.");
  }

  if (!isNumberWithin({ value: request.radius, min: 1, max: 50000 })) {
    return buildInvalidRequestError(
      "Radius must be between 1 and 50000 meters.",
    );
  }

  return undefined;
}

/**
 * INVALID_REQUESTエラーを作成する。
 *
 * @example
 * ```ts
 * const error = buildInvalidRequestError("Invalid");
 * console.log(error.message);
 * ```
 */
function buildInvalidRequestError(message: string): PlacesAPIError {
  return {
    type: "INVALID_REQUEST",
    message,
  };
}

/**
 * 数値が指定レンジ内か判定する。
 *
 * @example
 * ```ts
 * const ok = isNumberWithin({ value: 5, min: 1, max: 10 });
 * console.log(ok);
 * ```
 */
function isNumberWithin({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}): boolean {
  return value >= min && value <= max;
}

/**
 * 値が有限な数値か判定する。
 *
 * @example
 * ```ts
 * const ok = isNumberFinite(10);
 * console.log(ok);
 * ```
 */
function isNumberFinite(value: number): boolean {
  return Number.isFinite(value);
}
