import { Suspense }         from 'react'
import { getWeeklyRankings } from '@/lib/supabase/queries'
import { RankingsClient }    from '@/components/rankings/RankingsClient'
import { Trophy }            from 'lucide-react'

export const metadata  = { title: 'Rankingi' }
export const dynamic   = 'force-dynamic'   // ← zawsze świeże dane, nie cache

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: rawPeriod } = await searchParams
  const period = (['week', 'month', 'all'].includes(rawPeriod ?? '')
    ? rawPeriod
    : 'week') as 'week' | 'month' | 'all'

  const rankings = await getWeeklyRankings(period)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-zinc-800/50
                      bg-gradient-to-b from-amber-500/5 to-transparent">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px]
                          h-[300px] bg-amber-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-amber-400/10 border border-amber-400/20
                          text-amber-400 text-xs font-semibold mb-6">
            <Trophy className="w-3.5 h-3.5" />
            {period === 'week'  && 'Tygodniowe zestawienie'}
            {period === 'month' && 'Miesięczne zestawienie'}
            {period === 'all'   && 'Wszech czasów'}
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            Rankingi{' '}
            <span className="text-transparent bg-clip-text
                             bg-gradient-to-r from-amber-400 to-orange-500">
              VTC
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            Najlepsi kierowcy według dystansu, zarobków i liczby zleceń
          </p>
          {/* Licznik kierowców */}
          {rankings.length > 0 && (
            <p className="text-zinc-600 text-sm mt-3">
              {rankings.length} {rankings.length === 1 ? 'kierowca' :
               rankings.length < 5 ? 'kierowców' : 'kierowców'} w rankingu
            </p>
          )}
        </div>
      </div>

      {/* Zawartość */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Suspense fallback={<RankingsSkeleton />}>
          <RankingsClient
            initialRankings={rankings}
            initialPeriod={period}
          />
        </Suspense>
      </div>
    </div>
  )
}

function RankingsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Podium skeleton */}
      <div className="flex items-end justify-center gap-6 mb-8">
        {[80, 120, 60].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800" />
            <div className={`w-28 bg-zinc-800 rounded-t-xl`} style={{ height: h }} />
          </div>
        ))}
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-16 bg-zinc-900/60 rounded-xl border border-zinc-800" />
      ))}
    </div>
  )
}
