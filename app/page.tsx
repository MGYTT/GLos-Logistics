import { HeroSection } from '@/components/landing/HeroSection'
import { StatsSection } from '@/components/landing/StatsSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { RecruitSection } from '@/components/landing/RecruitSection'
import { Navbar } from '@/components/navigation/Navbar'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { count: memberCount },
    { data: jobStats },
    { data: topDrivers },
  ] = await Promise.all([
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('is_banned', false),
    supabase
      .from('jobs')
      .select('distance_km, income'),
    supabase.rpc('get_weekly_rankings'),
  ])

  const totalKm     = jobStats?.reduce((s, j) => s + (j.distance_km ?? 0), 0) ?? 0
  const totalIncome = jobStats?.reduce((s, j) => s + (j.income ?? 0), 0) ?? 0

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <HeroSection
          memberCount={memberCount ?? 0}
          totalKm={totalKm}
        />
        <StatsSection
          memberCount={memberCount ?? 0}
          topDriver={topDrivers?.[0] ?? null}
          totalIncome={totalIncome}
          totalKm={totalKm}
        />
        <FeaturesSection />
        <RecruitSection />
      </main>
    </>
  )
}
