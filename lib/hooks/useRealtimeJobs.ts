'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Job } from '@/types'
import { toast } from 'sonner'

export function useRealtimeJobs(memberId: string) {
  const [jobs, setJobs]     = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Pobierz początkowe dane
    supabase
      .from('jobs')
      .select('*')
      .eq('member_id', memberId)
      .order('completed_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setJobs(data ?? [])
        setLoading(false)
      })

    // Subskrybuj nowe joby
    const channel = supabase
      .channel(`jobs:${memberId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'jobs',
        filter: `member_id=eq.${memberId}`,
      }, payload => {
        const newJob = payload.new as Job
        setJobs(prev => [newJob, ...prev])
        toast.success(`✅ Nowy job: ${newJob.cargo} → ${newJob.destination_city} | ${newJob.distance_km} km`)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [memberId])

  return { jobs, loading }
}
