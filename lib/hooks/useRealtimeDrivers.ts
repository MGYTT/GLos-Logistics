'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DriverPosition } from '@/types'

export function useRealtimeDrivers() {
  const [drivers, setDrivers] = useState<DriverPosition[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Pobierz aktywnych kierowców
    supabase
      .from('driver_positions')
      .select('*, members(username, avatar_url, rank)')
      .eq('online', true)
      .then(({ data }) => setDrivers(data ?? []))

    // Real-time updates
    const channel = supabase
      .channel('driver_positions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_positions',
      }, payload => {
        if (payload.eventType === 'DELETE') {
          setDrivers(prev => prev.filter(d => d.member_id !== (payload.old as any).member_id))
          return
        }
        const updated = payload.new as DriverPosition
        setDrivers(prev => {
          const exists = prev.find(d => d.member_id === updated.member_id)
          if (exists) return prev.map(d => d.member_id === updated.member_id ? updated : d)
          return [...prev, updated]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return drivers
}
