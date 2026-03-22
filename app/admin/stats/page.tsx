import { createClient } from '@/lib/supabase/server'
import { StatsCharts }  from '@/components/admin/StatsCharts'
import { BarChart3 }    from 'lucide-react'
import { subDays, format } from 'date-fns'

export const metadata = { title: 'Admin — Statystyki' }
export const dynamic  = 'force-dynamic'

export default async function AdminStatsPage() {
  const supabase   = await createClient()
  const thirtyDays = subDays(new Date(), 30).toISOString()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('distance_km, pay, income, completed_at')
    .eq('status', 'completed')
    .gte('completed_at', thirtyDays)
    .order('completed_at')

  // Grupuj po dniu
  const byDay: Record<string, { km: number; income: number; jobs: number }> = {}
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    byDay[d] = { km: 0, income: 0, jobs: 0 }
  }

  jobs?.forEach(job => {
    const d = job.completed_at?.split('T')[0]
    if (d && byDay[d]) {
      byDay[d].km     += job.distance_km ?? 0
      byDay[d].income += job.pay ?? job.income ?? 0
      byDay[d].jobs   += 1
    }
  })

  const chartData = Object.entries(byDay).map(([date, v]) => ({ date, ...v }))

  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-400/10 border
                        border-purple-400/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Statystyki VTC</h1>
          <p className="text-zinc-500 text-sm">Ostatnie 30 dni</p>
        </div>
      </div>
      <StatsCharts data={chartData} />
    </div>
  )
}
