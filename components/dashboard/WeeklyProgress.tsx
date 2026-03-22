'use client'
import dynamic from 'next/dynamic'
import { Member, WeekStats, Job } from '@/types'
import { useMemo } from 'react'
import { subDays, format, startOfDay, isSameDay } from 'date-fns'
import { pl } from 'date-fns/locale'

const ResponsiveContainer = dynamic(
  () => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false }
)
const AreaChart = dynamic(
  () => import('recharts').then(m => ({ default: m.AreaChart })), { ssr: false }
)
const Area = dynamic(
  () => import('recharts').then(m => ({ default: m.Area })), { ssr: false }
)
const XAxis = dynamic(
  () => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false }
)
const Tooltip = dynamic(
  () => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false }
)

interface Props {
  member:    Member
  weekStats: WeekStats | null
  jobs:      Job[]
}

export function WeeklyProgress({ weekStats, jobs }: Props) {
  // Generuj ostatnie 7 dni z prawdziwymi danymi
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date    = subDays(new Date(), 6 - i)
      const dayJobs = jobs.filter(j =>
        isSameDay(new Date(j.completed_at), date)
      )
      const km = dayJobs.reduce((s, j) => s + (j.distance_km ?? 0), 0)
      return {
        day: format(date, 'EEE', { locale: pl }),
        km,
        jobs: dayJobs.length,
      }
    })
  }, [jobs])

  const hasData = chartData.some(d => d.km > 0)

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">
          Aktywność w tygodniu
        </h2>
        <span className="text-xs text-amber-400 font-bold">
          {(weekStats?.distance_km ?? 0).toLocaleString()} km łącznie
        </span>
      </div>

      {/* Wykres */}
      <div className="h-36">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}
              margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="gradKm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fill: '#52525b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                  padding: '6px 10px',
                }}
                formatter={(v: number, name: string) =>
                  name === 'km' ? [`${v} km`, 'Dystans'] : [v, 'Joby']
                }
                cursor={{
                  stroke: '#f59e0b44',
                  strokeWidth: 1,
                }}
              />
              <Area
                type="monotone"
                dataKey="km"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#gradKm)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#f59e0b',
                  stroke: '#18181b',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          /* Pusty state wykresu */
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-full h-1 bg-zinc-800/60 rounded-full" />
            <p className="text-zinc-700 text-xs mt-4">
              Brak danych — jedź pierwszego joba!
            </p>
          </div>
        )}
      </div>

      {/* Statystyki tygodnia */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800">
        {[
          {
            value: (weekStats?.distance_km ?? 0).toLocaleString(),
            unit:  'km',
            color: 'text-blue-400',
          },
          {
            value: `€${(weekStats?.income ?? 0).toLocaleString()}`,
            unit:  'zarobki',
            color: 'text-green-400',
          },
          {
            value: weekStats?.job_count ?? 0,
            unit:  'jobów',
            color: 'text-amber-400',
          },
        ].map(({ value, unit, color }) => (
          <div key={unit} className="text-center">
            <div className={`text-sm font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
