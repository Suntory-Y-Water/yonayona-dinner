# パフォーマンスとスケール

## パフォーマンスとスケーラビリティ

### ターゲットメトリクス

**パフォーマンス目標**:

- **初回描画時間（FCP）**: < 1.5秒
- **地図表示完了時間（LCP）**: < 2.0秒
- **APIレスポンスタイム**: p95 < 500ms
- **マーカー配置完了時間**: < 1.0秒（20件）
- **時間調整UI応答時間**: < 100ms

**計測戦略**:

```typescript
// Web Vitals計測
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(metric => analytics.trackEvent('web_vitals', { name: 'CLS', value: metric.value }));
getFID(metric => analytics.trackEvent('web_vitals', { name: 'FID', value: metric.value }));
getFCP(metric => analytics.trackEvent('web_vitals', { name: 'FCP', value: metric.value }));
getLCP(metric => analytics.trackEvent('web_vitals', { name: 'LCP', value: metric.value }));
getTTFB(metric => analytics.trackEvent('web_vitals', { name: 'TTFB', value: metric.value }));
```

### スケーリングアプローチ

**水平スケーリング**:

- **Cloudflare Workers**: 自動スケーリング、リクエスト数に応じてインスタンス増加
- **Cache API**: グローバルエッジネットワークでキャッシュ配信、低レイテンシ
- **Cloudflare Pages**: エッジでの静的コンテンツ配信、CDNキャッシング

**垂直スケーリング**:

- MVP段階では不要（Cloudflare Workersは制限内で自動スケール）

### キャッシング戦略

**多層キャッシング**:

1. **ブラウザキャッシュ（Session Storage）**:
   - 検索結果を5分間キャッシュ
   - 同一検索条件での再検索をスキップ

2. **Web Standards Cache API（Honoミドルウェア）**:
   - サーバーサイドで検索結果を自動キャッシュ
   - TTL: 5分間（`Cache-Control: max-age=300`）
   - Cloudflare Workersのグローバルエッジネットワークで低レイテンシ
   - キャッシュキー: 位置情報（lat, lng）と半径の組み合わせ

3. **Google Maps APIキャッシュ**:
   - タイルデータはGoogle CDNでキャッシュ
   - Places APIレスポンスはHonoキャッシュミドルウェアでキャッシュ

**キャッシュ無効化戦略**:

- TTL経過後に自動無効化（Cache APIのデフォルト動作）
- 手動無効化なし（ユーザーは時間調整UIで再検索可能）
- Cloudflare WorkersはCache-Controlヘッダーを尊重し、自動的にキャッシュ管理

### 最適化テクニック

**フロントエンド最適化**:

1. **コード分割**:

```typescript
// 遅延ロード
const PlaceDetailPanel = lazy(() => import('./components/PlaceDetailPanel'));
const TimeFilterUI = lazy(() => import('./components/TimeFilterUI'));
```

2. **画像最適化**:
   - SVGアイコンの使用（lucide-react）
   - 画像なし（地図のみ）

3. **バンドルサイズ削減**:
   - Tree-shaking有効化（Viteデフォルト）
   - date-fnsの個別インポート

```typescript
import { isWithinInterval, addHours } from 'date-fns';
```

**バックエンド最適化**:

1. **Field Mask最適化**:

```typescript
// 必要最小限のフィールドのみ取得
const fieldMask = 'places.displayName,places.location,places.currentOpeningHours,places.formattedAddress';
```

2. **リクエストバッチング**:
   - クライアントサイドで複数検索を統合（将来拡張）

3. **接続プーリング**:
   - Cloudflare Workersは自動的に接続を管理
