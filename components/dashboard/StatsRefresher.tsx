'use client'

import { useEffect, useRef, useTransition, useCallback } from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props { memberId: string }

const POLL_MS = 15_000

export function StatsRefresher({ memberId }: Props) {
  const router              = useRouter()
  const supabase            = createClient()
  const [, startTransition] = useTransition()
  const lastJobCount        = useRef<number | null>(null)
  const lastRefreshAt       = useRef<number>(0)
  const isMounted           = useRef(true)

  const doRefresh = useCallback(() => {
    const now = Date.now()
    if (now - lastRefreshAt.current < 4_000) return
    lastRefreshAt.current = now
    console.log('[StatsRefresher] Odświeżam stronę...')
    startTransition(() => { router.refresh() })
  }, [router])

  const pollJobs = useCallback(async () => {
    if (!isMounted.current) return
    try {
      const { count, error } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .or(`member_id.eq.${memberId},created_by.eq.${memberId}`)
        .eq('status', 'completed')

      if (error) { console.warn('[StatsRefresher] poll error:', error.message); return }

      const current = count ?? 0
      if (lastJobCount.current === null) { lastJobCount.current = current; return }

      if (current !== lastJobCount.current) {
        console.log(`[StatsRefresher] Wykryto zmianę jobów: ${lastJobCount.current} → ${current}`)
        lastJobCount.current = current
        doRefresh()
      }
    } catch (e) {
      console.warn('[StatsRefresher] poll exception:', e)
    }
  }, [memberId, doRefresh])

  useEffect(() => {
    isMounted.current = true
    pollJobs()
    const pollTimer = setInterval(pollJobs, POLL_MS)

    const channel = supabase
      .channel(`stats_refresher_${memberId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs' },
        (payload: any) => {
          const row = payload.new
          if (row?.member_id !== memberId && row?.created_by !== memberId) return
          // FIX: odświeżaj TYLKO gdy status zmienił się na completed
          if (row?.status === 'completed') {
            console.log('[StatsRefresher] job completed — odświeżam')
            lastJobCount.current = null
            doRefresh()
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        (payload: any) => {
          const row = payload.new
          if (row?.member_id !== memberId && row?.created_by !== memberId) return
          if (row?.status === 'completed') {
            lastJobCount.current = null
            doRefresh()
          }
        },
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
