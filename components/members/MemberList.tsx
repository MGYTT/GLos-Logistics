'use client'
import { useState } from 'react'
import { Member, MemberRank } from '@/types'
import { MemberCard } from './MemberCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { cn } from '@/lib/utils/cn'

const RANK_FILTERS: (MemberRank | 'all')[] = ['all', 'Owner', 'Manager', 'Elite', 'Senior', 'Driver', 'Recruit']

export function MemberList({ members }: { members: Member[] }) {
  const [search, setSearch]           = useState('')
  const [rankFilter, setRankFilter]   = useState<MemberRank | 'all'>('all')

  const filtered = members.filter(m => {
    const matchesSearch = m.username.toLowerCase().includes(search.toLowerCase())
    const matchesRank   = rankFilter === 'all' || m.rank === rankFilter
    return matchesSearch && matchesRank
  })

  return (
    <div className="space-y-6">
      {/* Filtry */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj kierowcy..."
            className="pl-9 bg-zinc-900 border-zinc-700"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {RANK_FILTERS.map(r => {
            const cfg = r !== 'all' ? getRankConfig(r) : null
            return (
              <Button
                key={r}
                size="sm"
                variant="outline"
                onClick={() => setRankFilter(r)}
                className={cn(
                  'border-zinc-700 text-xs h-8 px-3',
                  rankFilter === r
                    ? r === 'all'
                      ? 'bg-white/10 text-white border-white/20'
                      : `${cfg?.bg} ${cfg?.color} border-transparent`
                    : 'text-zinc-500 hover:text-white'
                )}
              >
                {r === 'all' ? 'Wszyscy' : cfg?.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Siatka */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(member => <MemberCard key={member.id} member={member} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-600">Brak kierowców spełniających kryteria.</div>
      )}
    </div>
  )
}
