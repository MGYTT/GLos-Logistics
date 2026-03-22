'use client'

import { useEffect, useState } from 'react'
import type * as RechartsTypes from 'recharts'

interface DayData {
  date:   string
  km:     number
  income: number
  jobs:   number
}

interface Props {
  data: DayData[]
}

const tooltipStyle = {
  contentStyle: {
    background:   '#18181b',
    border:       '1px solid #27272a',
    borderRadius: 8,
    color:        '#fff',
    fontSize:     12,
  },
  labelStyle: { color: '#71717a', marginBottom: 4 },
  cursor:     { fill: 'rgba(255,255,255,0.03)' },
}

function Skeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="glass rounded-xl p-5 h-72 animate-pulse bg-zinc-800/30" />
      ))}
    </div>
  )
}

export function StatsCharts({ data }: Props) {
  const [RC, setRC] = useState<typeof RechartsTypes | null>(null)

  useEffect(() => {
    import('recharts').then(mod => setRC(mod))
  }, [])

  const formatted = data.map(d => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('pl-PL', {
      day:   '2-digit',
      month: '2-digit',
    }),
  }))

  const totalKm     = data.reduce((s, d) => s + d.km,    0)
  const totalIncome = data.reduce((s, d) => s + d.income, 0)
  const totalJobs   = data.reduce((s, d) => s + d.jobs,   0)

  if (!RC) return <Skeleton />

  const {
    ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, XAxis, YAxis,
    Tooltip, CartesianGrid,
  } = RC

  return (
    <div className="space-y-6">

      {/* === DYSTANS === */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">
            Dystans dzienny (km)
          </h2>
          <span className="text-xs text-amber-400 font-bold">
            {totalKm.toLocaleString()} km łącznie
          </span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradKm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v: number) => [`${v.toLocaleString()} km`, 'Dystans']}
              />
              <Area
                type="monotone"
                dataKey="km"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#gradKm)"
                dot={false}
                activeDot={{ r: 4, fill: '#f59e0b', stroke: '#18181b', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* === ZAROBKI === */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">
            Zarobki dzienne (€)
          </h2>
          <span className="text-xs text-green-400 font-bold">
            €{totalIncome.toLocaleString()} łącznie
          </span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v: number) => [`€${v.toLocaleString()}`, 'Zarobki']}
              />
              <Bar
                dataKey="income"
                fill="#22c55e"
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* === LICZBA JOBÓW === */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">
            Liczba jobów dziennie
          </h2>
          <span className="text-xs text-blue-400 font-bold">
            {totalJobs.toLocaleString()} jobów łącznie
          </span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v: number) => [v, 'Jobów']}
              />
              <Bar
                dataKey="jobs"
                fill="#60a5fa"
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
