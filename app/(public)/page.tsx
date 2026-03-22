import { HeroSection }     from '@/components/landing/HeroSection'
import { StatsSection }    from '@/components/landing/StatsSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { RecruitSection }  from '@/components/landing/RecruitSection'
import { getWeeklyRankings, getAllMembers } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'

export const dynamic   = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()

  const [rankings, members, kmResult, incomeResult] = await Promise.all([
    getWeeklyRankings(),
    getAllMembers(),
    supabase.from('jobs').select('distance_km.sum()').single(),
    supabase.from('jobs').select('income.sum()').single(),
  ])

  const totalKm     = (kmResult.data as any)?.sum ?? 0
  const totalIncome = (incomeResult.data as any)?.sum ?? 0

  return (
    <>
      <HeroSection memberCount={members.length} totalKm={totalKm} />
      <StatsSection
        memberCount={members.length}
        topDriver={rankings[0] ?? null}
        totalKm={totalKm}
        totalIncome={totalIncome}
      />
      <FeaturesSection />
      <RecruitSection />
    </>
  )
}
