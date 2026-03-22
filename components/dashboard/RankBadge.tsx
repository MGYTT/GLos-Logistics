import { MemberRank } from '@/types'
import { getRankConfig, getNextRank, pointsToNextRank, RANK_CONFIG } from '@/lib/utils/rankUtils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export function RankBadge({ rank, points }: { rank: MemberRank; points: number }) {
  const cfg = getRankConfig(rank)
  const next = getNextRank(rank)
  const toNext = pointsToNextRank(rank, points)
  const nextCfg = next ? RANK_CONFIG[next] : null
  const progress = next ? Math.min(100, ((points - cfg.minPoints) / (nextCfg!.minPoints - cfg.minPoints)) * 100) : 100

  return (
    <div className="glass rounded-xl p-4 min-w-48">
      <div className="flex items-center justify-between mb-3">
        <Badge className={`${cfg.bg} ${cfg.color} border-0 font-bold`}>{cfg.label}</Badge>
        <span className="text-xs text-zinc-500">{points} pkt</span>
      </div>
      {next ? (
        <>
          <Progress value={progress} className="h-1.5 mb-1" />
          <div className="text-xs text-zinc-600">
            Jeszcze {toNext} pkt do <span className={RANK_CONFIG[next].color}>{RANK_CONFIG[next].label}</span>
          </div>
        </>
      ) : (
        <div className="text-xs text-amber-400">Najwyższa ranga 🏆</div>
      )}
    </div>
  )
}
