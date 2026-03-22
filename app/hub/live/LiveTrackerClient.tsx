'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  Truck, User, Zap, Package, MapPin,
  ArrowRight, Clock, Fuel, Shield,
  Wifi, WifiOff, Search,
  ChevronDown, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Member, DriverPosition } from '@/types'

// ─── Typy lokalne (rozszerzone) ────────────────
// Job z bazy może mieć różne nazwy kolumn zależnie od migracji
interface RawJob {
  id:               string
  member_id:        string | null
  // nazwy kolumn — obsługujemy obie wersje
  cargo:            string | null
  origin_city:      string | null
  destination_city: string | null
  distance_km:      number | null
  income:           number | null
  damage_percent:   number | null
  fuel_used:        number | null
  completed_at:     string | null
  truckershub_job_id: string | null
  member?: Pick<Member, 'id' | 'username' | 'avatar_url' | 'rank'> | null
}

type Position = DriverPosition & {
  member?: Pick<Member, 'id' | 'username' | 'avatar_url' | 'rank'> | null
}

interface Props {
  initialPositions: Position[]
  initialJobs:      RawJob[]
}

// ─── Helpers ───────────────────────────────────
function rankColor(rank: string) {
  switch (rank) {
    case 'Owner':   return 'text-red-400    bg-red-400/10    border-red-400/20'
    case 'Manager': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    case 'Elite':   return 'text-amber-400  bg-amber-400/10  border-amber-400/20'
    case 'Senior':  return 'text-blue-400   bg-blue-400/10   border-blue-400/20'
    case 'Driver':  return 'text-green-400  bg-green-400/10  border-green-400/20'
    default:        return 'text-zinc-400   bg-zinc-400/10   border-zinc-400/20'
  }
}

function speedColor(kmh: number) {
  if (kmh === 0) return 'text-zinc-600'
  if (kmh <= 60) return 'text-green-400'
  if (kmh <= 90) return 'text-amber-400'
  return 'text-red-400'
}

function speedLabel(kmh: number) {
  if (kmh === 0) return 'Stoi'
  if (kmh < 5)   return 'Wolno'
  return `${Math.round(kmh)} km/h`
}

