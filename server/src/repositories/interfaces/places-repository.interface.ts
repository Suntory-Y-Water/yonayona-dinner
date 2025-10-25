import type {
  Place,
  PlacesAPIError,
  Result,
  SearchNearbyRequest,
} from "yonayona-dinner-shared";

export type IPlacesRepository = {
  searchNearby({
    location,
    radius,
  }: SearchNearbyRequest): Promise<Result<Place[], PlacesAPIError>>;
};
