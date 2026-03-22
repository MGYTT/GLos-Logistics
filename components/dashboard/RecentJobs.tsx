'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, CheckCircle2, Package, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Job } from '@/types'

interface Props {
  memberId:    string
  initialJobs: Job[]
}

function getDmgColor(dmg: number) {
  if (dmg < 5)  return 'text-green-400 bg-green-400/10'
  if (dmg < 20) return 'text-amber-400 bg-amber-400/10'
  return 'text-red-400 bg-red-400/10'
}

function normalizeJob(j: any): Job {
  return {
    ...j,
    origin_city:      j.origin_city      ?? j.from_city ?? '—',
    destination_city: j.destination_city ?? j.to_city   ?? '—',
    income:           j.income           ?? j.pay       ?? 0,
    distance_km:      j.distance_km      ?? 0,
    damage_percent:   j.damage_percent   ?? 0,
    completed_at:     j.completed_at     ?? j.created_at,
  }
}

export function RecentJobs({ memberId, initialJobs }: Props) {
  const supabase             = createClient()
  const [jobs, setJobs]      = useState<Job[]>(initialJobs)
  const [isPending, startT]  = useTransition()
  const [newJobId, setNewJobId] = useState<string | null>(null)

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .or(`member_id.eq.${memberId},created_by.eq.${memberId}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10)

    if (data) setJobs(data.map(normalizeJob))
  }

  useEffect(() => {
    // Realtime — nowe joby
    const channel = supabase
      .channel(`recent_jobs_${memberId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        (payload: any) => {
          const row = payload.new
          if (row?.member_id !== memberId && row?.created_by !== memberId) return

          const newJob = normalizeJob(row)
          setNewJobId(newJob.id)
          setJobs(prev => [newJob, ...prev].slice(0, 10))

          // Usuń highlight po 4s
          setTimeout(() => setNewJobId(null), 4_000)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs' },
        (payload: any) => {
          const row = payload.new
          if (row?.member_id !== memberId && row?.created_by !== memberId) return
          setJobs(prev =>
            prev.map(j => j.id === row.id ? normalizeJob(row) : j)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [memberId])

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">
          Ostatnie joby
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => startT(fetchJobs)}
            disabled={isPending}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Odśwież"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/hub/jobs"
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            Zobacz wszystkie →
          </Link>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 divide-y divide-zinc-800/50">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">Brak jobów</p>
            <p className="text-zinc-700 text-xs mt-1">Czas ruszyć w trasę! 🚛</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {jobs.map(job => (
              <motion.div
                key={job.id}
                initial={job.id === newJobId
                  ? { opacity: 0, x: -20, backgroundColor: 'rgba(245,158,11,0.1)' }
                  : false
                }
                animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {job.cargo}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                    <span className="truncate max-w-[80px]">{job.origin_city}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span className="truncate max-w-[80px]">{job.destination_city}</span>
                  </div>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <p className="text-sm font-bold text-green-400">
                    €{job.income.toLocaleString('pl-PL')}
                  </p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-[10px] text-zinc-600">{job.distance_km} km</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getDmgColor(job.damage_percent)}`}>
                      {job.damage_percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {jobs.length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-700">
            Ostatnia aktywność:{' '}
            {formatDistanceToNow(new Date(jobs[0].completed_at), {
              addSuffix: true,
              locale: pl,
            })}
          </p>
        </div>
      )}
    </div>
  )
}
