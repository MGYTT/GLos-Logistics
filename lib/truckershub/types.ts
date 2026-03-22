export interface THDriverData {
  id:          string
  username:    string
  avatar:      string | null
  x:           number
  y:           number
  z:           number
  speed:       number
  heading:     number
  cargo:       string | null
  destination: string | null
  server:      string | null
  truck:       string | null
  online:      boolean
}

export interface THWebSocketMessage {
  type: 'AUTH' | 'AUTH_ACK' | 'HEART_BEAT' | 'PLAYER_DATA' | 'PLAYER_ONLINE' | 'PLAYER_OFFLINE' | 'NEW_EVENT' | 'COMPANY_DATA'
  data: any
}

// Konwersja współrzędnych ETS2 → Leaflet
// ETS2 world: X [-16000, 16000], Z [-16000, 16000]
export function ets2ToLatLng(x: number, z: number): [number, number] {
  const lat = -(z / 16000) * 90
  const lng =  (x / 16000) * 180
  return [lat, lng]
}
