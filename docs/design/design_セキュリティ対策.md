# セキュリティ対策

## セキュリティ考慮事項

### 脅威モデリング

**潜在的な脅威**:

1. **APIキー露出**: クライアントサイドにAPIキーが埋め込まれる
2. **位置情報漏洩**: ユーザーの位置情報がサーバーに送信される
3. **CSRF攻撃**: サーバーエンドポイントへの不正リクエスト
4. **XSS攻撃**: ユーザー入力の不適切なレンダリング
5. **レート制限回避**: 悪意のあるユーザーによる大量リクエスト

### セキュリティ制御

**1. APIキー保護**:

```typescript
// サーバーサイドでAPIキーを管理
export default {
  async fetch(request: Request, env: Env) {
    const apiKey = env.GOOGLE_PLACES_API_KEY; // Workers Secret
    // クライアントに露出しない
  }
}
```

**Google Cloud Console設定**:
- HTTPリファラー制限: `https://yourdomain.com/*`
- API制限: Places API (New), Maps JavaScript API のみ有効化

**2. 位置情報保護**:

```typescript
// 位置情報はクライアント側でのみ使用、サーバーに送信しない
// サーバーへは検索リクエストのみ送信
const searchRequest = {
  location: { lat: currentLocation.lat, lng: currentLocation.lng },
  radius: 800
};
```

**3. CORS設定**:

```typescript
// Honoサーバー
import { cors } from 'hono/cors';

app.use('/api/*', cors({
  origin: 'https://yourdomain.com',
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type']
}));
```

**4. XSS対策**:

```typescript
// Reactの自動エスケープに依存
// dangerouslySetInnerHTMLは使用しない
<div>{place.displayName}</div> // 自動エスケープ
```

**5. レート制限**:

```typescript
// Cloudflare Workers でレート制限
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: env.REDIS,
  limiter: Ratelimit.slidingWindow(10, '1 m') // 1分間に10リクエスト
});

const { success } = await ratelimit.limit(clientIP);
if (!success) {
  return c.json({ error: 'RATE_LIMIT' }, 429);
}
```

### 認証と認可パターン

**MVP段階では認証不要**:

- 公開Webアプリケーション、ログイン不要
- 将来的にお気に入り機能を追加する場合は認証を実装

### データ保護とプライバシー

**個人情報の取り扱い**:

1. **位置情報**: 端末内でのみ使用、サーバーに保存しない
2. **検索履歴**: 保存しない（Session Storageのみ、ブラウザを閉じると削除）
3. **個人識別情報**: 一切収集しない

**Google API規約遵守**:

- Places APIデータの再配布禁止
- キャッシュは5分以内（Google規約準拠）
- 著作権表示の維持

**GDPR/CCPA対応**（将来拡張）:

- 現時点では個人情報を保存しないため、対応不要
- 将来的に会員機能を追加する場合は対応を検討
