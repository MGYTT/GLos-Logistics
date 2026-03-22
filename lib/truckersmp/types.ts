export interface TruckyPlayer {
  id:      number    // TruckersMP ID
  name:    string
  x:       number    // ETS2 world X
  y:       number    // ETS2 world Y (=Z w silniku)
  server:  number
}

export interface TruckyServer {
  id:         number
  name:       string
  shortname:  string
  online:     boolean
  players:    number
  maxplayers: number
  game:       string
}

// Kalibracja mapy ETS2 → Leaflet
// Źródło: trucky live map tiles wss://map.truckersmp.com
const GAME_X_OFFSET   =  15220
const GAME_Y_OFFSET   =  14630
const GAME_SCALE      =     19.97

const TILE_SIZE       =  4096  // px per tile level 8
const BOUNDS_LAT_MIN  =  -90
const BOUNDS_LAT_MAX  =   90
const BOUNDS_LNG_MIN  = -180
const BOUNDS_LNG_MAX  =  180

export function ets2ToLatLng(x: number, y: number): [number, number] {
  // Konwertuj do pikseli na poziomie 8
  const px = (x + GAME_X_OFFSET) / GAME_SCALE
  const py = (y + GAME_Y_OFFSET) / GAME_SCALE

  // Normalizuj do [0,1]
  const normX =  px / TILE_SIZE
  const normY =  py / TILE_SIZE

  // Leaflet: lat idzie od góry (odwrócone Y)
  const lat = BOUNDS_LAT_MAX - normY * (BOUNDS_LAT_MAX - BOUNDS_LAT_MIN)
  const lng = BOUNDS_LNG_MIN + normX * (BOUNDS_LNG_MAX - BOUNDS_LNG_MIN)

  return [lat, lng]
}
