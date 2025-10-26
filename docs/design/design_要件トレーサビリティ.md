# 要件トレーサビリティ

## 要件トレーサビリティ

| 要件ID | 要件概要 | コンポーネント | インターフェース | フロー参照 |
|--------|----------|--------------|--------------|----------|
| 1.1 | 位置情報パーミッション要求 | GeolocationService | `requestLocation()` | ユーザーフロー |
| 1.2 | 現在地中心の地図表示 | MapManager | `initializeMap()` | ユーザーフロー |
| 1.3 | 位置情報拒否時のガイダンス | ErrorHandler | `handleGeolocationError()` | エラーフロー |
| 1.4 | 起動から2秒以内の表示 | MapManager, PlacesService | - | パフォーマンス最適化 |
| 1.5 | ダークテーマ適用 | MapStyles | `DARK_THEME_STYLES` | - |
| 2.1 | 半径800m以内の店舗検索 | PlacesService | `searchNearby()` | ユーザーフロー |
| 2.2 | 営業時間情報の存在確認 | OpeningHoursService (Domain) | `isOpenAt()` | ユーザーフロー |
| 2.3 | 営業中判定 | OpeningHoursService (Domain) | `isOpenAt()` | ユーザーフロー |
| 2.4 | 営業時間情報なしの除外 | OpeningHoursService (Domain) | `filterOpenPlaces()` | ユーザーフロー |
| 2.5 | 24時跨ぎ営業時間対応 | OpeningHoursService (Domain) | `isOpenAt()` | ユーザーフロー |
| 2.6 | 複数営業時間スロット対応 | OpeningHoursService (Domain) | `isOpenAt()` | ユーザーフロー |
| 3.1 | デフォルト23:00基準フィルタ | TimeFilterUI | `defaultFilterTime` | - |
| 3.2 | 15分刻み時間調整UI | TimeFilterUI | `onTimeChange()` | - |
| 3.3 | 時間帯変更時の再検索 | PlaceSearchController | `updateTimeFilter()` | - |
| 3.4 | プリセット時間帯表示 | TimeFilterUI | `PRESET_TIMES` | - |
| 4.1 | ピンタップで詳細パネル表示 | PlaceDetailPanel | `showDetail()` | ユーザーフロー |
| 4.2-4.5 | 店名/住所/営業時間表示 | PlaceDetailPanel | `renderDetail()` | ユーザーフロー |
| 4.6 | 閉店までの残り時間計算 | OpeningHoursService (Domain) | `calculateRemainingMinutes()` | ユーザーフロー |
| 5.1-5.3 | Googleマップ起動リンク | NavigationLink | `openGoogleMaps()` | ユーザーフロー |
| 6.1-6.3 | 検索結果0件時の緩和 | SearchRelaxation | `relaxSearchCriteria()` | エラーフロー |
| 7.1-7.3 | エラーハンドリング | ErrorHandler | `handleAPIError()` | エラーフロー |
| 8.1-8.4 | モバイル最適化 | ResponsiveUI | - | - |
| 9.1-9.4 | キャッシング | Honoキャッシュミドルウェア | `cache()` | ユーザーフロー |
| 10.1-10.3 | データプライバシー | GeolocationService | - | - |
| 11.1-11.4 | ブランドとUI | MapStyles, ThemeConfig | - | - |
| 12.1-12.5 | 計測とモニタリング | AnalyticsService | `trackEvent()` | - |
