'use client'

import { useState, useMemo }   from 'react'
import dynamic                  from 'next/dynamic'
import { Member, Job, WeekStats } from '@/types'
import { createClient }         from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button }               from '@/components/ui/button'
import { Input }                from '@/components/ui/input'
import { Label }                from '@/components/ui/label'
import { Badge }                from '@/components/ui/badge'
import {
  getRankConfig, getNextRank,
  pointsToNextRank, RANK_CONFIG,
} from '@/lib/utils/rankUtils'
import { ApiKeySection }        from './ApiKeySection'
import { toast }                from 'sonner'
import { motion }               from 'framer-motion'
import { format, subDays, isSameDay } from 'date-fns'
import { pl }                   from 'date-fns/locale'
import {
  MapPin, DollarSign, Package, AlertTriangle,
  Edit2, Save, X, Trophy, Fuel, Star,
  Calendar, ArrowRight, TrendingUp, Zap,
} from 'lucide-react'

// ✅ Jeden dynamiczny import całego komponentu wykresu
const ActivityChart = dynamic(
  () => import('./ActivityChart').then(m => m.ActivityChart),
  {
    ssr: false,
    loading: () => (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 h-[220px]
                      flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-amber-500/30
                        border-t-amber-500 animate-spin" />
      </div>
    ),
  }
)

// ─── Typy ──────────────────────────────────────
type Tab = 'overview' | 'jobs' | 'settings' | 'api'

interface Stats {
  totalKm:     number
  totalIncome: number
  jobCount:    number
  avgDamage:   number
  totalFuel:   number
  bestIncome:  number
}

interface Props {
  member:    Member | null
  stats:     Stats
  jobs:      Job[]
  weekStats: WeekStats | null
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Przegląd',   icon: TrendingUp },
  { id: 'jobs',     label: 'Moje Joby',  icon: Package    },
  { id: 'settings', label: 'Ustawienia', icon: Edit2      },
  { id: 'api',      label: 'API Bridge', icon: Zap        },
]

function getDmgColor(d: number) {
  if (d < 5)  return 'text-green-400 bg-green-400/10'
  if (d < 20) return 'text-amber-400 bg-amber-400/10'
  return 'text-red-400 bg-red-400/10'
}

