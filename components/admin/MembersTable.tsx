'use client'
import { useState } from 'react'
import { Member, MemberRank } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { toast } from 'sonner'
import { Search, Ban, ShieldCheck, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const RANKS: MemberRank[] = ['Recruit', 'Driver', 'Senior', 'Elite', 'Manager', 'Owner']

export function MembersTable({ members: initial }: { members: Member[] }) {
  const [members, setMembers]   = useState(initial)
  const [search, setSearch]     = useState('')
  const [sortField, setSortField] = useState<'joined_at' | 'points' | 'username'>('joined_at')
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc')
  const supabase = createClient()

  const filtered = members
    .filter(m => m.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortField] ?? ''
      const bv = b[sortField] ?? ''
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  async function updateRank(id: string, rank: MemberRank) {
    const { error } = await supabase.from('members').update({ rank }).eq('id', id)
    if (error) return toast.error('Błąd zmiany rangi')
    setMembers(prev => prev.map(m => m.id === id ? { ...m, rank } : m))
    toast.success('Ranga zaktualizowana!')
  }

  async function toggleBan(id: string, current: boolean) {
    const { error } = await supabase.from('members').update({ is_banned: !current }).eq('id', id)
    if (error) return toast.error('Błąd operacji')
    setMembers(prev => prev.map(m => m.id === id ? { ...m, is_banned: !current } : m))
    toast.success(current ? 'Kierowca odbanowany' : 'Kierowca zbanowany')
  }

  async function deleteMember(id: string) {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) return toast.error('Błąd usuwania')
    setMembers(prev => prev.filter(m => m.id !== id))
    toast.success('Kierowca usunięty')
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-zinc-700" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-amber-400" />
      : <ChevronDown className="w-3 h-3 text-amber-400" />
  }

  return (
    <div className="space-y-4">
      {/* Wyszukiwarka */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Szukaj kierowcy..."
          className="pl-9 bg-zinc-900 border-zinc-700"
        />
      </div>

      {/* Tabela */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <button onClick={() => toggleSort('username')} className="flex items-center gap-1 hover:text-white">
                  Kierowca <SortIcon field="username" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Ranga
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <button onClick={() => toggleSort('points')} className="flex items-center gap-1 hover:text-white">
                  Punkty <SortIcon field="points" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Steam ID
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <button onClick={() => toggleSort('joined_at')} className="flex items-center gap-1 hover:text-white">
                  Dołączył <SortIcon field="joined_at" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filtered.map(member => {
              const cfg = getRankConfig(member.rank)
              return (
                <tr
                  key={member.id}
                  className={`transition-colors ${member.is_banned ? 'opacity-50 bg-red-500/5' : 'hover:bg-white/[0.02]'}`}
                >
                  {/* Kierowca */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <MemberAvatar
                        username={member.username}
                        avatarUrl={member.avatar_url}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium">{member.username}</div>
                        <div className="text-xs text-zinc-600 font-mono">{member.id.slice(0, 8)}…</div>
                      </div>
                    </div>
                  </td>

                  {/* Ranga */}
                  <td className="px-4 py-3">
                    <Select
                      value={member.rank}
                      onValueChange={(v) => updateRank(member.id, v as MemberRank)}
                    >
                      <SelectTrigger className="h-7 text-xs border-zinc-700 bg-zinc-800 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {RANKS.map(r => {
                          const rc = getRankConfig(r)
                          return (
                            <SelectItem key={r} value={r} className="text-xs">
                              <span className={rc.color}>{rc.label}</span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Punkty */}
                  <td className="px-4 py-3">
                    <span className="text-amber-400 font-bold">{member.points ?? 0}</span>
                  </td>

                  {/* Steam ID */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-zinc-500">
                      {member.steam_id ?? '—'}
                    </span>
                  </td>

                  {/* Data */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-500">
                      {format(new Date(member.joined_at), 'dd.MM.yyyy', { locale: pl })}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {member.is_banned ? (
                      <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-xs">
                        Zbanowany
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs">
                        Aktywny
                      </Badge>
                    )}
                  </td>

                  {/* Akcje */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleBan(member.id, member.is_banned ?? false)}
                        className={`h-7 w-7 p-0 ${member.is_banned ? 'text-green-400 hover:bg-green-400/10' : 'text-red-400 hover:bg-red-400/10'}`}
                        title={member.is_banned ? 'Odbanuj' : 'Zbanuj'}
                      >
                        {member.is_banned ? <ShieldCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-400/10"
                            title="Usuń kierowcę"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Usunąć {member.username}?</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400">
                              Ta operacja jest nieodwracalna. Wszystkie joby kierowcy zostaną usunięte.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-zinc-700">Anuluj</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMember(member.id)}
                              className="bg-red-600 hover:bg-red-500 text-white"
                            >
                              Usuń
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-600">
            {search ? 'Brak wyników wyszukiwania' : 'Brak kierowców w bazie'}
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-600">
        Wyświetlono {filtered.length} z {members.length} kierowców
      </p>
    </div>
  )
}
