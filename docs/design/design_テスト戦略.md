# テスト戦略

## テスト戦略

### ユニットテスト

**コア関数・モジュールのテスト**:

1. **OpeningHoursFilter.isOpenAt()**
   - 同日営業の判定（例: 11:00-14:00）
   - 24時跨ぎ営業の判定（例: 23:30-翌5:00）
   - 複数営業時間スロットの判定（例: 11:00-14:00と17:00-23:00）
   - 営業時間情報なしの場合の処理

```typescript
describe('OpeningHoursFilter.isOpenAt', () => {
  it('同日営業時間内で営業中と判定', () => {
    const openingHours = {
      periods: [
        {
          open: { day: 1, hour: 11, minute: 0 },
          close: { day: 1, hour: 14, minute: 0 }
        }
      ]
    };
    const targetTime = new Date('2025-10-20T12:00:00'); // 月曜12:00

    expect(isOpenAt(openingHours, targetTime)).toBe(true);
  });

  it('24時跨ぎ営業時間内で営業中と判定', () => {
    const openingHours = {
      periods: [
        {
          open: { day: 1, hour: 23, minute: 30 },
          close: { day: 2, hour: 5, minute: 0 }
        }
      ]
    };
    const targetTime = new Date('2025-10-21T01:00:00'); // 火曜01:00

    expect(isOpenAt(openingHours, targetTime)).toBe(true);
  });
});
```

2. **OpeningHoursFilter.calculateRemainingMinutes()**
   - 閉店までの残り時間計算
   - 24時跨ぎ営業での残り時間計算
   - 営業時間外での`null`返却

3. **GeolocationService.getCurrentLocation()**
   - 位置情報取得成功ケース
   - パーミッション拒否エラーハンドリング
   - タイムアウトエラーハンドリング

### インテグレーションテスト

**クロスコンポーネントフロー**:

1. **店舗検索フロー（クライアント → サーバー → Places API）**
   - 正常系: 検索リクエスト送信 → Places API呼び出し → 結果返却
   - 異常系: API呼び出し失敗 → エラーハンドリング → リトライ
   - キャッシュヒット時のレスポンス

```typescript
describe('店舗検索フロー', () => {
  it('正常系: 検索結果を取得してマーカー表示', async () => {
    // モック設定
    const mockPlaces = [
      { id: '1', displayName: '深夜食堂', location: { lat: 35.6812, lng: 139.7671 } }
    ];
    vi.spyOn(placesService, 'searchNearby').mockResolvedValue({ success: true, data: mockPlaces });

    // 検索実行
    const controller = new PlaceSearchController();
    await controller.search({ lat: 35.6812, lng: 139.7671 }, 800);

    // 検証
    expect(mapManager.displayMarkers).toHaveBeenCalledWith(mockPlaces);
  });
});
```

2. **営業時間フィルタリング（PlacesService → OpeningHoursFilter → MapManager）**
   - 営業中店舗のみフィルタリング
   - 営業時間情報なし店舗の除外
   - 時間調整UI変更時の再フィルタリング

3. **キャッシュ統合（Honoキャッシュミドルウェア → Cache API）**
   - キャッシュミス時のAPI呼び出しとCache APIへの自動保存
   - キャッシュヒット時のAPI呼び出しスキップ（ミドルウェアが自動処理）
   - TTL経過後のキャッシュ無効化（Cache-Controlヘッダーに基づく自動管理）

4. **エラーリトライフロー（PlacesService → リトライロジック → Places API）**
   - レート制限エラー時の待機とリトライ
   - ネットワークエラー時の指数バックオフ
   - 最大リトライ回数超過時のエラー返却

### E2Eテスト

**クリティカルユーザーパス**:

1. **初回起動から店舗表示までのフロー**
   - アプリ起動 → 位置情報パーミッション許可 → 地図表示 → 店舗検索 → マーカー表示
   - 起動から2秒以内の地図表示を検証

```typescript
describe('E2E: 初回起動フロー', () => {
  it('起動から2秒以内に地図と店舗を表示', async () => {
    const startTime = Date.now();

    // アプリ起動
    await page.goto('http://localhost:5173');

    // 位置情報パーミッション許可
    await page.context().grantPermissions(['geolocation']);

    // 地図とマーカーの表示を待機
    await page.waitForSelector('[data-testid="map"]');
    await page.waitForSelector('[data-testid="place-marker"]');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(2000);
  });
});
```

2. **時間調整UIでの絞り込み**
   - 時間帯変更 → 営業中店舗の再フィルタリング → マーカー更新

3. **マーカークリックから詳細表示**
   - マーカークリック → 詳細パネル表示 → Googleマップリンククリック

4. **検索結果0件時の自動緩和**
   - 検索実行 → 結果0件 → 半径拡大 → 再検索 → 結果表示

### パフォーマンステスト

**負荷テスト**:

1. **同時検索リクエスト（QPS測定）**
   - 100ユーザーが同時に検索リクエスト送信
   - サーバーのレスポンスタイム計測（目標: p95 < 500ms）

2. **大量マーカー表示（UI描画性能）**
   - 100件の店舗マーカーを地図上に配置
   - 描画完了までの時間計測（目標: < 1000ms）

3. **キャッシュヒット率測定**
   - 1000回の検索リクエストでキャッシュヒット率を計測
   - 目標: 70%以上のヒット率

4. **APIコスト最適化検証**
   - 1日の想定ユーザー数（1000ユーザー）でのAPI呼び出し回数を計測
   - キャッシング効果の検証（目標: API呼び出しを50%削減）
