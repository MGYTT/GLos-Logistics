'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  ExternalLink, User, MessageSquare, Gamepad2, Truck,
  Search, Filter
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { acceptApplication, rejectApplication } from './actions'

interface Application {
  id: string
  user_id: string
  username: string
  steam_id: string
  discord_tag: string
  truckershub_id?: string
  ets2_hours: number
  motivation: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

type FilterType = 'all' | 'pending' | 'accepted' | 'rejected'

const statusConfig = {
  pending:  { label: 'Oczekuje',  color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', icon: Clock        },
  accepted: { label: 'Przyjęty',  color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', icon: CheckCircle2 },
  rejected: { label: 'Odrzucony', color: 'text-red-400',   bg: 'bg-red-400/10   border-red-400/20',   icon: XCircle      },
}

export function RecruitmentPanel({ applications: initial }: { applications: Application[] }) {
  const [applications, setApplications] = useState(initial)
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [filter, setFilter]             = useState<FilterType>('pending')
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState<string | null>(null)

  const counts = {
    all:      applications.length,
    pending:  applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  const filtered = applications
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a =>
      a.username.toLowerCase().includes(search.toLowerCase())    ||
      a.discord_tag.toLowerCase().includes(search.toLowerCase()) ||
      a.steam_id.toLowerCase().includes(search.toLowerCase())
    )

  async function updateStatus(id: string, status: 'accepted' | 'rejected', app: Application) {
    setLoading(id)
    try {
      if (status === 'accepted') {
        await acceptApplication(id)
        toast.success(`🎉 ${app.username} przyjęty! Konto aktywowane.`)
      } else {
        await rejectApplication(id)
        toast.info(`Podanie ${app.username} odrzucone`)
      }
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      setExpanded(null)
    } catch (err: any) {
      toast.error(err.message ?? 'Wystąpił błąd')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-5">

      {/* Filtry + wyszukiwarka */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj po nicku, Discordzie..."
            className="pl-9 bg-zinc-900 border-zinc-700 h-9"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'pending', 'accepted', 'rejected'] as FilterType[]).map(f => {
            const cfg = f !== 'all' ? statusConfig[f] : null
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  filter === f
                    ? f === 'all'
                      ? 'bg-white/10 border-white/20 text-white'
                      : `${cfg?.bg} ${cfg?.color}`
                    : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'
                )}
              >
                {f === 'all' ? 'Wszystkie' : cfg?.label}
                <span className={cn(
                  'inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold',
                  f === 'pending'  && 'bg-amber-400/20 text-amber-400',
                  f === 'accepted' && 'bg-green-400/20 text-green-400',
                  f === 'rejected' && 'bg-red-400/20   text-red-400',
                  f === 'all'      && 'bg-zinc-700 text-zinc-300',
                )}>
                  {counts[f]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista podań */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl">
            <Filter className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 font-medium">
              {search ? 'Brak wyników wyszukiwania' : 'Brak podań w tej kategorii'}
            </p>
          </div>
        ) : (
          filtered.map(app => {
            const cfg        = statusConfig[app.status]
            const StatusIcon = cfg.icon
            const isExpanded = expanded === app.id
            const isLoading  = loading === app.id

            return (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'glass rounded-xl overflow-hidden transition-colors',
                  app.status === 'pending'  && 'border-amber-500/10 hover:border-amber-500/20',
                  app.status === 'accepted' && 'border-green-500/10',
                  app.status === 'rejected' && 'border-red-500/10 opacity-60',
                  isExpanded && 'border-amber-500/25!'
                )}
              >
                {/* Nagłówek wiersza */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : app.id)}
                >
                  {/* Avatar z inicjałem */}
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center shrink-0 font-bold text-amber-400 text-lg border border-zinc-700">
                    {app.username[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold truncate">{app.username}</span>
                      <Badge className={`${cfg.bg} ${cfg.color} border text-[10px] px-1.5 py-0 gap-1 h-4`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3" />
                        {app.ets2_hours}h ETS2
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {app.discord_tag}
                      </span>
                      <span>
                        {new Date(app.created_at).toLocaleDateString('pl-PL', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Przyciski dla pending */}
                  {app.status === 'pending' && (
                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => updateStatus(app.id, 'accepted', app)}
                        className="bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/40 h-8 gap-1.5 text-xs font-semibold"
                      >
                        {isLoading ? (
                          <div className="w-3 h-3 border border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Przyjmij
                      </Button>
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => updateStatus(app.id, 'rejected', app)}
                        className="bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/40 h-8 gap-1.5 text-xs font-semibold"
                      >
                        {isLoading ? (
                          <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        Odrzuć
                      </Button>
                    </div>
                  )}

                  {isExpanded
                    ? <ChevronUp   className="w-4 h-4 text-zinc-500 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                  }
                </div>

                {/* Rozwinięte szczegóły */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-5 pt-1 border-t border-zinc-800/60 space-y-4">

                        {/* Siatka danych */}
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="bg-zinc-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                              <User className="w-3 h-3" /> Steam ID
                            </div>
                            <div className="text-sm font-mono font-medium text-zinc-200">
                              {app.steam_id}
                            </div>
                          </div>
                          <div className="bg-zinc-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                              <Truck className="w-3 h-3" /> TruckersHub ID
                            </div>
                            <div className="text-sm font-mono font-medium text-zinc-200">
                              {app.truckershub_id ?? '—'}
                            </div>
                          </div>
                          <div className="bg-zinc-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                              <Gamepad2 className="w-3 h-3" /> Godziny w ETS2
                            </div>
                            <div className="text-sm font-bold text-amber-400">
                              {app.ets2_hours}h
                              {app.ets2_hours >= 500  && <span className="ml-1 text-xs text-amber-300">⭐ Weteran</span>}
                              {app.ets2_hours >= 1000 && <span className="ml-1 text-xs text-amber-300">🏆 Expert</span>}
                            </div>
                          </div>
                          <div className="bg-zinc-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                              <ExternalLink className="w-3 h-3" /> Discord
                            </div>
                            <div className="text-sm font-medium text-zinc-200">
                              {app.discord_tag}
                            </div>
                          </div>
                        </div>

                        {/* Motywacja */}
                        <div className="bg-zinc-800/50 rounded-lg p-4">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                            <MessageSquare className="w-3 h-3" /> Motywacja
                          </div>
                          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {app.motivation}
                          </p>
                        </div>

                        {/* Zmiana decyzji dla odrzuconych */}
                        {app.status === 'rejected' && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-zinc-500">Zmień decyzję:</span>
                            <Button
                              size="sm"
                              disabled={isLoading}
                              onClick={() => updateStatus(app.id, 'accepted', app)}
                              className="bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/40 h-7 gap-1 text-xs"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Przyjmij mimo to
                            </Button>
                          </div>
                        )}

                        {/* Zmiana decyzji dla przyjętych */}
                        {app.status === 'accepted' && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-zinc-500">Zmień decyzję:</span>
                            <Button
                              size="sm"
                              disabled={isLoading}
                              onClick={() => updateStatus(app.id, 'rejected', app)}
                              className="bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/40 h-7 gap-1 text-xs"
                            >
                              <XCircle className="w-3 h-3" />
                              Cofnij akceptację
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <p className="text-xs text-zinc-600 text-right">
          Wyświetlono {filtered.length} z {applications.length} podań
        </p>
      )}
    </div>
  )
}
