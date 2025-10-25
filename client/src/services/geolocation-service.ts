import type { GeolocationError, LatLng, PermissionState, Result } from "shared";

/**
 * 現在地を取得する
 * @param options タイムアウト設定（デフォルト: 10000ms）
 */
export async function getCurrentLocation(options?: {
  timeout?: number;
}): Promise<Result<LatLng, GeolocationError>> {
  const timeout = options?.timeout ?? 10000;

  // Geolocation APIが利用できない場合
  if (!navigator.geolocation) {
    return {
      success: false,
      error: {
        type: "NOT_SUPPORTED",
        message: "Geolocation API is not supported by this browser",
      },
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          data: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({
            success: false,
            error: {
              type: "PERMISSION_DENIED",
              message: "User denied geolocation permission",
            },
          });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          resolve({
            success: false,
            error: {
              type: "POSITION_UNAVAILABLE",
              message: "Position information is unavailable",
            },
          });
        } else if (error.code === error.TIMEOUT) {
          resolve({
            success: false,
            error: {
              type: "TIMEOUT",
              message: "The request to get user location timed out",
            },
          });
        } else {
          resolve({
            success: false,
            error: {
              type: "POSITION_UNAVAILABLE",
              message: error.message,
            },
          });
        }
      },
      {
        timeout,
        enableHighAccuracy: false,
        maximumAge: 0,
      },
    );
  });
}

/**
 * 位置情報パーミッション状態を確認する
 */
export async function checkPermission(): Promise<PermissionState> {
  // Permissions APIが利用できない場合はpromptを返す
  if (!navigator.permissions) {
    return "prompt";
  }

  try {
    const result = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    return result.state as PermissionState;
  } catch {
    // エラー時はpromptを返す
    return "prompt";
  }
}
