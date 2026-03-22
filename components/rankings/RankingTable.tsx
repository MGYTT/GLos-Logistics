'use client'
import { motion } from 'framer-motion'
import { RankingEntry } from '@/types'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, DollarSign, Package, TrendingUp } from 'lucide-react'

type SortKey = 'total_distance' | 'total_income' | 'job_count'

interface Props {
  entries:    RankingEntry[]
  startIndex: number
  sortBy:     SortKey
}

export function RankingTable({ entries, startIndex, sortBy }: Props) {
  const max = entries[0]?.[sortBy] ?? 1

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => {
        const cfg      = getRankConfig(entry.rank)
        const position = startIndex + idx + 1
        const barPct   = Math.max(5, (entry[sortBy] / max) * 100)

        return (
          <motion.div
            key={entry.member_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x:   0 }}
            transition={{ delay: idx * 0.04 }}
            className="relative overflow-hidden bg-zinc-900/60 border
                       border-zinc-800 hover:border-zinc-700 rounded-xl
                       p-4 transition-colors group"
          >
            {/* Pasek postępu w tle */}
            <div
              className="absolute inset-y-0 left-0 bg-white/[0.02]
                         transition-all duration-500 rounded-xl"
              style={{ width: `${barPct}%` }}
            />

            <div className="relative flex items-center gap-3 md:gap-4">

              {/* Pozycja */}
              <div className="w-7 text-center shrink-0">
                <span className="text-sm font-black text-zinc-600">
                  {position}
                </span>
              </div>

              {/* Avatar */}
              <Avatar className="w-9 h-9 border border-zinc-700 shrink-0">
                <AvatarImage src={entry.avatar_url ?? ''} />
                <AvatarFallback className={`${cfg.bg} ${cfg.color}
                  font-bold text-xs`}>
                  {entry.username[0]}
                </AvatarFallback>
              </Avatar>

              {/* Nazwa + ranga */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{entry.username}</p>
                <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px]`}>
                  {cfg.label}
                </Badge>
              </div>

              {/* Statystyki */}
              <div className="flex items-center gap-3 md:gap-6 shrink-0">
                <StatItem
                  icon={MapPin}
                  value={`${entry.total_distance.toLocaleString()} km`}
                  color="text-blue-400"
                  active={sortBy === 'total_distance'}
                />
                <StatItem
                  icon={DollarSign}
                  value={`€${entry.total_income.toLocaleString()}`}
                  color="text-green-400"
                  active={sortBy === 'total_income'}
                  className="hidden sm:flex"
                />
                <StatItem
                  icon={Package}
                  value={String(entry.job_count)}
                  color="text-amber-400"
                  active={sortBy === 'job_count'}
                  className="hidden md:flex"
                />
              </div>

            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function StatItem({
  icon: Icon, value, color, active, className = '',
}: {
  icon:       any
  value:      string
  color:      string
  active:     boolean
  className?: string
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Icon className={`w-3.5 h-3.5 ${active ? color : 'text-zinc-700'}`} />
      <span className={`text-sm font-bold ${active ? color : 'text-zinc-500'}`}>
        {value}
      </span>
    </div>
  )
}
