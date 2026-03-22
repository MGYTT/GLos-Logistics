import { createClient }  from '@/lib/supabase/server'
import { AdminJobsClient } from './AdminJobsClient'
import { Briefcase }      from 'lucide-react'

export const metadata = { title: 'Admin — Zlecenia' }
export const dynamic  = 'force-dynamic'

export default async function AdminJobsPage() {
  const supabase = await createClient()

  const [{ data: jobs }, { data: members }, { count: total }] = await Promise.all([
    supabase
      .from('jobs')
      .select(`
        *,
        member:member_id (
          id, username, avatar_url, rank
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200),

    supabase
      .from('members')
      .select('id, username, avatar_url, rank')
      .eq('is_banned', false)
      .order('username'),

    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true }),
  ])

  // Agregaty
  const completed  = jobs?.filter(j => j.status === 'completed')  ?? []
  const totalKm    = completed.reduce((s, j) => s + (j.distance_km ?? 0), 0)
  const totalIncome= completed.reduce((s, j) => s + (j.income ?? j.pay ?? 0), 0)
  const avgDmg     = completed.length
    ? completed.reduce((s, j) => s + (j.damage_percent ?? 0), 0) / completed.length
    : 0

  return (
    <div className="p-4 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center
                        justify-center">
          <Briefcase className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Zarządzanie zleceniami</h1>
          <p className="text-sm text-zinc-500">
            Wszystkie joby kierowców VTC
          </p>
        </div>
      </div>

      <AdminJobsClient
        initialJobs={jobs ?? []}
        members={members ?? []}
        stats={{ total: total ?? 0, totalKm, totalIncome, avgDmg }}
      />
    </div>
  )
}
