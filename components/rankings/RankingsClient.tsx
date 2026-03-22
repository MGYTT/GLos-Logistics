'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter, usePathname }            from 'next/navigation'
import { motion, AnimatePresence }           from 'framer-motion'
import { RankingEntry }                      from '@/types'
import { Podium }                            from './Podium'
import { RankingTable }                      from './RankingTable'
import { MapPin, DollarSign, Package, Trophy, Loader2 } from 'lucide-react'
import { cn }                                from '@/lib/utils/cn'

type SortKey  = 'total_distance' | 'total_income' | 'job_count'
type Period   = 'week' | 'month' | 'all'

interface Props {
  initialRankings: RankingEntry[]
  initialPeriod:   Period
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week',  label: 'Tydzień'       },
  { value: 'month', label: 'Miesiąc'       },
  { value: 'all',   label: 'Wszech czasów' },
]

const SORT_OPTIONS: {
  key: SortKey; label: string; icon: React.ElementType; color: string
}[] = [
  { key: 'total_distance', label: 'Dystans', icon: MapPin,     color: 'text-blue-400'  },
  { key: 'total_income',   label: 'Zarobki', icon: DollarSign, color: 'text-green-400' },
  { key: 'job_count',      label: 'Joby',    icon: Package,    color: 'text-amber-400' },
]

export function RankingsClient({ initialRankings, initialPeriod }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [sortBy, setSortBy] = useState<SortKey>('total_distance')
  const [period, setPeriod] = useState<Period>(initialPeriod)

  // Zmiana okresu — aktualizuje URL → Server Component pobiera nowe dane
  function handlePeriodChange(p: Period) {
    setPeriod(p)
    startTransition(() => {
      router.push(`${pathname}?period=${p}`)
    })
  }

  const sorted = useMemo(() =>
    [...initialRankings].sort((a, b) => b[sortBy] - a[sortBy]),
    [initialRankings, sortBy],
  )

  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  return (
    <div className="space-y-8">

      {/* ── Kontrolki ──────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Selektor okresu */}
        <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              disabled={isPending}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
                'flex items-center gap-1.5',
                period === p.value
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              {isPending && period === p.value && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              {p.label}
            </button>
          ))}
        </div>

        {/* Sortowanie */}
        <div className="flex gap-1.5 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
          {SORT_OPTIONS.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                'text-xs font-medium transition-all',
                sortBy === key
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', sortBy === key ? color : '')} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading overlay ─────────────────── */}
      <AnimatePresence>
        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{   opacity: 0 }}
            className="flex items-center justify-center gap-2 py-4
                       text-sm text-zinc-500"
          >
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            Ładowanie rankingu...
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Podium TOP 3 ────────────────────── */}
      <AnimatePresence mode="wait">
        {!isPending && top3.length >= 3 && (
          <motion.div
            key={`podium-${period}-${sortBy}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{   opacity: 0, y: -8  }}
            transition={{ duration: 0.3 }}
          >
            <Podium entries={top3} sortBy={sortBy} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reszta tabeli ────────────────────── */}
      <AnimatePresence mode="wait">
        {!isPending && rest.length > 0 && (
          <motion.div
            key={`table-${period}-${sortBy}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{   opacity: 0        }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <h2 className="text-xs font-semibold text-zinc-600 uppercase
                           tracking-wider mb-3 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5" />
              Pozostałe miejsca
            </h2>
            <RankingTable entries={rest} startIndex={3} sortBy={sortBy} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pusty stan ──────────────────────── */}
      {!isPending && sorted.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 text-zinc-600"
        >
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-zinc-500">Brak danych rankingowych</p>
          <p className="text-sm mt-1">
            {period === 'week'  && 'Ukończ zlecenie w tym tygodniu aby pojawić się w rankingu'}
            {period === 'month' && 'Ukończ zlecenie w tym miesiącu aby pojawić się w rankingu'}
            {period === 'all'   && 'Brak ukończonych zleceń'}
          </p>
        </motion.div>
      )}
    </div>
  )
}
