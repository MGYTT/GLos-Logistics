import { createClient }                            from '@/lib/supabase/server'
import { getMemberWeekStats, getMemberJobs }        from '@/lib/supabase/queries'
import { StatsCard }                               from '@/components/dashboard/StatsCard'
import { RankBadge }                               from '@/components/dashboard/RankBadge'
import { WeeklyProgress }                          from '@/components/dashboard/WeeklyProgress'
import { RecentJobs }                              from '@/components/dashboard/RecentJobs'
import { TelemetryBanner }                         from '@/components/dashboard/TelemetryBanner'
import { StatsRefresher }                          from '@/components/dashboard/StatsRefresher'
import { Package, MapPin, DollarSign, Trophy }     from 'lucide-react'
import { format }                                  from 'date-fns'
import { pl }                                      from 'date-fns/locale'
import { redirect }                                from 'next/navigation'

export const dynamic    = 'force-dynamic'
export const revalidate = 0

export default async function HubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ── Pobierz member po auth_id (NIE po user.id bezpośrednio) ──
  // user.id = Supabase Auth UUID
  // member.id = własny UUID w tabeli members
  // Tabela members musi mieć kolumnę auth_id lub id = user.id
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('auth_id', user.id)   // ← szukamy po auth_id
    .maybeSingle()

  // Jeśli tabela members używa id = auth UUID (bez osobnej kolumny auth_id)
  // odkomentuj poniższe i zakomentuj powyższe:
  // const { data: member } = await supabase
  //   .from('members')
  //   .select('*')
  //   .eq('id', user.id)
  //   .maybeSingle()

  if (!member) redirect('/login')

  // ── Teraz używamy member.id wszędzie ─────────────────────────
  const memberId = member.id  // '024efae4-...' — prawdziwy ID w members

  const [weekStats, recentJobs, telemetryResult] = await Promise.all([
    getMemberWeekStats(memberId),
    getMemberJobs(memberId, 10),

    supabase
      .from('member_telemetry')
      .select('*')
      .eq('member_id', memberId)   // ← member.id nie user.id
      .maybeSingle()
      .then(r => r.data ?? null),
  ])

  const today     = new Date().toISOString().split('T')[0]
  const todayJobs = recentJobs.filter(j =>
    j.completed_at?.startsWith(today)
  ).length

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-6">
      <StatsRefresher memberId={memberId} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">
            Witaj, {member.username} 👋
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: pl })}
          </p>
        </div>
        <RankBadge rank={member.rank} points={member.points} />
      </div>

      {/* Telemetria — używa member.id */}
      <TelemetryBanner
        memberId={memberId}
        initialTelemetry={telemetryResult}
      />

      {/* Karty statystyk */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title="Joby dziś"
          value={todayJobs}
          icon={Package}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
        />
        <StatsCard
          title="Dystans (tydzień)"
          value={(weekStats?.distance_km ?? 0).toLocaleString('pl-PL')}
          unit="km"
          icon={MapPin}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
        />
        <StatsCard
          title="Zarobki (tydzień)"
          value={`€${(weekStats?.income ?? 0).toLocaleString('pl-PL')}`}
          icon={DollarSign}
          iconColor="text-green-400"
          iconBg="bg-green-400/10"
        />
        <StatsCard
          title="Punkty"
          value={member.points ?? 0}
          subtitle={`Ranga: ${member.rank}`}
          icon={Trophy}
          iconColor="text-purple-400"
          iconBg="bg-purple-400/10"
        />
      </div>

      {/* Wykres + ostatnie joby */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <WeeklyProgress
          member={member}
          weekStats={weekStats}
          jobs={recentJobs}
        />
        <RecentJobs memberId={memberId} initialJobs={recentJobs} />
      </div>
    </div>
  )
}
