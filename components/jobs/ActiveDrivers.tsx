'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, MapPin, ArrowRight, Gauge,
  Fuel, Package, Coins, Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

interface Telemetry {
  member_id:             string
  has_job:               boolean
  from_city:             string | null
  to_city:               string | null
  from_company:          string | null
  to_company:            string | null
  cargo:                 string | null
  cargo_weight_kg:       number | null
  income:                number | null
  distance_remaining_km: number | null
  eta_minutes:           number | null
  truck_brand:           string | null
  truck_model:           string | null
  speed_kmh:             number | null
  fuel_liters:           number | null
  updated_at:            string
  member: {
    username:   string
    avatar_url: string | null
    rank:       string
  } | null
}

export function ActiveDrivers() {
  const [drivers, setDrivers] = useState<Telemetry[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('member_telemetry')
        .select('*, member:member_id(username, avatar_url, rank)')
        .eq('has_job', true)
        .order('updated_at', { ascending: false })
      setDrivers(data ?? [])
    }

    load()

    // Realtime subskrypcja
    const channel = supabase
      .channel('member_telemetry_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'member_telemetry' },
        () => load()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (drivers.length === 0) return null

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Nagłówek */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2.5 h-2.5 rounded-full bg-green-400"
          />
          <h3 className="font-bold text-sm">Kierowcy w trasie</h3>
        </div>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
          {drivers.length} aktywnych
        </span>
      </div>

      {/* Lista */}
      <div className="divide-y divide-zinc-800/60">
        {drivers.map(t => {
          const cfg        = t.member ? getRankConfig(t.member.rank as any) : null
          const isExpanded = expanded === t.member_id
          const secAgo     = Math.floor(
            (Date.now() - new Date(t.updated_at).getTime()) / 1000
          )
          const isStale = secAgo > 60

          return (
            <div key={t.member_id}>
              {/* Główny wiersz */}
              <div
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer
                           hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(isExpanded ? null : t.member_id)}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {t.member?.avatar_url ? (
                    <img
                      src={t.member.avatar_url}
                      alt={t.member.username}
                      className="w-9 h-9 rounded-full object-cover border-2 border-green-500/40"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border-2
                                    border-green-500/40 flex items-center justify-center
                                    font-bold text-amber-400 text-sm">
                      {t.member?.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5
                    rounded-full border-2 border-zinc-900
                    ${isStale ? 'bg-zinc-500' : 'bg-green-400'}`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">
                      {t.member?.username ?? 'Unknown'}
                    </span>
                    {cfg && (
                      <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px] px-1.5 py-0`}>
                        {cfg.label}
                      </Badge>
                    )}
                  </div>
                  {t.from_city && t.to_city && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                      <span className="truncate max-w-[80px]">{t.from_city}</span>
                      <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate max-w-[80px]">{t.to_city}</span>
                    </div>
                  )}
                </div>

                {/* Prędkość + dystans */}
                <div className="text-right shrink-0 space-y-0.5">
                  {t.speed_kmh !== null && (
                    <div className={`text-xs font-bold ${
                      t.speed_kmh > 90 ? 'text-red-400' :
                      t.speed_kmh > 0  ? 'text-green-400' : 'text-zinc-500'
                    }`}>
                      {t.speed_kmh} km/h
                    </div>
                  )}
                  {t.distance_remaining_km !== null && (
                    <div className="text-[10px] text-zinc-500">
                      {t.distance_remaining_km} km
                    </div>
                  )}
                </div>
              </div>

              {/* Rozwinięte szczegóły */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 grid grid-cols-2 gap-2.5 border-t border-zinc-800/40">
                      {[
                        {
                          icon:  Package,
                          color: 'text-amber-400',
                          bg:    'bg-amber-400/10',
                          label: 'Ładunek',
                          value: t.cargo
                            ? `${t.cargo}${t.cargo_weight_kg ? ` (${(t.cargo_weight_kg / 1000).toFixed(1)}t)` : ''}`
                            : '—',
                        },
                        {
                          icon:  Truck,
                          color: 'text-blue-400',
                          bg:    'bg-blue-400/10',
                          label: 'Ciężarówka',
                          value: t.truck_brand && t.truck_model
                            ? `${t.truck_brand} ${t.truck_model}`
                            : '—',
                        },
                        {
                          icon:  Coins,
                          color: 'text-green-400',
                          bg:    'bg-green-400/10',
                          label: 'Zarobek',
                          value: t.income
                            ? `${t.income.toLocaleString()} €`
                            : '—',
                        },
                        {
                          icon:  Clock,
                          color: 'text-purple-400',
                          bg:    'bg-purple-400/10',
                          label: 'ETA',
                          value: t.eta_minutes
                            ? `${Math.floor(t.eta_minutes / 60)}h ${t.eta_minutes % 60}m`
                            : '—',
                        },
                        {
                          icon:  Fuel,
                          color: 'text-zinc-400',
                          bg:    'bg-zinc-400/10',
                          label: 'Paliwo',
                          value: t.fuel_liters
                            ? `${Math.round(t.fuel_liters)} L`
                            : '—',
                        },
                        {
                          icon:  Gauge,
                          color: 'text-zinc-400',
                          bg:    'bg-zinc-400/10',
                          label: 'Prędkość',
                          value: t.speed_kmh !== null
                            ? `${t.speed_kmh} km/h`
                            : '—',
                        },
                      ].map(({ icon: Icon, color, bg, label, value }) => (
                        <div key={label}
                          className={`${bg} rounded-lg p-2.5 flex items-center gap-2`}>
                          <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                          <div className="min-w-0">
                            <div className="text-[10px] text-zinc-500">{label}</div>
                            <div className={`text-xs font-bold ${color} truncate`}>{value}</div>
                          </div>
                        </div>
                      ))}

                      {/* Trasa pełna */}
                      {(t.from_company || t.to_company) && (
                        <div className="col-span-2 bg-zinc-800/50 rounded-lg p-2.5 text-xs">
                          <div className="flex items-center gap-2 text-zinc-500">
                            <MapPin className="w-3 h-3 text-green-400" />
                            <span className="truncate">
                              {t.from_company ?? t.from_city}
                              {t.from_city ? `, ${t.from_city}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500 mt-1">
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span className="truncate">
                              {t.to_company ?? t.to_city}
                              {t.to_city ? `, ${t.to_city}` : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Czas aktualizacji */}
                    <div className="px-5 pb-3 text-[10px] text-zinc-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Aktualizacja:{' '}
                      {isStale
                        ? `${secAgo}s temu (nieaktywny?)`
                        : formatDistanceToNow(new Date(t.updated_at), {
                            addSuffix: true, locale: pl
                          })
                      }
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
