'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Application {
  id: string
  username: string
  steam_id: string
  discord_tag: string
  ets2_hours: number
  motivation: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

const statusConfig = {
  pending:  { label: 'Oczekuje', icon: Clock,        color: 'text-amber-400', bg: 'bg-amber-400/10' },
  accepted: { label: 'Przyjęty', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
  rejected: { label: 'Odrzucony',icon: XCircle,      color: 'text-red-400',   bg: 'bg-red-400/10'   },
}

export function ApplicationsPanel({ applications: initial }: { applications: Application[] }) {
  const [apps, setApps] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const supabase = createClient()

  async function updateStatus(id: string, status: 'accepted' | 'rejected') {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id)
    if (error) return toast.error('Błąd aktualizacji')
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    toast.success(status === 'accepted' ? '✅ Podanie przyjęte!' : '❌ Podanie odrzucone')
  }

  const pending  = apps.filter(a => a.status === 'pending')
  const resolved = apps.filter(a => a.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Oczekujące */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
            Oczekujące ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(app => (
              <AppCard
                key={app.id}
                app={app}
                expanded={expanded === app.id}
                onToggle={() => setExpanded(expanded === app.id ? null : app.id)}
                onAccept={() => updateStatus(app.id, 'accepted')}
                onReject={() => updateStatus(app.id, 'rejected')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rozpatrzone */}
      {resolved.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Rozpatrzone ({resolved.length})
          </h2>
          <div className="space-y-2">
            {resolved.map(app => (
              <AppCard key={app.id} app={app} expanded={false} onToggle={() => {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AppCard({ app, expanded, onToggle, onAccept, onReject }: {
  app: Application
  expanded: boolean
  onToggle: () => void
  onAccept?: () => void
  onReject?: () => void
}) {
  const cfg = statusConfig[app.status]
  const Icon = cfg.icon

  return (
    <div className={`glass rounded-xl overflow-hidden transition-all ${app.status === 'pending' ? 'border-amber-500/20' : ''}`}>
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/2"
        onClick={onToggle}
      >
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${cfg.bg} ${cfg.color}`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </div>
        <div className="flex-1">
          <span className="font-bold">{app.username}</span>
          <span className="text-zinc-500 text-sm ml-2">{app.discord_tag}</span>
        </div>
        <div className="text-xs text-zinc-500">{app.ets2_hours}h ETS2</div>
        <div className="text-xs text-zinc-600">{format(new Date(app.created_at), 'dd.MM.yyyy')}</div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-zinc-500">Steam ID:</span> <span className="text-zinc-300">{app.steam_id}</span></div>
            <div><span className="text-zinc-500">Godziny:</span> <span className="text-amber-400 font-bold">{app.ets2_hours}h</span></div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Motywacja</div>
            <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/50 rounded-lg p-3">{app.motivation}</p>
          </div>
          {app.status === 'pending' && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={onAccept}
                className="bg-green-600 hover:bg-green-500 text-white gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Przyjmij
              </Button>
              <Button size="sm" variant="outline" onClick={onReject}
                className="border-red-800 text-red-400 hover:bg-red-400/10 gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Odrzuć
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
