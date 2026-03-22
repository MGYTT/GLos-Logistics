'use client'

import { useEffect, useRef, useTransition, useCallback } from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props { memberId: string }

// Interwał pollingu w ms — co 15s sprawdza nowe joby
const POLL_MS = 15_000

export function StatsRefresher({ memberId }: Props) {
  const router               = useRouter()
  const supabase             = createClient()
  const [, startTransition]  = useTransition()
  const lastJobCount         = useRef<number | null>(null)
  const lastRefreshAt        = useRef<number>(0)
  const isMounted            = useRef(true)

  // Jedyna niezawodna metoda refresh w Next.js App Router
  const doRefresh = useCallback(() => {
    const now = Date.now()
    if (now - lastRefreshAt.current < 4_000) return  // debounce 4s
    lastRefreshAt.current = now

    console.log('[StatsRefresher] Odświeżam stronę...')
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  // Polling — sprawdza liczbę jobów i odświeża gdy się zmieniła
  const pollJobs = useCallback(async () => {
    if (!isMounted.current) return
    try {
      const { count, error } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .or(`member_id.eq.${memberId},created_by.eq.${memberId}`)
        .eq('status', 'completed')

      if (error) {
        console.warn('[StatsRefresher] poll error:', error.message)
        return
      }

      const current = count ?? 0

      // Inicjalizacja
      if (lastJobCount.current === null) {
        lastJobCount.current = current
        return
      }

      // Wykryto nowy job!
      if (current !== lastJobCount.current) {
        console.log(
          `[StatsRefresher] Wykryto zmianę jobów: ${lastJobCount.current} → ${current}`
        )
        lastJobCount.current = current
        doRefresh()
      }
    } catch (e) {
      console.warn('[StatsRefresher] poll exception:', e)
    }
  }, [memberId, doRefresh])

  useEffect(() => {
    isMounted.current = true

    // Pierwsze pobranie liczby jobów
    pollJobs()

    // Polling co 15s — główny mechanizm
    const pollTimer = setInterval(pollJobs, POLL_MS)

    // Realtime jako bonus (może nie działać — polling jest fallback)
    const channel = supabase
      .channel(`jobs_realtime_${memberId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',          // INSERT + UPDATE + DELETE
          schema: 'public',
          table:  'jobs',
          // BEZ filtra — filtrujemy client-side (filtr może nie działać z RLS)
        },
        (payload: any) => {
          const row = payload.new ?? payload.old
          // Filtruj po stronie klienta
          if (
            row?.member_id  === memberId ||
            row?.created_by === memberId
          ) {
            console.log('[StatsRefresher] Realtime event:', payload.eventType)
            lastJobCount.current = null  // reset — następny poll ustali nową wartość
            doRefresh()
          }
        }
      )
      .subscribe(status => {
        console.log('[StatsRefresher] Realtime status:', status)
      })

    return () => {
      isMounted.current = false
      clearInterval(pollTimer)
      supabase.removeChannel(channel)
    }
  }, [memberId])

  return null
}
