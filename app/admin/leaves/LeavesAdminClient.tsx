'use client'

import { useState, useMemo }       from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast }                   from 'sonner'
import { format, differenceInDays } from 'date-fns'
import { pl }                      from 'date-fns/locale'
import {
  Umbrella, Stethoscope, UmbrellaOff, ShieldAlert,
  Clock, CheckCircle2, XCircle, Search, Filter,
  Plus, Users, CalendarDays, TrendingUp, AlertCircle,
  Check, X, Eye, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { cn }     from '@/lib/utils/cn'
import type { MemberLeave, LeaveType, LeaveStatus } from '@/types'
import { LEAVE_LABELS, LEAVE_COLORS } from '@/lib/vtc/payCalculator'
import { reviewLeave, forceLeave } from './actions'

// ─── Typy ──────────────────────────────────────────────────
interface MemberRow {
  id:         string
  username:   string
  avatar_url: string | null
  rank:       string
}

interface Props {
  leaves:  MemberLeave[]
  members: MemberRow[]
  adminId: string
  stats: {
    activeNow: number
    pending:   number
    thisMonth: number
    total:     number
    byType: {
      paid:   number
      sick:   number
      unpaid: number
      forced: number
    }
  }
}

type Tab    = 'all' | 'pending' | 'active' | 'history'
type Modal  = 'review' | 'force' | 'detail' | null

// ─── Helpers ───────────────────────────────────────────────
const LEAVE_ICONS: Record<LeaveType, React.ElementType> = {
  paid:   Umbrella,
  sick:   Stethoscope,
  unpaid: UmbrellaOff,
  forced: ShieldAlert,
}

const STATUS_CONFIG: Record<LeaveStatus, {
  label: string; color: string; bg: string; icon: React.ElementType
}> = {
  pending:  { label: 'Oczekuje',     color: 'text-amber-400', bg: 'bg-amber-400/10',  icon: Clock        },
  approved: { label: 'Zatwierdzony', color: 'text-green-400', bg: 'bg-green-400/10',  icon: CheckCircle2 },
  active:   { label: 'Aktywny',      color: 'text-blue-400',  bg: 'bg-blue-400/10',   icon: CheckCircle2 },
  rejected: { label: 'Odrzucony',    color: 'text-red-400',   bg: 'bg-red-400/10',    icon: XCircle      },
  ended:    { label: 'Zakończony',   color: 'text-zinc-500',  bg: 'bg-zinc-500/10',   icon: CheckCircle2 },
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 overflow-hidden
                    flex items-center justify-center text-amber-400 text-sm font-bold">
      {url
        ? <img src={url} alt="" className="w-full h-full object-cover" />
        : (name[0] ?? '?').toUpperCase()
      }
    </div>
  )
}

function leaveDays(leave: MemberLeave) {
  return differenceInDays(new Date(leave.end_date), new Date(leave.start_date)) + 1
}

