'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { THDriverData, THWebSocketMessage } from '@/types/truckershub'

interface UseTruckersHubOptions {
  companyId: number
  onDriverUpdate?: (driver: THDriverData) => void
  onDriverDisconnect?: (driverId: string) => void
}

export function useTruckersHub({ companyId, onDriverUpdate, onDriverDisconnect }: UseTruckersHubOptions) {
  const [drivers, setDrivers] = useState<Map<string, THDriverData>>(new Map())
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket('wss://gateway.truckershub.in/')
    wsRef.current = ws

    ws.addEventListener('open', () => {
      setStatus('connected')
      ws.send(JSON.stringify({
        type: 'AUTH',
        data: { subscribe_to: { to_company: companyId }, game: 'ets2' },
      }))
    })

    ws.addEventListener('message', ({ data: raw }) => {
      try {
        const msg: THWebSocketMessage = JSON.parse(raw)

        if (msg.type === 'AUTH_ACK') {
          heartbeatRef.current = setInterval(() => {
            ws.send(JSON.stringify({ type: 'HEART_BEAT' }))
          }, (msg.data?.heartbeat_interval ?? 30) * 1000)
        }

        if (msg.type === 'PLAYER_DATA') {
          const driver: THDriverData = msg.data
          setDrivers(prev => new Map(prev).set(driver.id, driver))
          onDriverUpdate?.(driver)
        }

        if (msg.type === 'PLAYER_DISCONNECT') {
          setDrivers(prev => {
            const next = new Map(prev)
            next.delete(msg.data.id)
            return next
          })
          onDriverDisconnect?.(msg.data.id)
        }
      } catch (e) {
        console.error('TruckersHub parse error:', e)
      }
    })

    ws.addEventListener('close', () => {
      setStatus('disconnected')
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      // Auto-reconnect po 5s
      reconnectRef.current = setTimeout(connect, 5000)
    })

    ws.addEventListener('error', () => {
      ws.close()
    })
  }, [companyId, onDriverUpdate, onDriverDisconnect])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }
  }, [connect])

  return { drivers: Array.from(drivers.values()), status }
}
