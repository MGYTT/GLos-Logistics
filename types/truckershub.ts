export interface THDriverData {
  id: string
  member_uuid?: string
  username: string
  x: number
  y: number
  z: number
  speed: number
  cargo?: string
  destination?: string
  truck_brand?: string
  truck_model?: string
  game: 'ets2' | 'ats'
}

export interface THWebSocketMessage {
  type:
    | 'AUTH'
    | 'AUTH_ACK'
    | 'HEART_BEAT'
    | 'PLAYER_DATA'
    | 'PLAYER_DISCONNECT'
    | 'COMPANY_DATA'
  data: any
}

export interface THJobWebhook {
  id: string
  driver_uuid: string
  cargo: string
  source_city: string
  destination_city: string
  distance: number
  income: number
  fuel_used: number
  cargo_damage: number
  timestamp: string
}
