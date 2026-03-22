import { RankingEntry } from '@/types'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const medals = ['🥇', '🥈', '🥉']
const medalBorders = [
  'border-amber-400/40 bg-amber-400/5',
  'border-zinc-400/30 bg-zinc-400/5',
  'border-orange-600/30 bg-orange-600/5',
]

interface Props {
  entry: RankingEntry
  position: number
}

export function TopDriverCard({ entry, position }: Props) {
  const cfg = getRankConfig(entry.rank)
  const isTop3 = position < 3

  return (
    <div className={cn(
      'glass rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:-translate-y-1',
      isTop3 && medalBorders[position]
    )}>
      <div className="text-2xl mb-3">{medals[position] ?? `#${position + 1}`}</div>
      <MemberAvatar
        username={entry.username}
        avatarUrl={entry.avatar_url}
        size="lg"
        className={cn('mb-3', position === 0 && 'border-amber-400 shadow-lg shadow-amber-400/20')}
      />
      <div className="font-bold mb-1">{entry.username}</div>
      <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs mb-4`}>{cfg.label}</Badge>
      <div className="w-full space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Dystans</span>
          <span className="text-blue-400 font-semibold">{entry.total_distance.toLocaleString()} km</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Zarobki</span>
          <span className="text-green-400 font-semibold">€{entry.total_income.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Jobów</span>
          <span className="text-amber-400 font-semibold">{entry.job_count}</span>
        </div>
      </div>
    </div>
  )
}
