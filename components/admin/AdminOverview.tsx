'use client'
import Link   from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, Package, FileText, Wifi,
  TrendingUp, MapPin, DollarSign,
  Ban, ArrowRight, CheckCircle2,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge }  from '@/components/ui/badge'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { format }        from 'date-fns'
import { pl }            from 'date-fns/locale'

interface Props {
  stats: {
    memberCount: number; bannedCount:  number
    jobCount:    number; weekJobCount: number
    pendingCount:number; onlineCount:  number
    weekKm:      number; weekIncome:   number
  }
  recentJobs:  any[]
  topMembers:  any[]
}

const card = 'bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-all'

export function AdminOverview({ stats, recentJobs, topMembers }: Props) {
  const KPI = [
    {
      label:    'Aktywni członkowie',
      value:    stats.memberCount,
      sub:      stats.bannedCount > 0
        ? `${stats.bannedCount} zbanowanych`
        : 'Brak banów',
      icon:     Users,
      color:    'text-blue-400',
      bg:       'bg-blue-400/10',
      href:     '/admin/members',
    },
    {
      label:    'Online teraz',
      value:    stats.onlineCount,
      sub:      'Ostatnie 30 minut',
      icon:     Wifi,
      color:    stats.onlineCount > 0 ? 'text-green-400' : 'text-zinc-500',
      bg:       stats.onlineCount > 0 ? 'bg-green-400/10' : 'bg-zinc-700/10',
      href:     null,
    },
    {
      label:    'Joby (7 dni)',
      value:    stats.weekJobCount,
      sub:      `${stats.jobCount} łącznie`,
      icon:     Package,
      color:    'text-amber-400',
      bg:       'bg-amber-400/10',
      href:     '/admin/jobs',
    },
    {
      label:    'Oczekujące podania',
      value:    stats.pendingCount,
      sub:      stats.pendingCount > 0 ? '⚠️ Wymagają uwagi' : 'Brak nowych',
      icon:     FileText,
      color:    stats.pendingCount > 0 ? 'text-red-400' : 'text-zinc-500',
      bg:       stats.pendingCount > 0 ? 'bg-red-400/10' : 'bg-zinc-700/10',
      href:     '/admin/recruitment',
    },
  ]

  return (
    <div className="space-y-6">

      {/* KPI karty */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI.map(({ label, value, sub, icon: Icon, color, bg, href }, i) => {
          const inner = (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y:  0  }}
              transition={{ delay: i * 0.08 }}
              className={`${card} ${href ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center
                                 justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                {href && (
                  <ArrowRight className="w-4 h-4 text-zinc-700
                                        group-hover:text-zinc-400 transition-colors" />
                )}
              </div>
              <p className="text-3xl font-black text-white">{value}</p>
              <p className="text-xs text-zinc-500 mt-1">{label}</p>
              <p className={`text-[11px] mt-1 ${
                sub.includes('⚠️') ? 'text-red-400' : 'text-zinc-700'
              }`}>{sub}</p>
            </motion.div>
          )

          return href
            ? <Link key={label} href={href} className="group">{inner}</Link>
            : <div key={label}>{inner}</div>
        })}
      </div>

      {/* Tygodniowe KM + Zarobki */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${card} flex items-center gap-5`}>
          <div className="w-12 h-12 bg-blue-400/10 rounded-xl flex items-center
                          justify-center shrink-0">
            <MapPin className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
              Dystans VTC (7 dni)
            </p>
            <p className="text-3xl font-black text-blue-400">
              {stats.weekKm >= 1000
                ? `${(stats.weekKm / 1000).toFixed(1)}K`
                : stats.weekKm.toLocaleString()
              } km
            </p>
          </div>
        </div>
        <div className={`${card} flex items-center gap-5`}>
          <div className="w-12 h-12 bg-green-400/10 rounded-xl flex items-center
                          justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
              Zarobki VTC (7 dni)
            </p>
            <p className="text-3xl font-black text-green-400">
              €{stats.weekIncome >= 1000
                ? `${(stats.weekIncome / 1000).toFixed(1)}K`
                : stats.weekIncome.toLocaleString()
              }
            </p>
          </div>
        </div>
      </div>

      {/* Ostatnie joby + Top członkowie */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Ostatnie joby */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4
                          border-b border-zinc-800">
            <h2 className="font-bold text-sm">Ostatnie joby VTC</h2>
            <Link href="/admin/jobs"
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
              Wszystkie →
            </Link>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {recentJobs.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 text-sm">
                Brak jobów
              </div>
            ) : recentJobs.map((job, i) => (
              <div key={i}
                className="flex items-center gap-3 px-5 py-3
                           hover:bg-white/[0.02] transition-colors">
                <div className="w-7 h-7 rounded-lg bg-green-400/10 flex
                                items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {(job.members as any)?.username ?? '—'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <span className="truncate max-w-[70px]">{job.from_city}</span>
                    <ArrowRight className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[70px]">{job.to_city}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-blue-400">
                    {job.distance_km} km
                  </p>
                  <p className="text-xs text-green-400">
                    €{(job.pay ?? job.income ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top członkowie */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4
                          border-b border-zinc-800">
            <h2 className="font-bold text-sm">Top kierowcy</h2>
            <Link href="/admin/members"
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
              Wszyscy →
            </Link>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {topMembers.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 text-sm">
                Brak danych
              </div>
            ) : topMembers.map((m, i) => {
              const cfg = getRankConfig(m.rank)
              return (
                <div key={m.id}
                  className="flex items-center gap-3 px-5 py-3
                             hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs font-black text-zinc-700 w-4 shrink-0">
                    #{i + 1}
                  </span>
                  <Avatar className="w-8 h-8 border border-zinc-700 shrink-0">
                    <AvatarImage src={m.avatar_url ?? ''} />
                    <AvatarFallback className={`${cfg.bg} ${cfg.color}
                      text-xs font-bold`}>
                      {m.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{m.username}</p>
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px]`}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <span className="text-sm font-bold text-amber-400 shrink-0">
                    {m.points} pkt
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
