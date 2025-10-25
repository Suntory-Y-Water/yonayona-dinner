import { beforeEach, describe, expect, it, mock } from "bun:test";
import { checkPermission, getCurrentLocation } from "./geolocation-service";

describe("GeolocationService", () => {
  beforeEach(() => {
    // モックをリセット
    mock.restore();
  });

  describe("getCurrentLocation", () => {
    it("位置情報取得成功時、緯度・経度を返す", async () => {
      // モック設定
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 35.6812,
          longitude: 139.7671,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({
            latitude: 35.6812,
            longitude: 139.7671,
            accuracy: 100,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          }),
        },
        timestamp: Date.now(),
        toJSON: () => ({
          coords: {
            latitude: 35.6812,
            longitude: 139.7671,
            accuracy: 100,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        }),
      };

      globalThis.navigator = {
        ...globalThis.navigator,
        geolocation: {
          getCurrentPosition: mock((success: PositionCallback) =>
            success(mockPosition),
          ),
        } as any,
      };

      // 実行
      const result = await getCurrentLocation();

      // 検証
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lat).toBe(35.6812);
        expect(result.data.lng).toBe(139.7671);
      }
    });

    it("位置情報パーミッション拒否時、PERMISSION_DENIEDエラーを返す", async () => {
      // モック設定
      const mockError: GeolocationPositionError = {
        code: 1, // PERMISSION_DENIED
        message: "User denied geolocation",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      globalThis.navigator = {
        ...globalThis.navigator,
        geolocation: {
          getCurrentPosition: mock(
            (_: PositionCallback, error?: PositionErrorCallback) =>
              error?.(mockError),
          ),
        } as any,
      };

      // 実行
      const result = await getCurrentLocation();

      // 検証
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("PERMISSION_DENIED");
        expect(result.error.message).toContain("denied");
      }
    });

    it("位置情報取得不可時、POSITION_UNAVAILABLEエラーを返す", async () => {
      // モック設定
      const mockError: GeolocationPositionError = {
        code: 2, // POSITION_UNAVAILABLE
        message: "Position unavailable",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      globalThis.navigator = {
        ...globalThis.navigator,
        geolocation: {
          getCurrentPosition: mock(
            (_: PositionCallback, error?: PositionErrorCallback) =>
              error?.(mockError),
          ),
        } as any,
      };

      // 実行
      const result = await getCurrentLocation();

      // 検証
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("POSITION_UNAVAILABLE");
      }
    });

    it("タイムアウト時、TIMEOUTエラーを返す", async () => {
      // モック設定
      const mockError: GeolocationPositionError = {
        code: 3, // TIMEOUT
        message: "Timeout",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      globalThis.navigator = {
        ...globalThis.navigator,
        geolocation: {
          getCurrentPosition: mock(
            (_: PositionCallback, error?: PositionErrorCallback) =>
              error?.(mockError),
          ),
        } as any,
      };

      // 実行
      const result = await getCurrentLocation();

      // 検証
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("TIMEOUT");
      }
    });

    it("Geolocation APIが利用できない場合、NOT_SUPPORTEDエラーを返す", async () => {
      // モック設定
      const originalGeolocation = globalThis.navigator?.geolocation;
      globalThis.navigator = {
        ...globalThis.navigator,
        geolocation: undefined as any,
      };

      // 実行
      const result = await getCurrentLocation();

      // 検証
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("NOT_SUPPORTED");
      }

      // 後片付け
      if (originalGeolocation) {
        globalThis.navigator = {
          ...globalThis.navigator,
          geolocation: originalGeolocation,
        };
      }
    });

    it("座標が有効範囲内（緯度: -90~90、経度: -180~180）であることを確認", async () => {
      // モック設定
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 90,
          longitude: 180,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({
            latitude: 90,
            longitude: 180,
            accuracy: 100,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          }),
        },
        timestamp: Date.now(),
        toJSON: () => ({
          coords: {
            latitude: 90,
            longitude: 180,
            accuracy: 100,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        }),
      };

      globalThis.navigator = {
        ...globalThis.navigator,
        geolocation: {
          getCurrentPosition: mock((success: PositionCallback) =>
            success(mockPosition),
          ),
        } as any,
      };

      // 実行
      const result = await getCurrentLocation();

      // 検証
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lat).toBeGreaterThanOrEqual(-90);
        expect(result.data.lat).toBeLessThanOrEqual(90);
        expect(result.data.lng).toBeGreaterThanOrEqual(-180);
        expect(result.data.lng).toBeLessThanOrEqual(180);
      }
    });
  });

  describe("checkPermission", () => {
    it("パーミッション許可済みの場合、grantedを返す", async () => {
      // モック設定
      globalThis.navigator = {
        ...globalThis.navigator,
        permissions: {
          query: mock(async () => ({ state: "granted" as PermissionState })),
        } as any,
      };

      // 実行
      const state = await checkPermission();

      // 検証
      expect(state).toBe("granted");
    });

    it("パーミッション拒否の場合、deniedを返す", async () => {
      // モック設定
      globalThis.navigator = {
        ...globalThis.navigator,
        permissions: {
          query: mock(async () => ({ state: "denied" as PermissionState })),
        } as any,
      };

      // 実行
      const state = await checkPermission();

      // 検証
      expect(state).toBe("denied");
    });

    it("パーミッション未確認の場合、promptを返す", async () => {
      // モック設定
      globalThis.navigator = {
        ...globalThis.navigator,
        permissions: {
          query: mock(async () => ({ state: "prompt" as PermissionState })),
        } as any,
      };

      // 実行
      const state = await checkPermission();

      // 検証
      expect(state).toBe("prompt");
    });

    it("Permissions APIが利用できない場合、promptを返す", async () => {
      // モック設定
      const originalPermissions = globalThis.navigator?.permissions;
      globalThis.navigator = {
        ...globalThis.navigator,
        permissions: undefined as any,
      };

      // 実行
      const state = await checkPermission();

      // 検証
      expect(state).toBe("prompt");

      // 後片付け
      if (originalPermissions) {
        globalThis.navigator = {
          ...globalThis.navigator,
          permissions: originalPermissions,
        };
      }
    });
  });
});
