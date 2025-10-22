# エラーハンドリング戦略

## エラーハンドリング

### Result型パターン

本プロジェクトでは、TypeScriptの標準機能のみを使用したシンプルなResult型を採用します。

#### Result型定義

```typescript
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };
```

#### 自作する理由

- **軽量性**: 外部依存なし、必要最小限の型定義のみ
- **プロジェクト固有の要件**: 詳細なエラー型定義（MapError, PlacesAPIError等）に対応
- **学習コスト削減**: シンプルな構造でチーム全体が理解しやすい
- **TypeScript標準機能のみ**: ビルドサイズへの影響なし、追加ライブラリ不要

#### 既存ライブラリを採用しない理由

**検討したライブラリ**: neverthrow, ts-results, oxide.ts

**不採用の理由**:
- **過度な機能**: `map()`, `andThen()`, `unwrap()`等の関数型メソッドは本プロジェクトでは不要
- **依存関係の増加**: MVP段階では外部依存を最小化したい
- **チームの習熟度**: 関数型プログラミングの知識を前提としない設計
- **バンドルサイズ**: クライアントバンドルに含まれる場合のサイズ増加を避ける
- **TypeScriptネイティブで十分**: Discriminated Unionsで型安全性は確保可能

**トレードオフ**:
- **利点**: シンプル、軽量、学習コスト低、依存関係なし
- **欠点**: 関数型メソッド（map, flatMap等）は自前実装が必要（本プロジェクトでは不要と判断）

#### 使用例

```typescript
// 関数定義
function displayMarkers({
  map,
  places
}: {
  map: google.maps.Map;
  places: Place[];
}): Result<void, MarkerError> {
  try {
    places.forEach(place => {
      new google.maps.Marker({
        position: place.location,
        map
      });
    });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'MARKER_CREATION_FAILED',
        message: error.message
      }
    };
  }
}

// 呼び出し側
const result = displayMarkers({ map, places });
if (result.success) {
  console.log('マーカー配置成功');
} else {
  // TypeScriptがresult.errorの型を推論
  handleMarkerError(result.error);
}
```

### エラー戦略

本システムでは、エラーを以下の3つのカテゴリに分類し、それぞれに適切な処理と回復メカニズムを適用します。

**エラーカテゴリと対応戦略**:

1. **ユーザーエラー（4xx相当）**: バリデーション、ガイダンス表示、手動修正を促す
2. **システムエラー（5xx相当）**: リトライ、フォールバック、エラーメッセージ表示
3. **ビジネスロジックエラー（422相当）**: 検索条件の自動緩和、代替案の提示

### エラーカテゴリと対応

#### ユーザーエラー（4xx）

**位置情報パーミッション拒否**:

```typescript
// エラーハンドリング
if (error.type === 'PERMISSION_DENIED') {
  showErrorMessage({
    title: '位置情報が必要です',
    message: '現在地周辺の店舗を検索するには、位置情報パーミッションを許可してください。',
    actions: [
      { label: '設定を開く', onClick: () => openSettings() },
      { label: '手動で場所を設定', onClick: () => showManualLocationPicker() }
    ]
  });
}
```

**無効な検索パラメータ**:

```typescript
// バリデーションエラー
if (radius < 1 || radius > 50000) {
  showFieldError({
    field: 'radius',
    message: '検索範囲は1〜50000メートルの範囲で指定してください。'
  });
}
```

#### システムエラー（5xx）

**Places API呼び出し失敗**:

```typescript
// リトライロジック
async function searchWithRetry(
  request: SearchNearbyRequest,
  maxRetries = 3
): Promise<Result<Place[], PlacesAPIError>> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await placesService.searchNearby(
      request.location,
      request.radius
    );

    if (result.success) {
      return result;
    }

    // レート制限エラーの場合、指定時間待機
    if (result.error.type === 'RATE_LIMIT') {
      if (attempt < maxRetries) {
        await delay(result.error.retryAfter);
        continue;
      }
    }

    // ネットワークエラーの場合、指数バックオフ
    if (result.error.type === 'NETWORK_ERROR') {
      if (attempt < maxRetries) {
        await delay(1000 * Math.pow(2, attempt - 1));
        continue;
      }
    }

    // その他のエラーは即座に返す
    return result;
  }
}
```

