import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  title:      string
  value:      string | number
  unit?:      string
  subtitle?:  string
  icon:       LucideIcon
  iconColor?: string
  iconBg?:    string
  trend?:     { value: number; label: string }
}

export function StatsCard({
  title, value, unit, subtitle,
  icon: Icon,
  iconColor = 'text-amber-400',
  iconBg    = 'bg-amber-400/10',
  trend,
}: Props) {
  return (
    <div className="group relative overflow-hidden bg-zinc-900/60 border
                    border-zinc-800 hover:border-zinc-700 rounded-xl p-4
                    transition-all duration-200 hover:bg-zinc-900/80">

      {/* Dekoracja hover */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity',
        'bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none'
      )} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            {title}
          </p>
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            iconBg, iconColor
          )}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Wartość */}
        <div className="flex items-end gap-1.5">
          <span className="text-2xl md:text-3xl font-black text-white
                           leading-none">
            {value}
          </span>
          {unit && (
            <span className="text-sm text-zinc-500 mb-0.5">{unit}</span>
          )}
        </div>

        {/* Subtitle / Trend */}
        {subtitle && (
          <p className="text-xs text-zinc-600 mt-1.5">{subtitle}</p>
        )}
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs mt-1.5 font-medium',
            trend.value >= 0 ? 'text-green-400' : 'text-red-400'
          )}>
            <span>{trend.value >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}% {trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}
