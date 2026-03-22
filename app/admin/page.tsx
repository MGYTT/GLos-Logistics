import { createClient }  from '@/lib/supabase/server'
import { AdminOverview } from '@/components/admin/AdminOverview'
import { subDays }       from 'date-fns'
import { Shield }        from 'lucide-react'

export const metadata  = { title: 'Admin — Przegląd' }
export const dynamic   = 'force-dynamic'

export default async function AdminPage() {
  const supabase     = await createClient()
  const sevenDaysAgo = subDays(new Date(), 7).toISOString()
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  const [
    { count: memberCount },
    { count: bannedCount  },
    { count: jobCount     },
    { count: weekJobCount },
    { count: pendingCount },
    { count: onlineCount  },
    { data:  recentJobs   },
    { data:  topMembers   },
    { data:  weekStats    },
    { data:  activityLogs },
  ] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true })
      .eq('is_banned', false),
    supabase.from('members').select('*', { count: 'exact', head: true })
      .eq('is_banned', true),
    supabase.from('jobs').select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase.from('jobs').select('*', { count: 'exact', head: true })
      .eq('status', 'completed').gte('completed_at', sevenDaysAgo),
    supabase.from('applications').select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('member_telemetry').select('*', { count: 'exact', head: true })
      .gte('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()),
    supabase.from('jobs')
      .select('from_city, to_city, distance_km, pay, income, completed_at, members(username, avatar_url)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(8),
    supabase.from('members')
      .select('id, username, points, rank, avatar_url, is_banned')
      .eq('is_banned', false)
      .order('points', { ascending: false })
      .limit(5),
    supabase.from('jobs')
      .select('distance_km, pay, income, completed_at')
      .eq('status', 'completed')
      .gte('completed_at', sevenDaysAgo),
    supabase.from('jobs')
      .select('from_city, to_city, created_at, members(username)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5),
  ])

  const weekKm     = weekStats?.reduce((s, j) => s + (j.distance_km ?? 0), 0) ?? 0
  const weekIncome = weekStats?.reduce(
    (s, j) => s + (j.pay ?? j.income ?? 0), 0
  ) ?? 0

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border
                        border-red-500/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Panel Admina</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Przegląd całego VTC w czasie rzeczywistym
          </p>
        </div>
      </div>

      <AdminOverview
        stats={{
          memberCount:  memberCount  ?? 0,
          bannedCount:  bannedCount  ?? 0,
          jobCount:     jobCount     ?? 0,
          weekJobCount: weekJobCount ?? 0,
          pendingCount: pendingCount ?? 0,
          onlineCount:  onlineCount  ?? 0,
          weekKm,
          weekIncome,
        }}
        recentJobs={recentJobs ?? []}
        topMembers={topMembers ?? []}
      />
    </div>
  )
}
