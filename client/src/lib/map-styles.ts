/**
 * Google Maps ダークテーマスタイル
 * 暗い紫または深い青を基調とし、夜間視認性を向上
 */
export const DARK_THEME_STYLES: google.maps.MapTypeStyle[] = [
  {
    elementType: "geometry",
    stylers: [{ color: "#1d2c4d" }], // 深い青
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }], // 白文字
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#4a5f8a" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#283d5f" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2f3f5f" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2f4f" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3d5070" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
];
