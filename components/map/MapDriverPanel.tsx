'use client'

import type { LiveDriver }  from '@/lib/hooks/useLiveMap'
import { getRankConfig }    from '@/lib/utils/rankUtils'
import { Badge }            from '@/components/ui/badge'
import { Button }           from '@/components/ui/button'
import { motion }           from 'framer-motion'
import { X, Gauge, MapPin, Server, User, Clock } from 'lucide-react'

interface Props {
  driver:  LiveDriver
  onClose: () => void
}

export function MapDriverPanel({ driver, onClose }: Props) {
  const m      = driver.member
  const cfg    = m ? getRankConfig(m.rank as any) : null
  const secAgo = Math.floor((Date.now() - new Date(driver.updated_at).getTime()) / 1000)

  return (
    <motion.div
      key={driver.member_id}
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{   opacity: 0, y: 10,  scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[999] w-80 sm:w-96
                 sm:left-auto sm:translate-x-0 sm:right-4 sm:bottom-auto sm:top-4"
    >
      <div className="bg-zinc-900/97 backdrop-blur-xl border border-zinc-700/80
                      rounded-2xl overflow-hidden shadow-2xl shadow-black/50">

        {/* Nagłówek */}
        <div className={`flex items-center gap-3 p-4 border-b border-zinc-800
          ${m ? 'bg-gradient-to-r from-amber-500/5 to-transparent' : ''}`}>
          <div className="relative shrink-0">
            {m?.avatar_url ? (
              <img src={m.avatar_url} alt={m.username}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-500" />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center
                font-black text-xl border-2
                ${m ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-zinc-800 border-zinc-600 text-zinc-400'}`}>
                {(m?.username ?? driver.member_id)[0].toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5
                            bg-green-400 rounded-full border-2 border-zinc-900" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-base truncate">
              {m?.username ?? driver.member_id}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {cfg ? (
                <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px] px-1.5 py-0`}>
                  {cfg.label}
                </Badge>
              ) : (
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <User className="w-3 h-3" /> Kierowca VTC
                </span>
              )}
            </div>
          </div>

          <Button size="sm" variant="ghost" onClick={onClose}
            className="h-7 w-7 p-0 text-zinc-500 hover:text-white hover:bg-zinc-800 shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Dane */}
        <div className="p-4 grid grid-cols-2 gap-2.5">
          {[
            { icon: Gauge,  label: 'Prędkość',   value: driver.speed_kmh != null ? `${driver.speed_kmh} km/h` : '— km/h', color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
            { icon: Server, label: 'Ładunek',     value: driver.cargo ?? '—',                                               color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: MapPin, label: 'Skąd',        value: driver.from_city ?? '—',                                           color: 'text-green-400',  bg: 'bg-green-500/10'  },
            { icon: MapPin, label: 'Dokąd',       value: driver.to_city ?? '—',                                             color: 'text-green-400',  bg: 'bg-green-500/10'  },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 flex items-center gap-2.5`}>
              <Icon className={`w-4 h-4 ${color} shrink-0`} />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
                <div className={`text-sm font-bold ${color} truncate`}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {m && (
          <div className="mx-4 mb-4 bg-amber-500/8 border border-amber-500/20
                          rounded-xl p-3 flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 font-medium">Kierowca VTC online</span>
          </div>
        )}

        <div className="px-4 py-2.5 border-t border-zinc-800/80
                        flex items-center gap-1.5 bg-zinc-950/50">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-xs text-zinc-600">
            Aktualizacja: {secAgo < 6 ? 'przed chwilą' : `${secAgo}s temu`}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