// ─── Stat pill ─────────────────────────────────
function StatPill({
  icon: Icon, value, label, color,
}: {
  icon:  React.ElementType
  value: string | number
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800
                    rounded-xl px-4 py-3">
      <Icon className={cn('w-4 h-4 shrink-0', color)} />
      <div>
        <p className={cn('text-lg font-black leading-none', color)}>{value}</p>
        <p className="text-[11px] text-zinc-600 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Karta kierowcy ────────────────────────────
function DriverCard({
  position,
  activeJob,
  isNew,
}: {
  position:  Position
  activeJob?: RawJob
  isNew?:     boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const speed  = position.speed  ?? 0
  const online = position.online ?? false

  // Bezpieczne odczyty pól joba
  const fromCity = activeJob?.origin_city      ?? null
  const toCity   = activeJob?.destination_city ?? null
  const cargo    = activeJob?.cargo            ?? null
  const income   = activeJob?.income           ?? 0
  const distKm   = activeJob?.distance_km      ?? 0

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -10, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'bg-zinc-900/60 border rounded-xl overflow-hidden transition-colors duration-300',
        online
          ? 'border-zinc-800 hover:border-zinc-700'
          : 'border-zinc-800/40 opacity-60',
      )}
    >
      {/* Górna belka */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden
                          flex items-center justify-center ring-2 ring-zinc-700/50">
            {position.member?.avatar_url ? (
              <img
                src={position.member.avatar_url}
                alt={position.member.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-zinc-600" />
            )}
          </div>
          {/* Online dot */}
          <span className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full',
            'border-2 border-zinc-900',
            online ? 'bg-green-500' : 'bg-zinc-600',
          )}>
            {online && (
              <span className="absolute inset-0 rounded-full bg-green-500
                               animate-ping opacity-60" />
            )}
          </span>
        </div>

        {/* Imię + ranga */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-zinc-100 truncate">
              {position.member?.username ?? 'Nieznany'}
            </span>
            {position.member?.rank && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0',
                rankColor(position.member.rank),
              )}>
                {position.member.rank}
              </span>
            )}
          </div>

          {/* Status wiersz */}
          <div className="mt-0.5">
            {online ? (
              activeJob ? (
                <span className="flex items-center gap-1 text-[11px] text-amber-400">
                  <Package className="w-3 h-3 shrink-0" />
                  {fromCity && toCity ? (
                    <>
                      <span className="truncate max-w-[70px]">{fromCity}</span>
                      <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate max-w-[70px]">{toCity}</span>
                    </>
                  ) : (
                    <span>{cargo ?? 'Aktywne zlecenie'}</span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-green-400">
                  <Truck className="w-3 h-3" />
                  Bez zlecenia
                </span>
              )
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}
          </div>
        </div>

        {/* Prędkość */}
        {online && (
          <div className="text-right shrink-0">
            <p className={cn('text-sm font-black', speedColor(speed))}>
              {speedLabel(speed)}
            </p>
            {speed > 0 && (
              <p className="text-[10px] text-zinc-700">prędkość</p>
            )}
          </div>
        )}

        <ChevronDown className={cn(
          'w-4 h-4 text-zinc-700 transition-transform shrink-0',
          expanded && 'rotate-180',
        )} />
      </div>

      {/* Szczegóły (expandowane) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{    height: 0,      opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-zinc-800/60">

              {/* Szczegóły zlecenia */}
              {activeJob && (
                <div className="mt-3 space-y-2">
                  {cargo && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600">Ładunek</span>
                      <span className="text-zinc-300 font-medium">{cargo}</span>
                    </div>
                  )}

                  {(fromCity || toCity) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-800/60 rounded-lg p-2.5">
                        <p className="text-[10px] text-zinc-600 mb-1">Skąd</p>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="text-xs font-semibold text-zinc-200 truncate">
                            {fromCity ?? '—'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-zinc-800/60 rounded-lg p-2.5">
                        <p className="text-[10px] text-zinc-600 mb-1">Dokąd</p>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="text-xs font-semibold text-zinc-200 truncate">
                            {toCity ?? '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {(distKm > 0 || income > 0) && (
                    <div className="grid grid-cols-2 gap-2">
                      {distKm > 0 && (
                        <div className="bg-zinc-800/60 rounded-lg p-2.5">
                          <p className="text-[10px] text-zinc-600 mb-1">Dystans</p>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-400 shrink-0" />
                            <span className="text-xs font-semibold text-zinc-200">
                              {distKm.toLocaleString('pl-PL')} km
                            </span>
                          </div>
                        </div>
                      )}
                      {income > 0 && (
                        <div className="bg-zinc-800/60 rounded-lg p-2.5">
                          <p className="text-[10px] text-zinc-600 mb-1">Zarobki</p>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="text-xs font-semibold text-zinc-200">
                              €{income.toLocaleString('pl-PL')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Dane telemetryczne */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="bg-zinc-800/40 rounded-lg p-2 text-center">
                  <Zap className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
                  <p className={cn('text-sm font-black', speedColor(speed))}>
                    {Math.round(speed)}
                  </p>
                  <p className="text-[10px] text-zinc-700">km/h</p>
                </div>

                <div className="bg-zinc-800/40 rounded-lg p-2 text-center">
                  <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
                  <p className="text-sm font-black text-zinc-300">
                    {position.game_time
                      ? String(position.game_time).slice(0, 5)
                      : '—'}
                  </p>
                  <p className="text-[10px] text-zinc-700">czas gry</p>
                </div>

                <div className="bg-zinc-800/40 rounded-lg p-2 text-center">
                  <Wifi className="w-3.5 h-3.5 mx-auto mb-1 text-green-400" />
                  <p className="text-[11px] font-bold text-zinc-400">
                    {position.updated_at
                      ? formatDistanceToNow(new Date(position.updated_at), {
                          locale: pl, addSuffix: false,
                        })
                      : '—'}
                  </p>
                  <p className="text-[10px] text-zinc-700">temu</p>
                </div>
              </div>

              {/* Koordynaty */}
              {(position.x != null || position.z != null) && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-700">
                  <MapPin className="w-3 h-3" />
                  X: {Math.round(position.x ?? 0)},
                  Z: {Math.round(position.z ?? 0)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Główny komponent ──────────────────────────
export function LiveTrackerClient({ initialPositions, initialJobs }: Props) {
  const supabase = createClient()

  const [positions,   setPositions]  = useState<Position[]>(initialPositions)
  const [activeJobs,  setActiveJobs] = useState<RawJob[]>(initialJobs)
  const [newIds,      setNewIds]     = useState<Set<string>>(new Set())
  const [search,      setSearch]     = useState('')
  const [filterState, setFilterState] =
    useState<'all' | 'online' | 'driving' | 'offline'>('all')

  // ── Supabase Realtime ───────────────────────
  useEffect(() => {
    const posSub = supabase
      .channel('live_driver_positions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_positions' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as Position
            setPositions(prev => {
              const idx = prev.findIndex(p => p.member_id === row.member_id)
              if (idx >= 0) {
                const next = [...prev]
                next[idx] = { ...next[idx], ...row }
                return next
              }
              setNewIds(ids => {
                const n = new Set(ids); n.add(row.member_id); return n
              })
              setTimeout(() => setNewIds(ids => {
                const n = new Set(ids); n.delete(row.member_id); return n
              }), 3000)
              return [row, ...prev]
            })
          }
          if (payload.eventType === 'DELETE') {
            setPositions(prev =>
              prev.filter(p => p.member_id !== payload.old.member_id)
            )
          }
        }
      )
      .subscribe()

    const jobSub = supabase
      .channel('live_jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        payload => {
          if (payload.eventType === 'DELETE') {
            setActiveJobs(prev => prev.filter(j => j.id !== payload.old.id))
            return
          }
          const row = payload.new as RawJob
          setActiveJobs(prev => {
            const idx = prev.findIndex(j => j.id === row.id)
            if (idx >= 0) {
              const next = [...prev]; next[idx] = { ...next[idx], ...row }
              return next
            }
            return [row, ...prev]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(posSub)
      supabase.removeChannel(jobSub)
    }
  }, [])

  // ── Job po member_id ────────────────────────
  const jobByMember = useMemo(() => {
    const map = new Map<string, RawJob>()
    activeJobs.forEach(j => { if (j.member_id) map.set(j.member_id, j) })
    return map
  }, [activeJobs])

  // ── Statystyki ──────────────────────────────
  const onlineCount  = positions.filter(p => p.online).length
  const drivingCount = positions.filter(
    p => p.online && jobByMember.has(p.member_id)
  ).length
  const avgSpeed = useMemo(() => {
    const moving = positions.filter(p => p.online && (p.speed ?? 0) > 5)
    if (!moving.length) return 0
    return moving.reduce((s, p) => s + (p.speed ?? 0), 0) / moving.length
  }, [positions])

  // ── Filtrowanie + sortowanie ────────────────
  const filtered = useMemo(() => {
    let list = [...positions]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.member?.username?.toLowerCase().includes(q)
      )
    }
    switch (filterState) {
      case 'online':  list = list.filter(p => p.online); break
      case 'driving': list = list.filter(
        p => p.online && jobByMember.has(p.member_id)
      ); break
      case 'offline': list = list.filter(p => !p.online); break
    }
    return list.sort((a, b) => {
      if (a.online && !b.online) return -1
      if (!a.online && b.online) return  1
      return (b.speed ?? 0) - (a.speed ?? 0)
    })
  }, [positions, search, filterState, jobByMember])

  const filterButtons = [
    { key: 'all'     as const, label: 'Wszyscy',  count: positions.length },
    { key: 'online'  as const, label: 'Online',   count: onlineCount      },
    { key: 'driving' as const, label: 'W trasie', count: drivingCount     },
    { key: 'offline' as const, label: 'Offline',  count: positions.length - onlineCount },
  ]

  return (
    <div className="space-y-5">

      {/* Stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill icon={User}    label="Wszyscy kierowcy"
          value={positions.length}            color="text-zinc-300" />
        <StatPill icon={Wifi}    label="Online teraz"
          value={onlineCount}                 color="text-green-400" />
        <StatPill icon={Package} label="Aktywne zlecenia"
          value={drivingCount}                color="text-amber-400" />
        <StatPill icon={Zap}     label="Śr. prędkość"
          value={`${Math.round(avgSpeed)} km/h`} color="text-blue-400" />
      </div>

      {/* Filtry */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
                             w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj kierowcy..."
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl
                       pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-600
                       outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800
                        rounded-xl p-1">
          {filterButtons.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilterState(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                'text-xs font-semibold transition-all duration-200',
                filterState === key
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              {label}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                filterState === key
                  ? 'bg-black/20 text-black'
                  : 'bg-zinc-800 text-zinc-500',
              )}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Karty kierowców */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Truck className="w-12 h-12 text-zinc-800 mb-4" />
          <p className="text-zinc-500 font-semibold">Brak kierowców</p>
          <p className="text-xs text-zinc-700 mt-1">
            {filterState !== 'all'
              ? 'Nikt nie spełnia kryteriów filtra'
              : 'Brak danych telemetrycznych'}
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(pos => (
              <DriverCard
                key={pos.member_id}
                position={pos}
                activeJob={jobByMember.get(pos.member_id)}
                isNew={newIds.has(pos.member_id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-700 pt-2">
        <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        Dane odświeżane w czasie rzeczywistym przez Supabase Realtime
      </div>
    </div>
  )
}