**Google Maps API読み込み失敗**:

```typescript
// フォールバックUI
try {
  await mapManager.initializeMap(mapElement, center);
} catch (error) {
  showFallbackUI({
    message: '地図の読み込みに失敗しました。',
    actions: [
      { label: '再読み込み', onClick: () => location.reload() }
    ]
  });
}
```

**位置情報取得タイムアウト**:

```typescript
// タイムアウトエラー処理
const GEOLOCATION_TIMEOUT = 10000; // 10秒

try {
  const location = await geolocationService.getCurrentLocation({
    timeout: GEOLOCATION_TIMEOUT
  });
} catch (error) {
  if (error.type === 'TIMEOUT') {
    showErrorMessage({
      title: '位置情報の取得に時間がかかっています',
      message: '手動で場所を設定するか、しばらく待ってから再試行してください。',
      actions: [
        { label: '手動設定', onClick: () => showManualLocationPicker() },
        { label: '再試行', onClick: () => retryGetLocation() }
      ]
    });
  }
}
```

#### ビジネスロジックエラー（422）

**検索結果0件時の自動緩和**:

```typescript
// 検索条件の段階的緩和
async function searchWithRelaxation(
  initialCriteria: SearchCriteria
): Promise<Place[]> {
  let criteria = initialCriteria;

  // Step 1: 初回検索
  let places = await searchAndFilter(criteria);

  if (places.length === 0) {
    // Step 2: 半径を拡大（800m → 1200m）
    criteria.radius = 1200;
    places = await searchAndFilter(criteria);

    if (places.length === 0) {
      // Step 3: 時間帯を緩和（23:00 → 22:00）
      criteria.targetTime = subHours(criteria.targetTime, 1);
      places = await searchAndFilter(criteria);

      if (places.length === 0) {
        // Step 4: 半径をさらに拡大（1200m → 2000m）
        criteria.radius = 2000;
        places = await searchAndFilter(criteria);

        if (places.length === 0) {
          // すべての緩和策を実行しても結果0件
          showNoResultsMessage({
            message: '周辺に営業中の店舗が見つかりませんでした。',
            suggestion: '時間帯や場所を変更して再度検索してください。'
          });
        }
      }
    }
  }

  return places;
}
```

**営業時間情報不明店舗の扱い**:

```typescript
// 営業時間情報がない店舗を除外
const placesWithHours = places.filter(place =>
  place.currentOpeningHours && place.currentOpeningHours.periods.length > 0
);

// 除外された店舗数を通知
if (placesWithHours.length < places.length) {
  const excludedCount = places.length - placesWithHours.length;
  showInfoBadge({
    message: `営業時間情報がない店舗${excludedCount}件を除外しました。`
  });
}
```

### モニタリング

**エラートラッキング**:

```typescript
// エラー計測
function trackError(error: AppError) {
  analytics.trackEvent('error', {
    type: error.type,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
}

// エラー発生時に自動トラッキング
try {
  // 処理
} catch (error) {
  trackError(error);
  throw error;
}
```

**ロギング**:

```typescript
// サーバーサイドロギング（Cloudflare Workers）
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      const response = await handleRequest(request, env);

      // 成功ログ
      console.log({
        level: 'info',
        message: 'Request succeeded',
        path: new URL(request.url).pathname,
        status: response.status
      });

      return response;
    } catch (error) {
      // エラーログ
      console.error({
        level: 'error',
        message: 'Request failed',
        error: error.message,
        stack: error.stack,
        path: new URL(request.url).pathname
      });

      throw error;
    }
  }
}
```

**ヘルスモニタリング**:

```typescript
// ヘルスチェックエンドポイント
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      placesAPI: 'operational',
      cache: 'operational'
    }
  });
});
```
