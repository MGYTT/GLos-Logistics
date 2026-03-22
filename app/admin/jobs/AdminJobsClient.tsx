'use client'

import {
  useState, useMemo, useTransition, useCallback,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  Search, Trash2, Edit3, ChevronUp, ChevronDown,
  ChevronsUpDown, Filter, X, CheckSquare, Square,
  Download, AlertTriangle, Save, Loader2,
  ArrowRight, Package, Truck, User,
  TrendingUp, Route, DollarSign, Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { deleteJob, deleteJobs, updateJob } from './actions'
import type { Member } from '@/types'

// ─── Typy ──────────────────────────────────────
interface JobRow {
  id:               string
  member_id:        string | null
  created_by:       string | null
  title:            string | null
  from_city:        string | null
  to_city:          string | null
  origin_city:      string | null
  destination_city: string | null
  cargo:            string | null
  distance_km:      number | null
  pay:              number | null
  income:           number | null
  damage_percent:   number | null
  fuel_used:        number | null
  status:           string | null
  source:           string | null
  notes:            string | null
  completed_at:     string | null
  created_at:       string | null
  member?:          Pick<Member, 'id' | 'username' | 'avatar_url' | 'rank'> | null
}

interface Stats {
  total:       number
  totalKm:     number
  totalIncome: number
  avgDmg:      number
}

interface Props {
  initialJobs: JobRow[]
  members:     Pick<Member, 'id' | 'username' | 'avatar_url' | 'rank'>[]
  stats:       Stats
}

type SortKey = 'created_at' | 'distance_km' | 'income' | 'damage_percent' | 'username'
type SortDir = 'asc' | 'desc'

// ─── Helpers ───────────────────────────────────
const jobCity = (j: JobRow, type: 'from' | 'to') =>
  type === 'from'
    ? (j.origin_city      ?? j.from_city ?? '—')
    : (j.destination_city ?? j.to_city   ?? '—')

const jobIncome = (j: JobRow) => j.income ?? j.pay ?? 0

function dmgColor(v: number) {
  if (v < 5)  return 'text-green-400 bg-green-400/10'
  if (v < 20) return 'text-amber-400 bg-amber-400/10'
  return 'text-red-400 bg-red-400/10'
}

function statusBadge(s: string | null) {
  switch (s) {
    case 'completed': return 'text-green-400  bg-green-400/10  border-green-400/20'
    case 'open':      return 'text-blue-400   bg-blue-400/10   border-blue-400/20'
    case 'taken':     return 'text-amber-400  bg-amber-400/10  border-amber-400/20'
    case 'cancelled': return 'text-red-400    bg-red-400/10    border-red-400/20'
    default:          return 'text-zinc-400   bg-zinc-400/10   border-zinc-400/20'
  }
}

function sourceBadge(s: string | null) {
  return s === 'bridge'
    ? 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    : 'text-zinc-500   bg-zinc-500/10   border-zinc-500/20'
}

function exportCSV(jobs: JobRow[]) {
  const header = [
    'ID', 'Kierowca', 'Skąd', 'Dokąd', 'Ładunek',
    'Dystans (km)', 'Zarobki (€)', 'Uszkodzenia (%)',
    'Status', 'Źródło', 'Data',
  ].join(';')

  const rows = jobs.map(j => [
    j.id,
    j.member?.username ?? '—',
    jobCity(j, 'from'),
    jobCity(j, 'to'),
    j.cargo ?? '—',
    j.distance_km ?? 0,
    jobIncome(j),
    (j.damage_percent ?? 0).toFixed(1),
    j.status ?? '—',
    j.source  ?? '—',
    j.completed_at
      ? format(new Date(j.completed_at), 'dd.MM.yyyy HH:mm')
      : '—',
  ].join(';'))

  const csv  = [header, ...rows].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `jobs_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Stat card ────────────────────────────────
function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p className={cn('text-2xl font-black', color)}>{value}</p>
    </div>
  )
}

// ─── Edit modal ────────────────────────────────
function EditModal({
  job,
  onClose,
  onSave,
}: {
  job:     JobRow
  onClose: () => void
  onSave:  (id: string, patch: any) => Promise<void>
}) {
  const [form, setForm] = useState({
    cargo:           job.cargo            ?? '',
    origin_city:     jobCity(job, 'from'),
    destination_city:jobCity(job, 'to'),
    distance_km:     job.distance_km      ?? 0,
    income:          jobIncome(job),
    damage_percent:  job.damage_percent   ?? 0,
    status:          job.status           ?? 'completed',
    notes:           job.notes            ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(job.id, form)
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.95, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800
                   rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-white">Edytuj zlecenie</h2>
          </div>
          <button onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trasa */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
            <span className="text-xs font-mono text-zinc-700">{job.id.slice(0, 8)}…</span>
            <span className="text-zinc-700">•</span>
            <span>{job.member?.username ?? '—'}</span>
          </div>
        </div>

        {/* Pola */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          {[
            { key: 'origin_city',      label: 'Miasto startowe',  type: 'text'   },
            { key: 'destination_city', label: 'Miasto docelowe',  type: 'text'   },
            { key: 'cargo',            label: 'Ładunek',          type: 'text',   span: true },
            { key: 'distance_km',      label: 'Dystans (km)',     type: 'number' },
            { key: 'income',           label: 'Zarobki (€)',      type: 'number' },
            { key: 'damage_percent',   label: 'Uszkodzenia (%)',  type: 'number' },
          ].map(({ key, label, type, span }) => (
            <div key={key} className={cn('space-y-1', span && 'col-span-2')}>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                {label}
              </label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({
                  ...f,
                  [key]: type === 'number' ? +e.target.value : e.target.value,
                }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg
                           px-3 py-2 text-sm text-zinc-100 outline-none
                           focus:border-amber-500/60 transition-colors"
              />
            </div>
          ))}

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
              Status
            </label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg
                         px-3 py-2 text-sm text-zinc-100 outline-none
                         focus:border-amber-500/60 transition-colors"
            >
              {['completed', 'open', 'taken', 'cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Notatki */}
          <div className="space-y-1 col-span-2">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
              Notatki
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg
                         px-3 py-2 text-sm text-zinc-100 outline-none resize-none
                         focus:border-amber-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4
                        border-t border-zinc-800">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200
                       transition-colors">
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500
                       hover:bg-amber-400 text-black text-sm font-bold
                       rounded-lg transition-colors disabled:opacity-50"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save    className="w-4 h-4" />
            }
            Zapisz
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Główny komponent ──────────────────────────
export function AdminJobsClient({ initialJobs, members, stats }: Props) {
  const [jobs,       setJobs]       = useState<JobRow[]>(initialJobs)
  const [search,     setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterMember, setFilterMember] = useState<string>('all')
  const [sortKey,    setSortKey]    = useState<SortKey>('created_at')
  const [sortDir,    setSortDir]    = useState<SortDir>('desc')
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [editJob,    setEditJob]    = useState<JobRow | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [, startT]                  = useTransition()

  // ── Filtrowanie + sortowanie ────────────────
  const filtered = useMemo(() => {
    let list = [...jobs]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(j =>
        j.member?.username?.toLowerCase().includes(q) ||
        jobCity(j, 'from').toLowerCase().includes(q)  ||
        jobCity(j, 'to').toLowerCase().includes(q)    ||
        (j.cargo ?? '').toLowerCase().includes(q)
      )
    }

    if (filterStatus !== 'all') list = list.filter(j => j.status === filterStatus)
    if (filterSource !== 'all') list = list.filter(j => j.source === filterSource)
    if (filterMember !== 'all') list = list.filter(j => j.member_id === filterMember)

    list.sort((a, b) => {
      let va: any, vb: any
      switch (sortKey) {
        case 'distance_km':      va = a.distance_km    ?? 0; vb = b.distance_km    ?? 0; break
        case 'income':           va = jobIncome(a);           vb = jobIncome(b);           break
        case 'damage_percent':   va = a.damage_percent ?? 0; vb = b.damage_percent ?? 0; break
        case 'username':         va = a.member?.username ?? ''; vb = b.member?.username ?? ''; break
        default:                 va = a.created_at ?? ''; vb = b.created_at ?? ''
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })

    return list
  }, [jobs, search, filterStatus, filterSource, filterMember, sortKey, sortDir])

  // ── Sort toggle ─────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-700" />
    return sortDir === 'asc'
      ? <ChevronUp   className="w-3.5 h-3.5 text-amber-400" />
      : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
  }

  // ── Selekcja ────────────────────────────────
  const allSelected  = filtered.length > 0 && filtered.every(j => selected.has(j.id))
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map(j => j.id)))
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Delete ──────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    const res = await deleteJob(id)
    if (res.ok) {
      setJobs(prev => prev.filter(j => j.id !== id))
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
      toast.success('Job usunięty')
    } else {
      toast.error(`Błąd: ${res.error}`)
    }
    setDeleteConfirm(null)
  }, [])

  const handleDeleteSelected = useCallback(async () => {
    const ids = [...selected]
    const res = await deleteJobs(ids)
    if (res.ok) {
      setJobs(prev => prev.filter(j => !ids.includes(j.id)))
      setSelected(new Set())
      toast.success(`Usunięto ${ids.length} jobów`)
    } else {
      toast.error(`Błąd: ${res.error}`)
    }
  }, [selected])

  // ── Update ──────────────────────────────────
  const handleUpdate = useCallback(async (id: string, patch: any) => {
    const res = await updateJob(id, patch)
    if (res.ok) {
      setJobs(prev => prev.map(j =>
        j.id === id ? {
          ...j, ...patch,
          origin_city:      patch.origin_city      ?? j.origin_city,
          destination_city: patch.destination_city ?? j.destination_city,
          from_city:        patch.origin_city      ?? j.from_city,
          to_city:          patch.destination_city ?? j.to_city,
        } : j
      ))
      toast.success('Job zaktualizowany')
      setEditJob(null)
    } else {
      toast.error(`Błąd: ${res.error}`)
    }
  }, [])

  // ── Render ──────────────────────────────────
  return (
    <>
      {/* ── Statystyki ───────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Package}    label="Wszystkich jobów"  color="text-amber-400"
          value={stats.total.toLocaleString('pl-PL')} />
        <StatCard icon={Route}      label="Łączny dystans"    color="text-blue-400"
          value={`${stats.totalKm.toLocaleString('pl-PL')} km`} />
        <StatCard icon={DollarSign} label="Łączne zarobki"    color="text-green-400"
          value={`€${stats.totalIncome.toLocaleString('pl-PL')}`} />
        <StatCard icon={Gauge}      label="Śr. uszkodzenia"   color="text-red-400"
          value={`${stats.avgDmg.toFixed(1)}%`} />
      </div>

      {/* ── Filtry ───────────────────────────── */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-center">

          {/* Szukaj */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2
                               w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj kierowcy, miasta, ładunku..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg
                         pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-600
                         outline-none focus:border-amber-500/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-zinc-600 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                       text-sm text-zinc-300 outline-none focus:border-amber-500/50
                       transition-colors"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="completed">Ukończone</option>
            <option value="open">Otwarte</option>
            <option value="taken">Podjęte</option>
            <option value="cancelled">Anulowane</option>
          </select>

          {/* Źródło */}
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                       text-sm text-zinc-300 outline-none focus:border-amber-500/50
                       transition-colors"
          >
            <option value="all">Wszystkie źródła</option>
            <option value="bridge">Bridge (auto)</option>
            <option value="manual">Ręczne</option>
          </select>

          {/* Kierowca */}
          <select
            value={filterMember}
            onChange={e => setFilterMember(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                       text-sm text-zinc-300 outline-none focus:border-amber-500/50
                       transition-colors max-w-[180px]"
          >
            <option value="all">Wszyscy kierowcy</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.username}</option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800
                       hover:bg-zinc-700 border border-zinc-700 rounded-lg
                       text-sm text-zinc-400 hover:text-zinc-200 transition-colors
                       shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>

        {/* Pasek akcji masowych */}
        <AnimatePresence>
          {someSelected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{    height: 0,      opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-800">
                <span className="text-sm text-amber-400 font-semibold">
                  {selected.size} zaznaczonych
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10
                             hover:bg-red-500/20 border border-red-500/20 rounded-lg
                             text-sm text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Usuń zaznaczone
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Odznacz wszystkie
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tabela ───────────────────────────── */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">

        {/* Info bar */}
        <div className="flex items-center justify-between px-5 py-3
                        border-b border-zinc-800/60">
          <span className="text-xs text-zinc-500">
            Wyświetlono{' '}
            <span className="text-zinc-300 font-semibold">{filtered.length}</span>
            {' '}z{' '}
            <span className="text-zinc-300 font-semibold">{jobs.length}</span>
            {' '}jobów
          </span>
          {(search || filterStatus !== 'all' || filterSource !== 'all' || filterMember !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setFilterStatus('all')
                setFilterSource('all')
                setFilterMember('all')
              }}
              className="flex items-center gap-1 text-xs text-amber-400
                         hover:text-amber-300 transition-colors"
            >
              <X className="w-3 h-3" /> Wyczyść filtry
            </button>
          )}
        </div>

        {/* Nagłówki */}
        <div className="grid grid-cols-[2rem_1fr_2fr_1fr_1fr_1fr_1fr_5rem]
                        gap-x-3 px-4 py-2.5 border-b border-zinc-800/60
                        text-[11px] text-zinc-600 uppercase tracking-wider font-medium">
          <button onClick={toggleAll} className="flex items-center justify-center">
            {allSelected
              ? <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              : <Square      className="w-3.5 h-3.5" />
            }
          </button>
          <button onClick={() => toggleSort('username')}
            className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
            Kierowca <SortIcon k="username" />
          </button>
          <span>Trasa</span>
          <button onClick={() => toggleSort('distance_km')}
            className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
            Dystans <SortIcon k="distance_km" />
          </button>
          <button onClick={() => toggleSort('income')}
            className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
            Zarobki <SortIcon k="income" />
          </button>
          <button onClick={() => toggleSort('damage_percent')}
            className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
            Uszkodz. <SortIcon k="damage_percent" />
          </button>
          <button onClick={() => toggleSort('created_at')}
            className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
            Data <SortIcon k="created_at" />
          </button>
          <span>Akcje</span>
        </div>

        {/* Wiersze */}
        <div className="divide-y divide-zinc-800/40">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="w-10 h-10 text-zinc-800 mb-3" />
              <p className="text-zinc-500 font-medium">Brak wyników</p>
              <p className="text-xs text-zinc-700 mt-1">Zmień filtry lub wyszukiwanie</p>
            </div>
          ) : (
            filtered.map(job => (
              <motion.div
                key={job.id}
                layout
                className={cn(
                  'grid grid-cols-[2rem_1fr_2fr_1fr_1fr_1fr_1fr_5rem]',
                  'gap-x-3 px-4 py-3 items-center',
                  'hover:bg-white/[0.02] transition-colors',
                  selected.has(job.id) && 'bg-amber-500/[0.03]',
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleOne(job.id)}
                  className="flex items-center justify-center"
                >
                  {selected.has(job.id)
                    ? <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                    : <Square      className="w-3.5 h-3.5 text-zinc-700 hover:text-zinc-500" />
                  }
                </button>

                {/* Kierowca */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center
                                  justify-center shrink-0 overflow-hidden">
                    {job.member?.avatar_url ? (
                      <img src={job.member.avatar_url} alt=""
                        className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">
                      {job.member?.username ?? '—'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full border font-medium',
                        sourceBadge(job.source)
                      )}>
                        {job.source ?? 'manual'}
                      </span>
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full border font-medium',
                        statusBadge(job.status)
                      )}>
                        {job.status ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trasa */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-300 truncate max-w-[90px]">
                      {jobCity(job, 'from')}
                    </span>
                    <ArrowRight className="w-3 h-3 text-amber-500/60 shrink-0" />
                    <span className="text-xs text-zinc-300 truncate max-w-[90px]">
                      {jobCity(job, 'to')}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                    {job.cargo ?? '—'}
                  </p>
                </div>

                {/* Dystans */}
                <div className="text-sm font-bold text-blue-400">
                  {job.distance_km
                    ? `${job.distance_km.toLocaleString('pl-PL')} km`
                    : <span className="text-zinc-700">—</span>
                  }
                </div>

                {/* Zarobki */}
                <div className="text-sm font-bold text-green-400">
                  {jobIncome(job) > 0
                    ? `€${jobIncome(job).toLocaleString('pl-PL')}`
                    : <span className="text-zinc-700">—</span>
                  }
                </div>

                {/* Uszkodzenia */}
                <div>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    dmgColor(job.damage_percent ?? 0)
                  )}>
                    {(job.damage_percent ?? 0).toFixed(1)}%
                  </span>
                </div>

                {/* Data */}
                <div className="text-[11px] text-zinc-600">
                  {job.completed_at
                    ? formatDistanceToNow(new Date(job.completed_at), {
                        addSuffix: true, locale: pl,
                      })
                    : '—'
                  }
                </div>

                {/* Akcje */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditJob(job)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500/20
                               text-zinc-500 hover:text-amber-400 transition-colors"
                    title="Edytuj"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(job.id)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20
                               text-zinc-500 hover:text-red-400 transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* ── Modal edycji ─────────────────────── */}
      <AnimatePresence>
        {editJob && (
          <EditModal
            job={editJob}
            onClose={() => setEditJob(null)}
            onSave={handleUpdate}
          />
        )}
      </AnimatePresence>

      {/* ── Potwierdzenie usunięcia ───────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center
                       bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              exit={{    scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800
                         rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center
                                justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Usuń zlecenie</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Tej akcji nie można cofnąć
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 text-sm text-zinc-400 hover:text-zinc-200
                             bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2 text-sm font-bold text-white
                             bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  Usuń
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
