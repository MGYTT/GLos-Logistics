'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, ArrowRight, Gauge, Fuel, MapPin,
  Navigation, Package, Clock, Zap,
  AlertTriangle, WifiOff, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Typy ──────────────────────────────────────
interface Telemetry {
  has_job:               boolean
  from_city:             string | null
  from_company:          string | null
  to_city:               string | null
  to_company:            string | null
  cargo:                 string | null
  cargo_weight_kg:       number | null
  income:                number | null
  job_max_distance:      number | null
  distance_remaining_km: number | null
  eta_minutes:           number | null
  truck_brand:           string | null
  truck_model:           string | null
  speed_kmh:             number | null
  fuel_liters:           number | null
  fuel_capacity:         number | null
  odometer:              number | null
  rpm:                   number | null
  gear:                  number | null
  game_time:             string | null
  updated_at:            string
}

interface Props {
  memberId:         string
  initialTelemetry: Telemetry | null
}

// ─── Stałe ──────────────────────────────────────
const ONLINE_THRESHOLD_S = 35   // 10s interval Bridge + 25s tolerancja
const POLL_INTERVAL_MS   = 12_000 // polling fallback co 12s

// ─── Helpers ────────────────────────────────────
function isOnline(t: Telemetry | null): boolean {
  if (!t?.updated_at) return false
  return (Date.now() - new Date(t.updated_at).getTime()) / 1000 < ONLINE_THRESHOLD_S
}

function jobProgress(remaining: number | null, total: number | null): number {
  if (!remaining || !total || total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)))
}

