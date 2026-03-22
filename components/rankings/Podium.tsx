'use client'
import { motion } from 'framer-motion'
import { RankingEntry } from '@/types'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, DollarSign, Package } from 'lucide-react'

type SortKey = 'total_distance' | 'total_income' | 'job_count'

interface Props {
  entries: RankingEntry[]
  sortBy:  SortKey
}

const MEDALS = ['🥇', '🥈', '🥉']

const PODIUM_CONFIG = [
  // Kolejność wyświetlania: 2, 1, 3 (środek najwyższy)
  { index: 1, position: 2, height: 'h-24 md:h-28', zIndex: 'z-10' },
  { index: 0, position: 1, height: 'h-36 md:h-44', zIndex: 'z-20' },
  { index: 2, position: 3, height: 'h-16 md:h-20', zIndex: 'z-10' },
]

function StatValue({
  sortBy, entry,
}: { sortBy: SortKey; entry: RankingEntry }) {
  if (sortBy === 'total_distance')
    return <span className="text-blue-400 font-bold text-sm">
      {entry.total_distance.toLocaleString()} km
    </span>
  if (sortBy === 'total_income')
    return <span className="text-green-400 font-bold text-sm">
      €{entry.total_income.toLocaleString()}
    </span>
  return <span className="text-amber-400 font-bold text-sm">
    {entry.job_count} jobów
  </span>
}

export function Podium({ entries, sortBy }: Props) {
  return (
    <div className="relative">
      {/* Glow w tle */}
      <div className="absolute inset-0 flex items-end justify-center
                      pointer-events-none pb-0">
        <div className="w-64 h-16 bg-amber-400/10 rounded-full blur-3xl" />
      </div>

      {/* Karty kierowców nad podium */}
      <div className="flex items-end justify-center gap-3 md:gap-6 mb-0">
        {PODIUM_CONFIG.map(({ index, position }, i) => {
          const entry = entries[index]
          if (!entry) return null
          const cfg = getRankConfig(entry.rank)

          return (
            <motion.div
              key={entry.member_id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col items-center gap-2"
            >
              {/* Medal */}
              <span className="text-2xl md:text-3xl">
                {MEDALS[index]}
              </span>

              {/* Avatar */}
              <div className={`relative ${index === 0
                ? 'ring-2 ring-amber-400/60 ring-offset-2 ring-offset-zinc-950'
                : ''} rounded-full`}>
                <Avatar className={`border-2 ${
                  index === 0 ? 'w-16 h-16 md:w-20 md:h-20 border-amber-400/60' :
                  index === 1 ? 'w-12 h-12 md:w-14 md:h-14 border-zinc-400/40' :
                  'w-10 h-10 md:w-12 md:h-12 border-orange-600/40'
                }`}>
                  <AvatarImage src={entry.avatar_url ?? ''} />
                  <AvatarFallback className={`${cfg.bg} ${cfg.color} font-black`}>
                    {entry.username[0]}
                  </AvatarFallback>
                </Avatar>
                {index === 0 && (
                  <div className="absolute inset-0 rounded-full
                                  bg-amber-400/10 animate-ping" />
                )}
              </div>

              {/* Nazwa + ranga */}
              <div className="text-center">
                <p className={`font-black ${
                  index === 0 ? 'text-base md:text-lg' : 'text-sm md:text-base'
                }`}>
                  {entry.username}
                </p>
                <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px]`}>
                  {cfg.label}
                </Badge>
              </div>

              {/* Główna stat */}
              <StatValue sortBy={sortBy} entry={entry} />
            </motion.div>
          )
        })}
      </div>

      {/* Bloki podium */}
      <div className="flex items-end justify-center gap-3 md:gap-6 mt-3">
        {PODIUM_CONFIG.map(({ index, height }, i) => (
          <motion.div
            key={index}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
            style={{ originY: 1 }}
            className={`
              w-24 md:w-36 ${height} rounded-t-xl flex items-center
              justify-center text-2xl md:text-3xl font-black
              ${index === 0
                ? 'bg-gradient-to-t from-amber-600/40 to-amber-400/20 border border-amber-400/30 text-amber-400'
                : index === 1
                  ? 'bg-gradient-to-t from-zinc-600/40 to-zinc-500/20 border border-zinc-500/30 text-zinc-400'
                  : 'bg-gradient-to-t from-orange-800/40 to-orange-600/20 border border-orange-600/30 text-orange-600'
              }
            `}
          >
            {index + 1}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
