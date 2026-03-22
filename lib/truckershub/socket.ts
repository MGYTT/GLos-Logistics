import { THWebSocketMessage, THDriverData } from './types'

type EventMap = {
  'driver:update':     THDriverData
  'driver:disconnect': { userID: number }
  'status':            'connected' | 'disconnected' | 'reconnecting'
  'error':             string
}

type Handler<T> = (data: T) => void

export class TruckersHubSocket {
  private ws:             WebSocket | null = null
  private heartbeat:      ReturnType<typeof setInterval>  | null = null
  private reconnectTimer: ReturnType<typeof setTimeout>   | null = null
  private companyId:      number
  private handlers:       Map<string, Handler<any>[]> = new Map()
  private destroyed = false

  constructor(companyId: number) {
    this.companyId = companyId
  }

  connect() {
    if (this.destroyed) return
    this.emit('status', 'reconnecting')

    try {
      this.ws = new WebSocket('wss://gateway.truckershub.in/')
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.addEventListener('open', () => {
      this.emit('status', 'connected')
      this.ws!.send(JSON.stringify({
        type: 'AUTH',
        data: {
          subscribe_to: { to_company: this.companyId },
          game: 'ets2',
        },
      }))
    })

    this.ws.addEventListener('message', ({ data: raw }) => {
      try {
        const msg: THWebSocketMessage = JSON.parse(raw)

        if (msg.type === 'AUTH_ACK') {
          const interval = (msg.data?.heartbeat_interval ?? 30) * 1000
          this.heartbeat = setInterval(() => {
            this.ws?.readyState === WebSocket.OPEN &&
              this.ws.send(JSON.stringify({ type: 'HEART_BEAT' }))
          }, interval)
          return
        }

        if (msg.type === 'PLAYER_DATA') {
          this.emit('driver:update', this.normalizeDriver(msg.data))
        }

        if (msg.type === 'PLAYER_OFFLINE') {
          this.emit('driver:disconnect', { userID: msg.data?.driver?.userID })
        }
      } catch {}
    })

    this.ws.addEventListener('close', () => {
      this.emit('status', 'disconnected')
      this.clearHeartbeat()
      this.scheduleReconnect()
    })

    this.ws.addEventListener('error', () => {
      this.emit('error', 'WebSocket error')
    })
  }

  private normalizeDriver(data: any): THDriverData {
    return {
      id:          String(data?.driver?.userID ?? ''),
      username:    data?.driver?.username ?? 'Unknown',
      avatar:      data?.driver?.avatar ?? null,
      x:           data?.truck?.position?.X ?? 0,
      y:           data?.truck?.position?.Y ?? 0,
      z:           data?.truck?.position?.Z ?? 0,
      speed:       Math.round((data?.topSpeed ?? 0) * 3.6), // m/s → km/h
      heading:     data?.truck?.heading ?? 0,
      cargo:       data?.cargo?.name ?? null,
      destination: data?.destination?.city?.name ?? null,
      server:      data?.multiplayer?.server ?? null,
      truck:       data?.truck?.name ?? null,
      online:      true,
    }
  }

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>) {
    if (!this.handlers.has(event)) this.handlers.set(event, [])
    this.handlers.get(event)!.push(handler)
    return this
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>) {
    const handlers = this.handlers.get(event) ?? []
    this.handlers.set(event, handlers.filter(h => h !== handler))
  }

  private emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    this.handlers.get(event)?.forEach(h => h(data))
  }

  private clearHeartbeat() {
    if (this.heartbeat) { clearInterval(this.heartbeat); this.heartbeat = null }
  }

  private scheduleReconnect() {
    if (this.destroyed) return
    this.reconnectTimer = setTimeout(() => this.connect(), 5000)
  }

  disconnect() {
    this.destroyed = true
    this.clearHeartbeat()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
  }
}