function formatEta(min: number | null): string | null {
  if (!min || min <= 0) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatGameTime(str: string | null): string | null {
  if (!str) return null
  try {
    const d = new Date(str)
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`
  } catch { return null }
}

function gearLabel(gear: number | null): string {
  if (gear == null) return '—'
  if (gear > 0)   return `D${gear}`
  if (gear === 0) return 'N'
  return 'R'
}

// ─── StatTile ───────────────────────────────────
function StatTile({ icon, label, value, color, sub }: {
  icon:   React.ReactNode
  label:  string
  value:  string
  color?: string
  sub?:   string
}) {
  return (
    <div className="bg-zinc-800/50 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-zinc-600 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={cn('text-sm font-bold truncate', color ?? 'text-zinc-200')}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Główny komponent ───────────────────────────
export function TelemetryBanner({ memberId, initialTelemetry }: Props) {
  const [telemetry,    setTelemetry]    = useState<Telemetry | null>(initialTelemetry)
  const [online,       setOnline]       = useState(isOnline(initialTelemetry))
  const [expanded,     setExpanded]     = useState(false)
  const [realtimeOk,   setRealtimeOk]   = useState(false)   // czy WS działa
  const [lastPollErr,  setLastPollErr]  = useState(false)

  const telRef    = useRef<Telemetry | null>(initialTelemetry)
  const supabase  = createClient()

  // ── Pobierz dane przez REST (polling fallback) ──
  const fetchTelemetry = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('member_telemetry')
        .select('*')
        .eq('member_id', memberId)
        .maybeSingle()

      if (error) {
        // RLS error — zaloguj dla dewelopera
        console.warn('[TelemetryBanner] fetch error:', error.message)
        setLastPollErr(true)
        return
      }

      setLastPollErr(false)

      if (data) {
        const t = data as Telemetry
        telRef.current = t
        setTelemetry(t)
        setOnline(isOnline(t))
      } else {
        // Brak rekordu — Bridge nigdy nie był uruchomiony
        setOnline(false)
      }
    } catch (e) {
      console.warn('[TelemetryBanner] fetch exception:', e)
    }
  }, [memberId])

  // ── Subskrypcja Realtime + polling fallback ──
  useEffect(() => {
  // ZAWSZE fetchuj świeże dane przy mount — nie ufaj initialTelemetry z SSR
  // bo mogło być pobrane minuty temu
  fetchTelemetry()

  const channel = supabase
    .channel(`tel_${memberId}_${Date.now()}`)
    .on('postgres_changes', {
      event:  '*',              // ← było UPDATE + INSERT osobno, teraz '*' łapie oba
      schema: 'public',
      table:  'member_telemetry',
      filter: `member_id=eq.${memberId}`,
    }, ({ new: updated }) => {
      const t = updated as Telemetry
      telRef.current = t
      setTelemetry(t)
      setOnline(isOnline(t))
      setRealtimeOk(true)
    })
    .subscribe(status => {
      if (status === 'SUBSCRIBED')    setRealtimeOk(true)
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setRealtimeOk(false)
      }
    })

  const pollTimer   = setInterval(fetchTelemetry, POLL_INTERVAL_MS)
  const onlineTimer = setInterval(() => setOnline(isOnline(telRef.current)), 5_000)

  return () => {
    supabase.removeChannel(channel)
    clearInterval(pollTimer)
    clearInterval(onlineTimer)
  }
}, [memberId, fetchTelemetry])

  // ── Obliczenia UI ─────────────────────────────
  const t        = telemetry
  const fuelPct  = (t?.fuel_liters && t?.fuel_capacity && t.fuel_capacity > 0)
    ? Math.min(100, Math.round((t.fuel_liters / t.fuel_capacity) * 100))
    : null
  const progress  = jobProgress(t?.distance_remaining_km ?? null, t?.job_max_distance ?? null)
  const eta       = formatEta(t?.eta_minutes ?? null)
  const gameTime  = formatGameTime(t?.game_time ?? null)
  const overSpeed = (t?.speed_kmh ?? 0) > 90
  const fuelLow   = fuelPct !== null && fuelPct < 20

  // ── Offline state ─────────────────────────────
  if (!online) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
        <WifiOff className="w-4 h-4 text-zinc-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-zinc-600">
            Bridge offline —{' '}
            <span className="text-zinc-500">uruchom START_VTC.bat aby zobaczyć telemetrię live</span>
          </span>
          {lastPollErr && (
            <p className="text-[10px] text-red-500/70 mt-0.5">
              Błąd odczytu danych — sprawdź polityki RLS tabeli member_telemetry
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={fetchTelemetry}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-700 hover:text-zinc-400 transition-colors shrink-0"
          title="Odśwież"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1,  y: 0  }}
      className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-zinc-900/80 backdrop-blur-sm"
    >
      {/* Progress bar */}
      {t?.has_job && (t?.job_max_distance ?? 0) > 0 && (
        <div className="h-0.5 bg-zinc-800 w-full">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
          />
        </div>
      )}

      {/* Główna linia */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">

        {/* Status dot */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-2.5 h-2.5">
            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
            <span className="relative block w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <Truck className="w-4 h-4 text-green-400" />
          <span className="text-xs font-black text-green-400 uppercase tracking-wider">
            Live
          </span>
          {/* Realtime / polling indicator */}
          <span className={cn(
            'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
            realtimeOk
              ? 'bg-green-500/10 text-green-600'
              : 'bg-amber-500/10 text-amber-600'
          )}>
            {realtimeOk ? 'WS' : 'POLL'}
          </span>
        </div>

        <div className="hidden sm:block w-px h-4 bg-zinc-800 shrink-0" />

        {/* Ciężarówka */}
        {(t?.truck_brand || t?.truck_model) && (
          <>
            <span className="text-xs text-zinc-500 shrink-0">
              {[t.truck_brand, t.truck_model].filter(Boolean).join(' ')}
            </span>
            <div className="hidden sm:block w-px h-4 bg-zinc-800 shrink-0" />
          </>
        )}

        {/* Trasa */}
        {t?.has_job && t.from_city && t.to_city ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-sm font-semibold text-white truncate max-w-[90px] sm:max-w-[130px]">
              {t.from_city}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-sm font-semibold text-white truncate max-w-[90px] sm:max-w-[130px]">
              {t.to_city}
            </span>
          </div>
        ) : (
          <span className="text-sm text-zinc-600 italic">Brak aktywnego zlecenia</span>
        )}

        {/* Stats — prawa strona */}
        <div className="flex items-center gap-3 sm:ml-auto flex-wrap">

          {/* Prędkość */}
          {t?.speed_kmh != null && (
            <div className="flex items-center gap-1.5">
              {overSpeed && (
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              )}
              <Gauge className={cn('w-3.5 h-3.5', overSpeed ? 'text-red-400' : 'text-green-400')} />
              <span className={cn('text-sm font-black tabular-nums', overSpeed ? 'text-red-400' : 'text-green-400')}>
                {t.speed_kmh}
              </span>
              <span className="text-[10px] text-zinc-600">km/h</span>
            </div>
          )}

          {/* Dystans */}
          {t?.has_job && (t?.distance_remaining_km ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-sm font-black tabular-nums text-blue-400">
                {t.distance_remaining_km}
              </span>
              <span className="text-[10px] text-zinc-600">km</span>
            </div>
          )}

          {/* Paliwo */}
          {fuelPct !== null && (
            <div className="flex items-center gap-1.5">
              <Fuel className={cn('w-3.5 h-3.5 shrink-0', fuelLow ? 'text-red-400' : 'text-zinc-500')} />
              <div className="w-14 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${fuelPct}%` }}
                  transition={{ duration: 0.5 }}
                  className={cn('h-full rounded-full',
                    fuelLow         ? 'bg-red-400' :
                    fuelPct < 50    ? 'bg-amber-400' :
                                      'bg-green-400'
                  )}
                />
              </div>
              <span className={cn('text-xs tabular-nums', fuelLow ? 'text-red-400' : 'text-zinc-500')}>
                {fuelPct}%
              </span>
            </div>
          )}

          {/* ETA */}
          {eta && t?.has_job && (
            <div className="hidden md:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-xs text-zinc-400 tabular-nums">{eta}</span>
            </div>
          )}

          {/* Progress % */}
          {t?.has_job && progress > 0 && (
            <div className="hidden lg:flex items-center gap-1">
              <span className="text-xs font-black text-amber-400 tabular-nums">{progress}%</span>
              <span className="text-[10px] text-zinc-600">trasy</span>
            </div>
          )}

          {/* Expand */}
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors ml-1"
            aria-label={expanded ? 'Zwiń szczegóły' : 'Rozwiń szczegóły'}
          >
            {expanded
              ? <ChevronUp   className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />
            }
          </button>
        </div>
      </div>

      {/* Panel szczegółów */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0,      opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{    height: 0,      opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-zinc-800/60"
          >
            <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">

              {t?.cargo && (
                <StatTile icon={<Package    className="w-3.5 h-3.5" />} label="Ładunek"
                  value={t.cargo} color="text-amber-400" />
              )}
              {(t?.cargo_weight_kg ?? 0) > 0 && (
                <StatTile icon={<Package    className="w-3.5 h-3.5" />} label="Masa"
                  value={`${Math.round(t!.cargo_weight_kg! / 1000)}t`} />
              )}
              {(t?.income ?? 0) > 0 && (
                <StatTile icon={<Zap        className="w-3.5 h-3.5" />} label="Zarobki"
                  value={`€${t!.income!.toLocaleString('pl-PL')}`} color="text-green-400" />
              )}
              {(t?.job_max_distance ?? 0) > 0 && (
                <StatTile icon={<Navigation className="w-3.5 h-3.5" />} label="Cały dystans"
                  value={`${t!.job_max_distance} km`} color="text-blue-400" />
              )}
              {t?.has_job && progress > 0 && (
                <StatTile icon={<Navigation className="w-3.5 h-3.5" />} label="Ukończono"
                  value={`${progress}%`} color="text-amber-400"
                  sub={`${(t!.job_max_distance ?? 0) - (t!.distance_remaining_km ?? 0)} km`} />
              )}
              {t?.fuel_liters != null && (
                <StatTile icon={<Fuel       className="w-3.5 h-3.5" />} label="Paliwo"
                  value={`${Math.round(t.fuel_liters)}L`}
                  color={fuelLow ? 'text-red-400' : undefined}
                  sub={t.fuel_capacity ? `/ ${Math.round(t.fuel_capacity)}L` : undefined} />
              )}
              {(t?.rpm ?? 0) > 0 && (
                <StatTile icon={<Zap        className="w-3.5 h-3.5" />} label="RPM"
                  value={t!.rpm!.toLocaleString('pl-PL')} />
              )}
              {t?.gear != null && (
                <StatTile icon={<Truck      className="w-3.5 h-3.5" />} label="Bieg"
                  value={gearLabel(t.gear)} />
              )}
              {gameTime && (
                <StatTile icon={<Clock      className="w-3.5 h-3.5" />} label="Czas gry"
                  value={gameTime} color="text-zinc-400" />
              )}
              {(t?.odometer ?? 0) > 0 && (
                <StatTile icon={<Navigation className="w-3.5 h-3.5" />} label="Przebieg"
                  value={`${Math.round(t!.odometer!).toLocaleString('pl-PL')} km`}
                  color="text-zinc-400" />
              )}
              {t?.from_company && (
                <StatTile icon={<MapPin     className="w-3.5 h-3.5" />} label="Od firmy"
                  value={t.from_company} color="text-zinc-400" />
              )}
              {t?.to_company && (
                <StatTile icon={<MapPin     className="w-3.5 h-3.5" />} label="Do firmy"
                  value={t.to_company} color="text-zinc-400" />
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
