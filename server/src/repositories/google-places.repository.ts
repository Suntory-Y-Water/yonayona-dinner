import type {
  Place,
  PlacesAPIError,
  Result,
  SearchNearbyRequest,
} from "yonayona-dinner-shared";
import {
  extractErrorMessage,
  mapGooglePlaceToPlace,
  mapHttpStatusToPlacesError,
  mapNetworkErrorToPlacesError,
} from "../domain/places/places-mapper";
import { safeJson } from "../utils/safe-json";
import type { IPlacesRepository } from "./interfaces/places-repository.interface";

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchNearby";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.currentOpeningHours",
  "places.formattedAddress",
  "places.rating",
].join(",");

type PlacesApiSuccessResponse = {
  places?: GooglePlace[];
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  currentOpeningHours?: {
    openNow?: boolean;
    periods?: {
      open?: { day?: number; hour?: number; minute?: number };
      close?: { day?: number; hour?: number; minute?: number };
    }[];
    weekdayDescriptions?: string[];
  };
  rating?: number;
};

/**
 * Google Places APIを呼び出すRepository。
 *
 * @example
 * ```ts
 * const repository = new GooglePlacesRepository({ apiKey: "test-key" });
 * const result = await repository.searchNearby({
 *   location: { lat: 35.681236, lng: 139.767125 },
 *   radius: 800,
 * });
 * console.log(result.success);
 * ```
 */
export class GooglePlacesRepository implements IPlacesRepository {
  private readonly apiKey: string;

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
  }

  async searchNearby({
    location,
    radius,
  }: SearchNearbyRequest): Promise<Result<Place[], PlacesAPIError>> {
    const body = JSON.stringify({
      includedTypes: ["restaurant", "cafe", "bar"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng,
          },
          radius,
        },
      },
    });

    try {
      const response = await fetch(PLACES_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body,
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage({
          response,
        });
        return {
          success: false,
          error: mapHttpStatusToPlacesError({
            status: response.status,
            message: errorMessage,
          }),
        };
      }

      const payload =
        (await safeJson<PlacesApiSuccessResponse>({ response })) ?? {};
      const places = Array.isArray(payload.places)
        ? payload.places.map((raw) => mapGooglePlaceToPlace({ raw }))
        : [];
      return { success: true, data: places };
    } catch (error) {
      return { success: false, error: mapNetworkErrorToPlacesError({ error }) };
    }
  }
}
