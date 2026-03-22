'use client'

import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, Tooltip,
} from 'recharts'

interface DataPoint {
  day: string
  km:  number
  jobs: number
}

interface Props {
  data:     DataPoint[]
  totalKm:  number
}

export function ActivityChart({ data, totalKm }: Props) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">
          Aktywność (ostatnie 30 dni)
        </h2>
        <span className="text-xs text-amber-400 font-bold">
          {totalKm.toLocaleString()} km łącznie
        </span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
          >
            <defs>
              <linearGradient id="grad30" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fill: '#52525b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <Tooltip
              contentStyle={{
                background:   '#18181b',
                border:       '1px solid #27272a',
                borderRadius: 8,
                color:        '#fff',
                fontSize:     12,
              }}
              formatter={(v: number, n: string) =>
                n === 'km' ? [`${v} km`, 'Dystans'] : [v, 'Joby']
              }
              cursor={{ stroke: '#f59e0b33', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="km"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#grad30)"
              dot={false}
              activeDot={{ r: 4, fill: '#f59e0b', stroke: '#18181b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
