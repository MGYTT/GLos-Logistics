'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface LiveDriver {
  member_id:             string
  has_job:               boolean
  from_city:             string | null
  to_city:               string | null
  cargo:                 string | null
  speed_kmh:             number | null
  fuel_liters:           number | null
  truck_brand:           string | null
  truck_model:           string | null
  distance_remaining_km: number | null
  game_x:                number | null
  game_y:                number | null
  game_z:                number | null
  updated_at:            string
  member: {
    username:   string
    avatar_url: string | null
    rank:       string
  } | null
}

export function useLiveMap() {
  const [drivers, setDrivers]       = useState<LiveDriver[]>([])
  const [connected, setConnected]   = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('member_telemetry')
      .select('*, member:member_id(username, avatar_url, rank)')
      .order('updated_at', { ascending: false })
    setDrivers(data ?? [])
    setLastUpdate(new Date())
  }, [])

  useEffect(() => {
    load()

    const channel = supabase
      .channel('livemap_telemetry')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'member_telemetry' },
        () => load()
      )
      .subscribe(status => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [load])

  const onlineDrivers = drivers.filter(d => {
    const secAgo = (Date.now() - new Date(d.updated_at).getTime()) / 1000
    return secAgo < 120 // aktywny jeśli aktualizacja < 2 min temu
  })

  return { drivers: onlineDrivers, allDrivers: drivers, connected, lastUpdate }
}
export type MapStatus = 'connected' | 'disconnected'
