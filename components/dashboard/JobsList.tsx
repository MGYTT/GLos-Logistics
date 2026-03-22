'use client'
import { useState } from 'react'
import { Job } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { exportJobsToCSV } from '@/lib/utils/csv'
import { Download, Search } from 'lucide-react'
import { format } from 'date-fns'

export function JobsTable({ jobs }: { jobs: Job[] }) {
  const [search, setSearch] = useState('')

  const filtered = jobs.filter(j =>
    j.cargo.toLowerCase().includes(search.toLowerCase()) ||
    j.origin_city.toLowerCase().includes(search.toLowerCase()) ||
    j.destination_city.toLowerCase().includes(search.toLowerCase())
  )

  function getDamageColor(dmg: number) {
    if (dmg < 5) return 'text-green-400'
    if (dmg < 20) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-4">
      {/* Filtry */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj po ładunku, mieście..."
            className="pl-9 bg-zinc-900 border-zinc-700"
          />
        </div>
        <Button
          variant="outline"
          className="border-zinc-700 gap-2 hover:border-amber-500 hover:text-amber-400"
          onClick={() => exportJobsToCSV(filtered)}
        >
          <Download className="w-4 h-4" />
          Eksportuj CSV
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Data', 'Ładunek', 'Trasa', 'Dystans', 'Zarobki', 'Uszkodz.'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filtered.map(job => (
              <tr key={job.id} className="hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                  {format(new Date(job.completed_at), 'dd.MM.yyyy')}
                </td>
                <td className="px-4 py-3 font-medium">{job.cargo}</td>
                <td className="px-4 py-3 text-zinc-400">
                  {job.origin_city} <span className="text-zinc-600">→</span> {job.destination_city}
                </td>
                <td className="px-4 py-3 text-blue-400">{job.distance_km} km</td>
                <td className="px-4 py-3 text-green-400 font-semibold">€{job.income.toLocaleString()}</td>
                <td className={`px-4 py-3 font-medium ${getDamageColor(job.damage_percent)}`}>
                  {job.damage_percent.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-600">Brak wyników</div>
        )}
      </div>
    </div>
  )
}