// ─── Modal szczegółów + recenzji ──────────────────────────
function ReviewModal({
  leave,
  onClose,
  onDone,
}: {
  leave:   MemberLeave
  onClose: () => void
  onDone:  () => void
}) {
  const [note,    setNote]    = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  const Icon = LEAVE_ICONS[leave.type]
  const days = leaveDays(leave)

  async function handle(action: 'approved' | 'rejected') {
    setLoading(action === 'approved' ? 'approve' : 'reject')
    const result = await reviewLeave(leave.id, action, note || undefined)
    setLoading(null)
    if (!result.ok) { toast.error(result.error ?? 'Błąd'); return }
    toast.success(action === 'approved' ? 'Wniosek zatwierdzony ✓' : 'Wniosek odrzucony')
    onDone()
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
            LEAVE_COLORS[leave.type].bg)}>
            <Icon className={cn('w-5 h-5', LEAVE_COLORS[leave.type].color)} />
          </div>
          <div>
            <h2 className="text-lg font-black">Rozpatrz wniosek</h2>
            <p className="text-xs text-zinc-500">{LEAVE_LABELS[leave.type]}</p>
          </div>
        </div>

        {/* Info o wniosku */}
        <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2.5 mb-4">
          <div className="flex items-center gap-3">
            <Avatar url={leave.member?.avatar_url ?? null} name={leave.member?.username ?? '?'} />
            <div>
              <p className="text-sm font-semibold">{leave.member?.username ?? '—'}</p>
              <p className="text-xs text-zinc-500">{leave.member?.rank}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-zinc-900/60 rounded-lg p-2.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Od</p>
              <p className="text-sm font-semibold mt-0.5">
                {format(new Date(leave.start_date), 'd MMM yyyy', { locale: pl })}
              </p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-2.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Do</p>
              <p className="text-sm font-semibold mt-0.5">
                {format(new Date(leave.end_date), 'd MMM yyyy', { locale: pl })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs text-zinc-500">Czas trwania</span>
            <span className={cn('text-sm font-bold', LEAVE_COLORS[leave.type].color)}>
              {days} {days === 1 ? 'dzień' : 'dni'}
            </span>
          </div>

          {leave.reason && (
            <div className="pt-1 border-t border-zinc-700/50">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                Powód kierowcy
              </p>
              <p className="text-sm text-zinc-300">{leave.reason}</p>
            </div>
          )}
        </div>

        {/* Notatka admina */}
        <div className="space-y-1.5 mb-5">
          <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            Notatka admina <span className="normal-case text-zinc-600">(opcjonalnie)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="np. Brak zastępstwa w tym terminie..."
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl
                       px-3 py-2.5 text-sm text-zinc-100 outline-none
                       focus:border-amber-500/60 resize-none transition-colors"
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline" onClick={onClose}
            disabled={loading !== null}
            className="flex-1 border-zinc-700"
          >
            Anuluj
          </Button>
          <Button
            onClick={() => handle('rejected')}
            disabled={loading !== null}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400
                       border border-red-500/20 font-bold gap-2"
          >
            {loading === 'reject' ? (
              <span className="w-4 h-4 rounded-full border-2 border-red-400/30
                               border-t-red-400 animate-spin" />
            ) : <X className="w-4 h-4" />}
            Odrzuć
          </Button>
          <Button
            onClick={() => handle('approved')}
            disabled={loading !== null}
            className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold gap-2"
          >
            {loading === 'approve' ? (
              <span className="w-4 h-4 rounded-full border-2 border-black/30
                               border-t-black animate-spin" />
            ) : <Check className="w-4 h-4" />}
            Zatwierdź
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Modal przymusowego wolnego ────────────────────────────
function ForceLeaveModal({
  members,
  onClose,
  onDone,
}: {
  members: MemberRow[]
  onClose: () => void
  onDone:  () => void
}) {
  const [memberId,  setMemberId]  = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [note,      setNote]      = useState('')
  const [loading,   setLoading]   = useState(false)

  const days = startDate && endDate
    ? Math.max(0, differenceInDays(new Date(endDate), new Date(startDate)) + 1)
    : 0

  async function submit() {
    if (!memberId)  { toast.error('Wybierz kierowcę'); return }
    if (!startDate) { toast.error('Podaj datę początku'); return }
    if (!endDate)   { toast.error('Podaj datę końca'); return }
    if (days <= 0)  { toast.error('Nieprawidłowe daty'); return }

    setLoading(true)
    const result = await forceLeave(memberId, startDate, endDate, note || undefined)
    setLoading(false)

    if (!result.ok) { toast.error(result.error ?? 'Błąd'); return }
    toast.success('Przymusowe wolne nałożone')
    onDone()
    onClose()
  }

  const selectClass =
    'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 ' +
    'text-sm text-zinc-100 outline-none focus:border-amber-500/60 transition-colors'

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-black">Przymusowe wolne</h2>
            <p className="text-xs text-zinc-500">Nałóż na kierowcę bez jego zgody</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Kierowca */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
              Kierowca
            </label>
            <select
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
              className={selectClass}
            >
              <option value="">— wybierz kierowcę —</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.username} ({m.rank})
                </option>
              ))}
            </select>
          </div>

          {/* Daty */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Od
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Do
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>

          {days > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                            bg-red-400/10 text-red-400">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{days} {days === 1 ? 'dzień' : 'dni'}</span>
              <span className="opacity-70">przymusowego wolnego</span>
            </div>
          )}

          {/* Notatka / Powód */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
              Powód
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="np. Naruszenie regulaminu VTC..."
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl
                         px-3 py-2.5 text-sm text-zinc-100 outline-none
                         focus:border-red-500/60 resize-none transition-colors"
            />
          </div>

          <p className="text-xs text-red-400/80 bg-red-500/10 border border-red-500/20
                        rounded-lg px-3 py-2">
            ⚠️ Kierowca nie może odwołać przymusowego wolnego. Zostanie automatycznie
            zaktywowane w dniu {startDate
              ? format(new Date(startDate), 'd MMMM yyyy', { locale: pl })
              : '—'}.
          </p>
        </div>

        <div className="flex gap-3 mt-5">
          <Button
            variant="outline" onClick={onClose} disabled={loading}
            className="flex-1 border-zinc-700"
          >
            Anuluj
          </Button>
          <Button
            onClick={submit} disabled={loading || days === 0}
            className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30
                               border-t-white animate-spin" />
            ) : <ShieldAlert className="w-4 h-4" />}
            Nałóż wolne
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Wiersz urlopu ─────────────────────────────────────────
function LeaveRow({
  leave,
  onReview,
  onDetail,
}: {
  leave:    MemberLeave
  onReview: (l: MemberLeave) => void
  onDetail: (l: MemberLeave) => void
}) {
  const Icon       = LEAVE_ICONS[leave.type]
  const sc         = STATUS_CONFIG[leave.status]
  const StatusIcon = sc.icon
  const days       = leaveDays(leave)
  const today      = new Date().toISOString().split('T')[0]
  const isOngoing  = leave.start_date <= today && leave.end_date >= today
  const daysLeft   = isOngoing
    ? differenceInDays(new Date(leave.end_date), new Date()) + 1
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
    >
      {/* Ikona typu */}
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        LEAVE_COLORS[leave.type].bg)}>
        <Icon className={cn('w-4 h-4', LEAVE_COLORS[leave.type].color)} />
      </div>

      {/* Kierowca */}
      <div className="flex items-center gap-2.5 w-40 shrink-0">
        <Avatar url={leave.member?.avatar_url ?? null} name={leave.member?.username ?? '?'} />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {leave.member?.username ?? '—'}
          </p>
          <p className="text-xs text-zinc-600">{leave.member?.rank}</p>
        </div>
      </div>

      {/* Typ */}
      <div className="hidden md:block w-32 shrink-0">
        <span className={cn('text-xs font-medium', LEAVE_COLORS[leave.type].color)}>
          {LEAVE_LABELS[leave.type]}
        </span>
      </div>

      {/* Daty */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300">
          {format(new Date(leave.start_date), 'd MMM', { locale: pl })}
          {' – '}
          {format(new Date(leave.end_date), 'd MMM yyyy', { locale: pl })}
        </p>
        <p className="text-xs text-zinc-600 mt-0.5">
          {days} {days === 1 ? 'dzień' : 'dni'}
          {daysLeft !== null && (
            <span className="text-blue-400 ml-1">· {daysLeft}d pozostało</span>
          )}
        </p>
      </div>

      {/* Status */}
      <div className="shrink-0">
        <span className={cn(
          'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
          sc.bg, sc.color,
        )}>
          <StatusIcon className="w-3 h-3" />
          {sc.label}
        </span>
      </div>

      {/* Akcje */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onDetail(leave)}
          className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400
                     hover:bg-zinc-700 hover:text-white
                     flex items-center justify-center transition-colors"
          title="Szczegóły"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        {leave.status === 'pending' && (
          <button
            onClick={() => onReview(leave)}
            className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400
                       hover:bg-amber-500/20
                       flex items-center justify-center transition-colors"
            title="Rozpatrz"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Główny komponent ──────────────────────────────────────
export function LeavesAdminClient({ leaves: initial, members, adminId, stats }: Props) {
  const [leaves,       setLeaves]       = useState(initial)
  const [tab,          setTab]          = useState<Tab>('all')
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState<LeaveType | 'all'>('all')
  const [modal,        setModal]        = useState<Modal>(null)
  const [selected,     setSelected]     = useState<MemberLeave | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const filtered = useMemo(() => {
    let list = leaves

    // Tab
    if (tab === 'pending') list = list.filter(l => l.status === 'pending')
    if (tab === 'active')  list = list.filter(l =>
      ['approved', 'active'].includes(l.status) &&
      l.start_date <= today && l.end_date >= today
    )
    if (tab === 'history') list = list.filter(l =>
      ['rejected', 'ended'].includes(l.status) || l.end_date < today
    )

    // Typ
    if (typeFilter !== 'all') list = list.filter(l => l.type === typeFilter)

    // Szukaj
    if (search) list = list.filter(l =>
      l.member?.username.toLowerCase().includes(search.toLowerCase())
    )

    return list
  }, [leaves, tab, typeFilter, search, today])

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'all',     label: 'Wszystkie',  count: leaves.length      },
    { id: 'pending', label: 'Oczekujące', count: stats.pending      },
    { id: 'active',  label: 'Aktywne',    count: stats.activeNow    },
    { id: 'history', label: 'Historia'                               },
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Nagłówek */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Urlopy i Dni Wolne</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Zarządzaj wnioskami urlopowymi kierowców
          </p>
        </div>
        <Button
          onClick={() => setModal('force')}
          className="bg-red-500 hover:bg-red-400 text-white font-bold gap-2 shrink-0"
        >
          <ShieldAlert className="w-4 h-4" />
          <span className="hidden sm:inline">Przymusowe wolne</span>
        </Button>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {[
    {
      label: 'Na urlopie teraz',
      value: stats.activeNow,
      icon:  Umbrella,
      color: 'text-blue-400',
      bg:    'bg-blue-400/10',
    },
    {
      label: 'Oczekujące wnioski',
      value: stats.pending,
      icon:  Clock,
      color: stats.pending > 0 ? 'text-amber-400' : 'text-zinc-500',
      bg:    stats.pending > 0 ? 'bg-amber-400/10' : 'bg-zinc-500/10',
    },
    {
      label: 'W tym miesiącu',
      value: stats.thisMonth,
      icon:  CalendarDays,
      color: 'text-green-400',
      bg:    'bg-green-400/10',
    },
    {
      label: 'Łącznie wniosków',
      value: stats.total,
      icon:  TrendingUp,
      color: 'text-zinc-400',
      bg:    'bg-zinc-400/10',
    },
  ].map(({ label, value, icon: Icon, color, bg }) => (
    <div key={label}
      className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5
                 flex items-center gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className={cn('text-2xl font-black mt-0.5', color)}>{value}</p>
      </div>
    </div>
  ))}
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  {(
    [
      { type: 'paid',   label: 'Urlop płatny',    icon: Umbrella    },
      { type: 'sick',   label: 'L4',              icon: Stethoscope },
      { type: 'unpaid', label: 'Bezpłatny',       icon: UmbrellaOff },
      { type: 'forced', label: 'Przymusowe',      icon: ShieldAlert },
    ] as const
  ).map(({ type, label, icon: Icon }) => (
    <div key={type}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border',
        LEAVE_COLORS[type].bg,
        LEAVE_COLORS[type].border,
      )}>
      <Icon className={cn('w-4 h-4 shrink-0', LEAVE_COLORS[type].color)} />
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className={cn('text-lg font-black', LEAVE_COLORS[type].color)}>
          {stats.byType[type]}
        </p>
      </div>
    </div>
  ))}
</div>
      {/* Baner oczekujących */}
      {stats.pending > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-400/5
                     border border-amber-400/20"
        >
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-bold">{stats.pending}</span>
            {stats.pending === 1
              ? ' wniosek urlopowy czeka na rozpatrzenie'
              : ' wnioski urlopowe czekają na rozpatrzenie'}
          </p>
          <button
            onClick={() => setTab('pending')}
            className="ml-auto text-xs text-amber-400 hover:text-amber-300
                       font-semibold underline underline-offset-2 shrink-0"
          >
            Rozpatrz teraz →
          </button>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg flex-1 justify-center',
              'text-sm font-medium transition-all',
              tab === id
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 3)}</span>
            {count !== undefined && count > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-bold',
                tab === id ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-zinc-500',
                id === 'pending' && count > 0 && 'bg-amber-500/20 text-amber-400',
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filtry */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
                             w-4 h-4 text-zinc-600 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj kierowcy..."
            className="pl-10 bg-zinc-900 border-zinc-700"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-zinc-600 shrink-0" />
          {(['all', 'paid', 'sick', 'unpaid', 'forced'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                typeFilter === t
                  ? t === 'all'
                    ? 'bg-zinc-700 text-white'
                    : `${LEAVE_COLORS[t as LeaveType].bg} ${LEAVE_COLORS[t as LeaveType].color}`
                  : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300',
              )}
            >
              {t === 'all' ? 'Wszystkie' : LEAVE_LABELS[t as LeaveType]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Nagłówek tabeli */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4
                        px-5 py-3 border-b border-zinc-800
                        text-xs text-zinc-500 uppercase tracking-wider font-semibold">
          <span className="w-9" />
          <span>Kierowca</span>
          <span className="w-32">Typ</span>
          <span>Termin</span>
          <span>Status</span>
          <span>Akcje</span>
        </div>

        <div className="divide-y divide-zinc-800/40">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-zinc-600">
              <Umbrella className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">
                {tab === 'pending' ? 'Brak oczekujących wniosków' : 'Brak wyników'}
              </p>
              {tab === 'pending' && (
                <p className="text-xs text-zinc-700 mt-1">
                  Wszyscy kierowcy mają już rozpatrzone wnioski ✓
                </p>
              )}
            </div>
          ) : (
            filtered.map(leave => (
              <LeaveRow
                key={leave.id}
                leave={leave}
                onReview={l => { setSelected(l); setModal('review') }}
                onDetail={l => { setSelected(l); setModal('detail') }}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'review' && selected && (
          <ReviewModal
            leave={selected}
            onClose={() => { setModal(null); setSelected(null) }}
            onDone={() => window.location.reload()}
          />
        )}

        {modal === 'detail' && selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                       flex items-center justify-center p-4"
            onClick={() => { setModal(null); setSelected(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl
                         p-6 w-full max-w-sm shadow-2xl"
            >
              {(() => {
                const Icon = LEAVE_ICONS[selected.type]
                const sc   = STATUS_CONFIG[selected.status]
                const StatusIcon = sc.icon
                const days = leaveDays(selected)
                return (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                        LEAVE_COLORS[selected.type].bg)}>
                        <Icon className={cn('w-5 h-5', LEAVE_COLORS[selected.type].color)} />
                      </div>
                      <div>
                        <h2 className="font-black">{LEAVE_LABELS[selected.type]}</h2>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium',
                          sc.color,
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                        <Avatar url={selected.member?.avatar_url ?? null}
                          name={selected.member?.username ?? '?'} />
                        <div>
                          <p className="text-sm font-semibold">{selected.member?.username}</p>
                          <p className="text-xs text-zinc-500">{selected.member?.rank}</p>
                        </div>
                      </div>

                      {[
                        { label: 'Od',            value: format(new Date(selected.start_date), 'd MMMM yyyy', { locale: pl }) },
                        { label: 'Do',            value: format(new Date(selected.end_date),   'd MMMM yyyy', { locale: pl }) },
                        { label: 'Czas trwania',  value: `${days} ${days === 1 ? 'dzień' : 'dni'}` },
                        { label: 'Złożono',       value: format(new Date(selected.created_at), 'd MMM yyyy, HH:mm', { locale: pl }) },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between
                                                    py-2 border-b border-zinc-800/60 last:border-0">
                          <span className="text-xs text-zinc-500">{label}</span>
                          <span className="text-sm font-semibold">{value}</span>
                        </div>
                      ))}

                      {selected.reason && (
                        <div className="p-3 bg-zinc-800/50 rounded-xl">
                          <p className="text-xs text-zinc-500 mb-1">Powód kierowcy</p>
                          <p className="text-sm text-zinc-300">{selected.reason}</p>
                        </div>
                      )}

                      {selected.admin_note && (
                        <div className="p-3 bg-zinc-800/50 rounded-xl">
                          <p className="text-xs text-zinc-500 mb-1">Notatka admina</p>
                          <p className="text-sm text-zinc-300">{selected.admin_note}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-5">
                      <Button
                        variant="outline"
                        onClick={() => { setModal(null); setSelected(null) }}
                        className="flex-1 border-zinc-700"
                      >
                        Zamknij
                      </Button>
                      {selected.status === 'pending' && (
                        <Button
                          onClick={() => setModal('review')}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold"
                        >
                          Rozpatrz
                        </Button>
                      )}
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </motion.div>
        )}

        {modal === 'force' && (
          <ForceLeaveModal
            members={members}
            onClose={() => setModal(null)}
            onDone={() => window.location.reload()}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