// ─── Komponent ─────────────────────────────────
export function ProfileClient({ member: initial, stats, jobs, weekStats }: Props) {
  const [member,   setMember]   = useState(initial)
  const [tab,      setTab]      = useState<Tab>('overview')
  const [editing,  setEditing]  = useState(false)
  const [username, setUsername] = useState(initial?.username ?? '')
  const [steamId,  setSteamId]  = useState(initial?.steam_id ?? '')
  const [loading,  setLoading]  = useState(false)
  const supabase = createClient()

  // ── Dane wykresu ────────────────────────────
  const chartData = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => {
      const date    = subDays(new Date(), 29 - i)
      const dayJobs = jobs.filter(j =>
        isSameDay(new Date(j.completed_at), date)
      )
      return {
        day:  format(date, 'd MMM', { locale: pl }),
        km:   dayJobs.reduce((s, j) => s + (j.distance_km  ?? 0), 0),
        jobs: dayJobs.length,
      }
    }),
  [jobs])

  if (!member) return (
    <div className="p-6 text-zinc-500 text-center mt-20">
      Brak danych profilu.
    </div>
  )

  const cfg     = getRankConfig(member.rank)
  const next    = getNextRank(member.rank)
  const toNext  = pointsToNextRank(member.rank, member.points)
  const nextCfg = next ? RANK_CONFIG[next] : null
  const xpPct   = next
    ? Math.min(100, (
        (member.points - cfg.minPoints) /
        (nextCfg!.minPoints - cfg.minPoints)
      ) * 100)
    : 100

  const achievements = [
    { icon: '🚛', label: 'Pierwszy Job',      done: stats.jobCount >= 1     },
    { icon: '📦', label: '10 Jobów',           done: stats.jobCount >= 10    },
    { icon: '🏆', label: '50 Jobów',           done: stats.jobCount >= 50    },
    { icon: '🛣️',  label: '10 000 km',         done: stats.totalKm >= 10000  },
    { icon: '💰', label: '€100 000',           done: stats.totalIncome >= 100000 },
    { icon: '⭐', label: 'Doskonały Kierowca', done: stats.avgDamage < 1 && stats.jobCount > 5 },
  ]

  async function saveProfile() {
    setLoading(true)
    const { error } = await supabase
      .from('members')
      .update({ username, steam_id: steamId })
      .eq('id', member!.id)

    if (error) toast.error('Błąd zapisywania profilu')
    else {
      setMember(p => p ? { ...p, username, steam_id: steamId } : p)
      setEditing(false)
      toast.success('Profil zaktualizowany!')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Hero Banner ───────────────────────── */}
      <div className="relative">
        <div className={`h-36 md:h-48 w-full rounded-b-none relative overflow-hidden
          bg-gradient-to-br ${cfg.gradient ?? 'from-amber-500/20 to-zinc-900'}`}>
          <div className="absolute inset-0 bg-gradient-to-t
                          from-zinc-950/80 to-transparent" />
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full
                          bg-white/[0.03] blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full
                          bg-white/[0.03] blur-xl" />
        </div>

        <div className="px-4 md:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 relative z-10">

            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="w-24 h-24 border-4 border-zinc-950 shadow-2xl">
                <AvatarImage src={member.avatar_url ?? ''} />
                <AvatarFallback className={`${cfg.bg} ${cfg.color} font-black text-3xl`}>
                  {member.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full
                              bg-green-400 border-2 border-zinc-950" />
            </div>

            {/* Nazwa + ranga + XP */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-black truncate">
                  {member.username}
                </h1>
                <Badge className={`${cfg.bg} ${cfg.color} border-0 font-bold`}>
                  {cfg.label}
                </Badge>
              </div>

              {/* XP Bar */}
              <div className="flex items-center gap-3 max-w-xs">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r
                               from-amber-500 to-amber-400"
                  />
                </div>
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                  {member.points} pkt
                  {next && (
                    <span className="text-zinc-600"> / {nextCfg?.minPoints}</span>
                  )}
                </span>
              </div>
              {next && (
                <p className="text-xs text-zinc-600 mt-1">
                  Jeszcze{' '}
                  <span className={nextCfg?.color}>{toNext} pkt</span>
                  {' '}do rangi{' '}
                  <span className={nextCfg?.color}>{nextCfg?.label}</span>
                </p>
              )}
            </div>

            {/* Data dołączenia */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs
                            text-zinc-500 pb-2 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              Dołączył {format(new Date(member.joined_at), 'd MMM yyyy', { locale: pl })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats ───────────────────────── */}
      <div className="px-4 md:px-8 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-400/10',
              label: 'Łączny dystans',
              value: `${stats.totalKm.toLocaleString()} km`,
            },
            {
              icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10',
              label: 'Łączne zarobki',
              value: `€${stats.totalIncome.toLocaleString()}`,
            },
            {
              icon: Package, color: 'text-amber-400', bg: 'bg-amber-400/10',
              label: 'Wykonane joby',
              value: String(stats.jobCount),
            },
            {
              icon: AlertTriangle, bg: 'bg-red-400/10',
              color: stats.avgDamage < 5 ? 'text-green-400' : 'text-red-400',
              label: 'Śr. uszkodzenie',
              value: `${stats.avgDamage.toFixed(1)}%`,
            },
          ].map(({ icon: Icon, color, bg, label, value }) => (
            <div key={label}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4
                         hover:border-zinc-700 transition-colors">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center
                               justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className={`text-xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────── */}
      <div className="px-4 md:px-8">
        <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800
                        rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg
                text-sm font-medium transition-all whitespace-nowrap flex-1
                justify-center
                ${tab === id
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB: Przegląd ─────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6 pb-8">

            {/* ✅ Wykres — osobny komponent, brak dynamic na poszczególnych elementach */}
            <ActivityChart data={chartData} totalKm={stats.totalKm} />

            <div className="grid md:grid-cols-2 gap-6">

              {/* Osiągnięcia */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                <h2 className="font-bold text-sm text-zinc-400 uppercase
                               tracking-wider mb-4">
                  Osiągnięcia
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {achievements.map(({ icon, label, done }) => (
                    <div key={label}
                      className={`flex items-center gap-2.5 rounded-lg p-2.5
                        border transition-colors
                        ${done
                          ? 'bg-amber-400/5 border-amber-400/20'
                          : 'bg-zinc-800/30 border-zinc-800 opacity-40'
                        }`}>
                      <span className="text-lg">{icon}</span>
                      <span className={`text-xs font-medium ${
                        done ? 'text-zinc-300' : 'text-zinc-600'
                      }`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dodatkowe statsy */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                <h2 className="font-bold text-sm text-zinc-400 uppercase
                               tracking-wider mb-4">
                  Dodatkowe statystyki
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      icon: Star, color: 'text-amber-400',
                      label: 'Najlepszy job',
                      value: `€${stats.bestIncome.toLocaleString()}`,
                    },
                    {
                      icon: Fuel, color: 'text-blue-400',
                      label: 'Łącznie paliwo',
                      value: `${Math.round(stats.totalFuel).toLocaleString()} L`,
                    },
                    {
                      icon: TrendingUp, color: 'text-green-400',
                      label: 'Śr. dystans / job',
                      value: stats.jobCount
                        ? `${Math.round(stats.totalKm / stats.jobCount)} km`
                        : '— km',
                    },
                    {
                      icon: Trophy, color: 'text-purple-400',
                      label: 'Punkty rankingowe',
                      value: `${member.points} pkt`,
                    },
                  ].map(({ icon: Icon, color, label, value }) => (
                    <div key={label}
                      className="flex items-center justify-between py-2.5
                                 border-b border-zinc-800/60 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-sm text-zinc-400">{label}</span>
                      </div>
                      <span className={`text-sm font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Moje Joby ────────────────── */}
        {tab === 'jobs' && (
          <div className="pb-8 space-y-4">
            <p className="text-sm text-zinc-500">
              {jobs.length} wykonanych zleceń
            </p>

            <div className="bg-zinc-900/60 border border-zinc-800
                            rounded-xl overflow-hidden">
              {jobs.length === 0 ? (
                <div className="text-center py-16 text-zinc-600">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Brak wykonanych jobów</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {jobs.slice(0, 50).map(job => (
                    <div key={job.id}
                      className="flex items-center gap-3 px-5 py-3.5
                                 hover:bg-white/[0.02] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-amber-400/10
                                      flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{job.cargo}</p>
                        <div className="flex items-center gap-1 text-xs
                                        text-zinc-500 mt-0.5">
                          <span className="truncate max-w-[80px]">
                            {job.origin_city}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0" />
                          <span className="truncate max-w-[80px]">
                            {job.destination_city}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-sm font-bold text-green-400">
                          €{job.income.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[10px] text-zinc-600">
                            {job.distance_km} km
                          </span>
                          <span className={`text-[10px] font-medium px-1.5
                            py-0.5 rounded-full
                            ${getDmgColor(job.damage_percent)}`}>
                            {job.damage_percent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-700 hidden md:block
                                      shrink-0 text-right">
                        {format(new Date(job.completed_at), 'd MMM', { locale: pl })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Ustawienia ───────────────── */}
        {tab === 'settings' && (
          <div className="max-w-lg pb-8 space-y-5">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5
                            space-y-4">
              <h2 className="font-bold">Dane profilu</h2>
              <div className="space-y-3">
                {[
                  {
                    label: 'Nick w grze',
                    value: editing ? username : member.username,
                    onChange: (v: string) => setUsername(v),
                    readOnly: !editing,
                    placeholder: undefined,
                  },
                  {
                    label: 'Steam ID',
                    value: editing ? steamId : (member.steam_id ?? '—'),
                    onChange: (v: string) => setSteamId(v),
                    readOnly: !editing,
                    placeholder: '76561198...',
                  },
                  {
                    label: 'Discord',
                    value: member.discord_id ?? '—',
                    onChange: undefined,
                    readOnly: true,
                    placeholder: undefined,
                  },
                  {
                    label: 'Data dołączenia',
                    value: format(new Date(member.joined_at), 'd MMMM yyyy', { locale: pl }),
                    onChange: undefined,
                    readOnly: true,
                    placeholder: undefined,
                  },
                ].map(({ label, value, onChange, readOnly, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-zinc-400">{label}</Label>
                    <Input
                      value={value}
                      onChange={onChange ? e => onChange(e.target.value) : undefined}
                      readOnly={readOnly}
                      placeholder={placeholder}
                      className="bg-zinc-900 border-zinc-700
                                 read-only:opacity-60 read-only:cursor-default"
                    />
                  </div>
                ))}
              </div>

              {editing ? (
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={saveProfile}
                    disabled={loading}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Zapisywanie...' : 'Zapisz'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="border-zinc-700 gap-2"
                  >
                    <X className="w-4 h-4" />
                    Anuluj
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setUsername(member.username)
                    setSteamId(member.steam_id ?? '')
                    setEditing(true)
                  }}
                  className="border-zinc-700 gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edytuj profil
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: API Bridge ───────────────── */}
        {tab === 'api' && (
          <div className="max-w-lg pb-8">
            <ApiKeySection
              apiKey={(member as any).api_key ?? ''}
              memberId={member.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}
