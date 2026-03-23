'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, DollarSign, Users } from 'lucide-react'
import type { RankingEntry } from '@/types'
import type { Variants } from 'framer-motion'

interface Props {
  memberCount:  number
  topDriver:    RankingEntry | null
  totalIncome:  number
  totalKm:      number
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref       = useRef(null)
  const isInView  = useInView(ref, { once: true, margin: '-80px' })

  return (
    <span ref={ref}>
      {isInView ? (
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="tabular-nums"
        >
          {value.toLocaleString('pl-PL')}{suffix}
        </motion.span>
      ) : (
        <span className="opacity-0">0</span>
      )}
    </span>
  )
}

const card: Variants = {
  hidden:  { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export function StatsSection({ memberCount, topDriver, totalIncome, totalKm }: Props) {
  const ref      = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const cfg      = topDriver ? getRankConfig(topDriver.rank) : null

  const stats = [
    { icon: Users,      value: memberCount,          suffix: '',    label: 'Aktywnych kierowców', color: 'text-blue-400',  bg: 'bg-blue-400/10',  border: 'hover:border-blue-400/20'  },
    { icon: TrendingUp, value: Math.floor(totalKm),  suffix: ' km', label: 'Łączny dystans VTC',  color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'hover:border-amber-400/20' },
    { icon: DollarSign, value: Math.floor(totalIncome), suffix: ' €', label: 'Łączne zarobki VTC', color: 'text-green-400', bg: 'bg-green-400/10', border: 'hover:border-green-400/20' },
  ]

  return (
    <section ref={ref} className="py-24 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Nagłówek */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-amber-400 text-sm font-semibold uppercase tracking-widest">
            W liczbach
          </span>
          <h2 className="text-3xl font-black mt-3 mb-3">Statystyki VTC</h2>
          <p className="text-zinc-500 text-sm">Dane aktualizowane w czasie rzeczywistym</p>
        </motion.div>

        {/* Karty */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ staggerChildren: 0.13 }}
          className="grid md:grid-cols-3 gap-5 mb-8"
        >
          {stats.map(({ icon: Icon, value, suffix, label, color, bg, border }) => (
            <motion.div
              key={label}
              variants={card}
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className={`bg-zinc-900/60 border border-zinc-800 ${border} rounded-2xl p-6 text-center cursor-default transition-colors`}
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={isInView ? { scale: 1, rotate: 0 } : {}}
                transition={{ delay: 0.3, type: 'spring', stiffness: 280 }}
                className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mx-auto mb-4`}
              >
                <Icon className={`w-6 h-6 ${color}`} />
              </motion.div>
              <div className={`text-4xl font-black mb-1.5 ${color}`}>
                {value > 0 ? <AnimatedNumber value={value} suffix={suffix} /> : '—'}
              </div>
              <div className="text-zinc-500 text-sm">{label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Kierowca tygodnia */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.38 }}
        >
          {topDriver && cfg ? (
            <div className="bg-zinc-900/60 border border-amber-500/20 rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">

                {/* Label */}
                <div className="flex items-center gap-2 text-amber-400 shrink-0">
                  <motion.div
                    animate={{ rotate: [0, -12, 12, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                  >
                    <Trophy className="w-5 h-5" />
                  </motion.div>
                  <span className="text-sm font-bold uppercase tracking-wider whitespace-nowrap">
                    Kierowca tygodnia
                  </span>
                </div>

                <div className="hidden sm:block w-px h-10 bg-zinc-800 shrink-0" />

                {/* Avatar + nazwa */}
                <div className="flex items-center gap-3">
                  <motion.div whileHover={{ scale: 1.08 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <Avatar className="w-12 h-12 border-2 border-amber-500 shadow-lg shadow-amber-500/20">
                      <AvatarImage src={topDriver.avatar_url ?? ''} />
                      <AvatarFallback className="bg-zinc-800 text-amber-400 font-bold text-lg">
                        {topDriver.username[0]}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <div>
                    <div className="font-black text-base text-white">{topDriver.username}</div>
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs mt-0.5`}>
                      {cfg.label}
                    </Badge>
                  </div>
                </div>

                <div className="hidden sm:block w-px h-10 bg-zinc-800 shrink-0" />

                {/* Statsy */}
                <div className="flex gap-6 sm:gap-8 text-center">
                  {[
                    { value: `${topDriver.total_distance.toLocaleString('pl-PL')} km`, label: 'Dystans',  color: 'text-blue-400'  },
                    { value: `€${topDriver.total_income.toLocaleString('pl-PL')}`,    label: 'Zarobki',  color: 'text-green-400' },
                    { value: String(topDriver.job_count),                              label: 'Jobów',    color: 'text-amber-400' },
                  ].map(({ value, label, color }) => (
                    <motion.div key={label} whileHover={{ scale: 1.08 }} className="cursor-default">
                      <div className={`text-xl font-black ${color}`}>{value}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
                    </motion.div>
                  ))}
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center">
              <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 font-semibold">Brak danych rankingowych</p>
              <p className="text-zinc-600 text-sm mt-1">Wykonaj pierwsze joby aby pojawić się w rankingu!</p>
            </div>
          )}
        </motion.div>

      </div>
    </section>
  )
}
