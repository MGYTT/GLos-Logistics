'use client'
import { useState, useMemo, useEffect } from 'react'
import { JobCard }        from './JobCard'
import { JobCreateModal } from './JobCreateModal'
import { JobDetailModal } from './JobDetailModal'
import { ActiveDrivers }  from './ActiveDrivers'
import { Button }         from '@/components/ui/button'
import { Input }          from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Plus, Search, SlidersHorizontal,
  Truck, Package, CheckCircle2, Clock,
} from 'lucide-react'
import { createClient }                  from '@/lib/supabase/client'
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/lib/ets2/data'
import type { Job }                      from '@/types/jobs'

interface Member { id: string; username: string; rank: string }
interface Props   { jobs: Job[]; currentUser: Member }

// Tylko pola które są w types/jobs.ts — bez origin_city/destination_city/income/member_id
function normalizeJob(j: any): Job {
  return {
    ...j,
    title:        j.title        ?? '—',
    from_city:    j.from_city    ?? '—',
    to_city:      j.to_city      ?? '—',
    cargo:        j.cargo        ?? '—',
    priority:     j.priority     ?? 'normal',
    cargo_weight: j.cargo_weight ?? 0,
    pay:          j.pay          ?? 0,
    distance_km:  j.distance_km  ?? 0,
    taken_by:     j.taken_by     ?? null,
    trailer_type: j.trailer_type ?? '',
    truck:        j.truck        ?? null,
    server:       j.server       ?? 'EU1',
  }
}

function StatCards({ jobs }: { jobs: Job[] }) {
  const stats = [
    {
      label: 'Dostępne',
      value: jobs.filter(j => j.status === 'open').length,
      icon:  Package,
      color: 'text-green-400',
      bg:    'bg-green-400/10',
    },
    {
      label: 'W trakcie',
      value: jobs.filter(j => j.status === 'in_progress' || j.status === 'taken').length,
      icon:  Truck,
      color: 'text-blue-400',
      bg:    'bg-blue-400/10',
    },
    {
      label: 'Ukończone',
      value: jobs.filter(j => j.status === 'completed').length,
      icon:  CheckCircle2,
      color: 'text-amber-400',
      bg:    'bg-amber-400/10',
    },
    {
      label: 'Anulowane',
      value: jobs.filter(j => j.status === 'cancelled').length,
      icon:  Clock,
      color: 'text-zinc-400',
      bg:    'bg-zinc-400/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="glass rounded-xl p-4 flex items-center gap-3">
          <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function JobsBoard({ jobs: initial, currentUser }: Props) {
  const supabase = createClient()

  const [jobs, setJobs]                     = useState<Job[]>(initial.map(normalizeJob))
  const [search, setSearch]                 = useState('')
  const [filterStatus, setFilterStatus]     = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [selectedJob, setSelectedJob]       = useState<Job | null>(null)
  const [showCreate, setShowCreate]         = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel('jobs_board_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        ({ new: row }) => {
          setJobs(prev => [normalizeJob(row), ...prev])
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs' },
        ({ new: row }) => {
          setJobs(prev => prev.map(j => j.id === row.id ? normalizeJob(row) : j))
          setSelectedJob(prev => prev?.id === row.id ? normalizeJob(row) : prev)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = useMemo(() =>
    jobs
      .filter(j => filterStatus   === 'all' || j.status   === filterStatus)
      .filter(j => filterPriority === 'all' || j.priority === filterPriority)
      .filter(j => {
        const q = search.toLowerCase()
        return !q
          || j.from_city.toLowerCase().includes(q)
          || j.to_city.toLowerCase().includes(q)
          || j.cargo.toLowerCase().includes(q)
          || j.title.toLowerCase().includes(q)
      }),
    [jobs, search, filterStatus, filterPriority],
  )

  function handleJobCreated(job: Job) {
    setJobs(prev => [normalizeJob(job), ...prev])
    setShowCreate(false)
  }

  function handleJobUpdated(updated: Job) {
    setJobs(prev => prev.map(j => j.id === updated.id ? normalizeJob(updated) : j))
    setSelectedJob(normalizeJob(updated))
  }

  return (
    <div className="space-y-6">
      <ActiveDrivers />
      <StatCards jobs={jobs} />

      {/* Filtry + dodaj */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj miasta, ładunku..."
            className="pl-9 bg-zinc-900 border-zinc-700 h-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-36 bg-zinc-900 border-zinc-700 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">Wszystkie</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-9 w-40 bg-zinc-900 border-zinc-700 text-xs">
            <SlidersHorizontal className="w-3 h-3 mr-1.5 text-zinc-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">Priorytet: wszystkie</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => setShowCreate(true)}
          className="bg-amber-500 text-black hover:bg-amber-400 font-bold gap-2 h-9 ml-auto"
        >
          <Plus className="w-4 h-4" />
          Nowe zlecenie
        </Button>
      </div>

      {/* Siatka kart */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">Brak zleceń</p>
          <p className="text-zinc-600 text-sm mt-1">
            {search ? 'Spróbuj innej frazy' : 'Bądź pierwszy i dodaj zlecenie!'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              currentUserId={currentUser.id}
              onClick={() => setSelectedJob(job)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-zinc-600 text-right">
          Wyświetlono {filtered.length} z {jobs.length} zleceń
        </p>
      )}

      {showCreate && (
        <JobCreateModal
          currentUser={currentUser}
          onCreated={handleJobCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          currentUser={currentUser}
          onClose={() => setSelectedJob(null)}
          onUpdated={handleJobUpdated}
        />
      )}
    </div>
  )
}
