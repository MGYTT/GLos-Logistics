'use client'
import { cn } from '@/lib/utils/cn'

const PERIODS = [
  { value: 'week',  label: 'Tydzień'       },
  { value: 'month', label: 'Miesiąc'       },
  { value: 'all',   label: 'Wszech czasów' },
]

interface Props {
  current:  string
  onChange: (v: string) => void
}

export function RankingPeriodSelector({ current, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800
                    rounded-xl p-1">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
            current === p.value
              ? 'bg-amber-500 text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
