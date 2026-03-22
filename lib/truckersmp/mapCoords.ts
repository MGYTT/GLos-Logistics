// Trucky API zwraca współrzędne w układzie mapy ETS2
// x, y → Leaflet LatLng

const MAP_WIDTH  = 4096
const MAP_HEIGHT = 4096

// Kalibracja punktów ETS2 → tile coords
const OFFSET_X = 15020
const OFFSET_Y = 14100
const SCALE    = 18.0

export function truckyToLatLng(x: number, y: number): [number, number] {
  const px = (x + OFFSET_X) / SCALE
  const py = (y + OFFSET_Y) / SCALE

  // Konwertuj pixel → Leaflet LatLng (układ odwrócony)
  const lat = -(py / MAP_HEIGHT) * 180 + 90
  const lng =  (px / MAP_WIDTH)  * 360 - 180

  return [lat, lng]
}

export function formatSpeed(speedMs: number): number {
  return Math.round(Math.abs(speedMs) * 3.6)
}
