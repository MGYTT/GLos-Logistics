import { getRankConfig } from '@/lib/utils/rankUtils'

const RANKS = ['Recruit','Driver','Senior','Elite','Manager','Owner'] as const

export function MapLegend() {
  return (
    <div className="px-4 py-3 rounded-xl bg-zinc-900/80 backdrop-blur
                    border border-zinc-800 text-xs space-y-2">
      <p className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
        Legenda rang
      </p>
      <div className="space-y-1.5">
        {RANKS.map(rank => {
          const cfg = getRankConfig(rank)
          return (
            <div key={rank} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${cfg.bg} border border-white/10`} />
              <span className={cfg.color}>{cfg.label}</span>
            </div>
          )
        })}
      </div>
      <div className="pt-1 border-t border-zinc-800 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400" />
          <span className="text-zinc-400">W trasie</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-700 border border-zinc-600" />
          <span className="text-zinc-500">Bez zlecenia</span>
        </div>
      </div>
    </div>
  )
}
