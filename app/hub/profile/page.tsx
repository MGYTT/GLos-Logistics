import { createClient } from '@/lib/supabase/server'
import { getMemberJobs, getMemberWeekStats } from '@/lib/supabase/queries'
import { ProfileClient } from './ProfileClient'

export const metadata = { title: 'Mój Profil' }
export const dynamic  = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [member, jobs, weekStats] = await Promise.all([
    supabase.from('members').select('*').eq('id', user!.id)
      .single().then(r => r.data),
    getMemberJobs(user!.id, 999),
    getMemberWeekStats(user!.id),
  ])

  const stats = {
    totalKm:     jobs.reduce((s, j) => s + (j.distance_km  ?? 0), 0),
    totalIncome: jobs.reduce((s, j) => s + (j.income       ?? 0), 0),
    jobCount:    jobs.length,
    avgDamage:   jobs.length
      ? jobs.reduce((s, j) => s + (j.damage_percent ?? 0), 0) / jobs.length
      : 0,
    totalFuel:   jobs.reduce((s, j) => s + (j.fuel_used    ?? 0), 0),
    bestIncome:  jobs.length
      ? Math.max(...jobs.map(j => j.income ?? 0))
      : 0,
  }

  return (
    <ProfileClient
      member={member}
      stats={stats}
      jobs={jobs}
      weekStats={weekStats}
    />
  )
}
