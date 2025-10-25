クラウドベースの地図のスタイル設定の JSON スキーマを使用すると、スタイル エディタのインターフェースと同じように JSON を使用して地図をカスタマイズできます。このドキュメントでは、JSON スキーマと JSON スタイル宣言の方法について説明します。

[JSON スキーマをダウンロードする](https://developers.google.com/static/maps/cbms-json-schema.json?hl=ja)

スタイル エディタ内で JSON を使用して地図のスタイルを編集する方法、または地図のスタイルをインポートおよびエクスポートする方法については、 [クラウドベースの地図のスタイル設定で JSON を使用する](https://developers.google.com/maps/documentation/maps-static/cloud-customization/json?hl=ja) をご覧ください。

#### JSON スタイル宣言の例を見る

次の JSON スタイル宣言では、背景色を設定し、スポット、公園、水域のスタイルを定義して、飲食店ラベルを非表示にしています。

```
{
  "variant": "light",
  "styles": [
    {
      "id": "natural.land",
      "geometry": {
        "fillColor": "#f7e3f7"
      }
    },
    {
      "id": "natural.water",
      "geometry": {
        "fillColor": "#d4b2ff"
      },
      "label": {
        "textFillColor": "#3d2163",
        "textStrokeColor": "#f0e1ff"
      }
    },
    {
      "id": "pointOfInterest",
      "label": {
        "pinFillColor": "#e0349a",
        "textFillColor": "#a11e6e",
        "textStrokeColor": "#ffd9f0"
      }
    },
    {
      "id": "pointOfInterest.emergency.hospital",
      "geometry": {
        "fillColor": "#ffe3e3"
      }
    },
    {
      "id": "pointOfInterest.foodAndDrink",
      "label": {
        "visible": false
      }
    },
    {
      "id": "pointOfInterest.recreation.park",
      "geometry": {
        "fillColor": "#f9b9d2"
      }
    }
  ]
}
```

## JSON オブジェクト

JSON スタイル宣言は、最上位のオブジェクトとスタイルルールの配列で構成されます。

- **トップレベルの設定** （省略可）- `backgroundColor` や `variant` などのグローバル スタイル設定。
- **`styles`** - スタイルルールのオブジェクトの配列。次の要素で構成できます。
	- **`id`** - このスタイル変更を適用する地図上の対象物（例: `pointOfInterest.recreation.park` ）を指定できます。
	- **`geometry`** （省略可）- 地図上の対象物の幾何学的要素と適用するスタイルルール（例: `fillColor` ）を指定できます。
	- **`label`** （省略可）- 地図上の対象物のテキストまたはピンのラベルと、適用するスタイルルール（例: `textStrokeColor` ）を指定できます。

## 最上位の設定

次の表のプロパティは、地図のスタイル全体に適用されます。

| **プロパティ** | **型** | **説明** | **例** |
| --- | --- | --- | --- |
| `backgroundColor` | 文字列 | #RRGGBB の 16 進文字列を使用して、地図アプリの背景色をカスタマイズします。この設定では、不透明度の変更はサポートされていません。 | "#002211" |
| `  variant  ` | "light"\|"dark" | ライトモードまたはダークモードを指定します。指定しない場合、デフォルトは「light」です。 | "light" |
| `  monochrome  ` | ブール値 | モノクロを有効にするには、地図のグレー バージョンに `true` を使用します。 | `  true  ` |

## スタイルルール オブジェクト

このセクションでは、地図の対象物をカスタマイズするために `styles` 配列内のスタイルルールのオブジェクトを定義するプロパティについて説明します。各スタイルルールのオブジェクトは、次の要素で構成されている必要があります。

- `id` プロパティ。
- 関連するスタイラー プロパティが定義された `geometry` 要素または `label` 要素。

### id（地図対象物）

`id` プロパティは、スタイル設定する地図のフィーチャーを指定します。プロパティ名は、スタイル エディタの地図の特徴名のキャメルケース バージョンです。

地図上の対象物は、カテゴリツリーを形成します。 `pointOfInterest` などの親対象物のタイプを指定した場合、親対象物に指定したスタイルは、 `pointOfInterest.retail` や `pointOfInterest.lodging` などのすべての子対象物に適用されます。詳しくは、 [地図対象物の階層](https://developers.google.com/maps/documentation/maps-static/cloud-customization/taxonomy?hl=ja#hier) をご覧ください。

#### 使用可能な id プロパティのリスト

使用可能な `id` プロパティは次のとおりです。

- `pointOfInterest`
- `pointOfInterest.emergency`
- `pointOfInterest.emergency.fire`
- `pointOfInterest.emergency.hospital`
- `pointOfInterest.emergency.pharmacy`
- `pointOfInterest.emergency.police`
- `pointOfInterest.entertainment`
- `pointOfInterest.entertainment.arts`
- `pointOfInterest.entertainment.casino`
- `pointOfInterest.entertainment.cinema`
- `pointOfInterest.entertainment.historic`
- `pointOfInterest.entertainment.museum`
- `pointOfInterest.entertainment.themePark`
- `pointOfInterest.entertainment.touristAttraction`
- `pointOfInterest.foodAndDrink`
- `pointOfInterest.foodAndDrink.bar`
- `pointOfInterest.foodAndDrink.cafe`
- `pointOfInterest.foodAndDrink.restaurant`
- `pointOfInterest.foodAndDrink.winery`
- `pointOfInterest.landmark`
- `pointOfInterest.lodging`
- `pointOfInterest.recreation`
- `pointOfInterest.recreation.beach`
- `pointOfInterest.recreation.boating`
- `pointOfInterest.recreation.fishing`
- `pointOfInterest.recreation.golfCourse`
- `pointOfInterest.recreation.hotSpring`
- `pointOfInterest.recreation.natureReserve`
- `pointOfInterest.recreation.park`
- `pointOfInterest.recreation.peak`
- `pointOfInterest.recreation.sportsComplex`
- `pointOfInterest.recreation.sportsField`
- `pointOfInterest.recreation.trailhead`
- `pointOfInterest.recreation.zoo`
- `pointOfInterest.retail`
- `pointOfInterest.retail.grocery`
- `pointOfInterest.retail.shopping`
- `pointOfInterest.service`
- `pointOfInterest.service.atm`
- `pointOfInterest.service.bank`
- `pointOfInterest.service.carRental`
- `pointOfInterest.service.evCharging`
- `pointOfInterest.service.gasStation`
- `pointOfInterest.service.parkingLot`
- `pointOfInterest.service.postOffice`
- `pointOfInterest.service.restStop`
- `pointOfInterest.service.restroom`
- `pointOfInterest.transit`
- `pointOfInterest.transit.airport`
- `pointOfInterest.other`
- `pointOfInterest.other.bridge`
- `pointOfInterest.other.cemetery`
- `pointOfInterest.other.government`
- `pointOfInterest.other.library`
- `pointOfInterest.other.military`
- `pointOfInterest.other.placeOfWorship`
- `pointOfInterest.other.school`
- `pointOfInterest.other.townSquare`
- `political`
- `political.countryOrRegion`
- `political.border`
- `political.reservation`
- `political.stateOrProvince`
- `political.city`
- `political.sublocality`
- `political.neighborhood`
- `political.landParcel`
- `infrastructure`
- `infrastructure.building`
- `infrastructure.building.commercial`
- `infrastructure.businessCorridor`
- `infrastructure.roadNetwork`
- `infrastructure.roadNetwork.noTraffic`
- `infrastructure.roadNetwork.noTraffic.pedestrianMall`
- `infrastructure.roadNetwork.noTraffic.trail`
- `infrastructure.roadNetwork.noTraffic.trail.paved`
- `infrastructure.roadNetwork.noTraffic.trail.unpaved`
- `infrastructure.roadNetwork.parkingAisle`
- `infrastructure.roadNetwork.ramp`
- `infrastructure.roadNetwork.road`
- `infrastructure.roadNetwork.road.arterial`
- `infrastructure.roadNetwork.road.highway`
- `infrastructure.roadNetwork.road.local`
- `infrastructure.roadNetwork.road.noOutlet`
- `infrastructure.roadNetwork.roadShield`
- `infrastructure.roadNetwork.roadSign`
- `infrastructure.roadNetwork.roadDetail`
- `infrastructure.roadNetwork.roadDetail.surface`
- `infrastructure.roadNetwork.roadDetail.crosswalk`
- `infrastructure.roadNetwork.roadDetail.sidewalk`
- `infrastructure.roadNetwork.roadDetail.intersection`
- `infrastructure.railwayTrack`
- `infrastructure.railwayTrack.commercial`
- `infrastructure.railwayTrack.commuter`
- `infrastructure.transitStation`
- `infrastructure.transitStation.bicycleShare`
- `infrastructure.transitStation.busStation`
- `infrastructure.transitStation.ferryTerminal`
- `infrastructure.transitStation.funicularStation`
- `infrastructure.transitStation.gondolaStation`
- `infrastructure.transitStation.monorail`
- `infrastructure.transitStation.railStation`
- `infrastructure.transitStation.railStation.subwayStation`
- `infrastructure.transitStation.railStation.tramStation`
- `infrastructure.urbanArea`
- `natural`
- `natural.continent`
- `natural.archipelago`
- `natural.island`
- `natural.land`
- `natural.land.landCover`
- `natural.land.landCover.crops`
- `natural.land.landCover.dryCrops`
- `natural.land.landCover.forest`
- `natural.land.landCover.ice`
- `natural.land.landCover.sand`
- `natural.land.landCover.shrub`
- `natural.land.landCover.tundra`
- `natural.water`
- `natural.water.ocean`
- `natural.water.lake`
- `natural.water.river`
- `natural.water.other`
- `natural.base`

### 要素

要素は地図上の対象物の下位区分です。たとえば道路は、地図上のグラフィカルな線（ `geometry` ）と、道路の名称を示すテキスト（ `label` ）で構成されます。

次の要素が利用可能ですが、地図上の対象物によっては、一部またはすべての要素に対応する場合や、すべての要素に非対応の場合があります。

- `geometry`: 指定した地図対象物のすべてのジオメトリ要素（ポリゴン、ポリラインなど）を選択します。
- `label`: 指定した地図の対象物のすべてのラベル要素（テキスト、ピンなど）を選択します。

### スタイラ

スタイラは、地図上の対象物の各要素のスタイルルールを定義する方法です。

たとえば、建物のフットプリントの場合、各要素を次のようにスタイル設定できます。

| 建物の `geometry` スタイラーの例 | 建物の `label` スタイラーの例 |
| --- | --- |
| 地図上に建物のフットプリント ポリゴンを表示するかどうか。 | 建物のラベルを非表示にするか表示するか。 |
| ポリゴンの塗りつぶしの色と不透明度。 | テキストの塗りつぶしの色と不透明度。 |
| 枠線の色、不透明度、幅。 | テキストのストロークの色と不透明度。 |

このセクションでは、 `geometry` 要素と `label` 要素で使用できるさまざまなスタイル オプションについて説明します。

#### geometry 個のスタイラー

次の表に、使用可能なすべての幾何学的スタイル設定ツールを示します。

| **スタイラー** | **型** | **説明** |
| --- | --- | --- |
| `  visible  ` | ブール値 | 地図対象物のポリゴンまたはポリラインを非表示にするには、 `false` に設定します。 |
| `  fillColor  ` | 文字列 | RGB 16 進文字列を使用して、ポリゴンまたはポリラインの色をカスタマイズします。 |
| `  fillOpacity  ` | float | ポリゴンまたはポリラインの不透明度をカスタマイズします。0 は透明、1 は不透明です。 |
| `  strokeColor  ` | 文字列 | RGB 16 進文字列を使用して、アウトラインの色をカスタマイズします。 |
| `  strokeOpacity  ` | float | 輪郭の不透明度をカスタマイズします。0 は透明、1 は不透明です。 |
| `  strokeWeight  ` | float | アウトラインの太さを 0 ～ 8 の範囲でカスタマイズします。 |

詳しくは、 [ポリゴンとポリライン](https://developers.google.com/maps/documentation/maps-static/cloud-customization/taxonomy?hl=ja#polygons_and_polylines) をご覧ください。

#### label 個のスタイラー

次の表に、使用可能なすべてのラベル スタイラーを示します。

| **スタイラー** | **型** | **説明** |
| --- | --- | --- |
| `  visible  ` | ブール値 | 地図アイテムのラベルを非表示にするには、 `false` に設定します。 |
| `  textFillColor  ` | 文字列 | RGB 16 進文字列を使用してテキストラベルの色をカスタマイズします。 |
| `  textFillOpacity  ` | float | テキストラベルの不透明度をカスタマイズします。0 は透明、1 は不透明です。 |
| `  textStrokeColor  ` | 文字列 | RGB 16 進文字列を使用して、アウトラインの色をカスタマイズします。 |
| `  textStrokeOpacity  ` | float | 輪郭の不透明度をカスタマイズします。0 は透明、1 は不透明です。 |
| `  textStrokeWeight  ` | float | アウトラインの太さを 0 ～ 8 の範囲でカスタマイズします。 |
| `  pinFillColor  ` | 文字列 | RGB 16 進文字列を使用してピンの色をカスタマイズします。 |

詳しくは、 [アイコンとテキスト ラベル](https://developers.google.com/maps/documentation/maps-static/cloud-customization/taxonomy?hl=ja#icons_and_text_labels) をご覧ください。

### キーズーム

すべてのキーズームレベルで 1 つのスタイルを設定することも、キーズームレベルごとに異なるスタイルを指定することもできます。スタイルを 1 つだけ指定した場合、z0 から始まるすべての keyzoom レベルで使用されます。異なるキーズームレベルのスタイルを指定すると、そのズームレベルから次に定義したズームレベルまでスタイルが適用されます。

スタイルのキーズームレベルを設定するには、スタイラー プロパティで、z0 から z22 までのキーズームレベルを定義してから、スタイラーのカスタマイズを定義します。

次の例では、水域の色がキーズームレベル 0 ～ 5 では黒、キーズームレベル 6 ～ 11 では濃いグレー、キーズームレベル 12 以降では明るいグレーになります。

```
{
  "id": "natural.water",
  "geometry": {
    "fillColor": {
      "z0": "#000000",
      "z6": "#666666",
      "z12": "#cccccc"
    }
  }
}
```

詳しくは、 [ズームレベルのスタイルを設定する](https://developers.google.com/maps/documentation/maps-static/cloud-customization/zoom-levels?hl=ja) をご覧ください。

## 制限事項

JSON を使用して、Google Cloud コンソールのほぼすべてのスタイルを設定できます。ただし、\[**地図の設定**\] メニューの次の機能は除きます。

- [スポットの密度を調整する。](https://developers.google.com/maps/documentation/maps-static/cloud-customization/poi-behavior-customization?hl=ja)
- [建物のスタイルを変更します。](https://developers.google.com/maps/documentation/maps-static/cloud-customization/building-style?hl=ja)
- [ランドマークのスタイルを変更します。](https://developers.google.com/maps/documentation/maps-static/cloud-customization/landmarks?hl=ja)

これらの機能については、 \[**地図の設定**\] メニューで設定を選択する必要があります。

特に記載のない限り、このページのコンテンツは [クリエイティブ・コモンズの表示 4.0 ライセンス](https://creativecommons.org/licenses/by/4.0/) により使用許諾されます。コードサンプルは [Apache 2.0 ライセンス](https://www.apache.org/licenses/LICENSE-2.0) により使用許諾されます。詳しくは、 [Google Developers サイトのポリシー](https://developers.google.com/site-policies?hl=ja) をご覧ください。Java は Oracle および関連会社の登録商標です。

最終更新日 2025-10-23 UTC。

