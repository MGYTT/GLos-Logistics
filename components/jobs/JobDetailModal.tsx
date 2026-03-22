'use client'
import { useState } from 'react'
import { Job } from '@/types/jobs'
import { createClient } from '@/lib/supabase/client'
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/lib/ets2/data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  MapPin, Package, Truck, ArrowRight, Coins, Weight,
  Server, User, Clock, CheckCircle2, XCircle, PlayCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

interface Props {
  job:         Job
  currentUser: { id: string; username: string; rank: string }
  onClose:     () => void
  onUpdated:   (job: Job) => void
}

export function JobDetailModal({ job, currentUser, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const priorityCfg = PRIORITY_CONFIG[job.priority]
  const statusCfg   = STATUS_CONFIG[job.status]
  const isAdmin     = ['Manager', 'Owner'].includes(currentUser.rank)
  const isCreator   = job.created_by === currentUser.id
  const isTaker     = job.taken_by   === currentUser.id
  const canTake     = job.status === 'open' && !isCreator
  const canStart    = isTaker && job.status === 'taken'
  const canComplete = isTaker && job.status === 'in_progress'
  const canCancel   = (isCreator || isAdmin) && !['completed','cancelled'].includes(job.status)

  async function updateJob(updates: Partial<Job> & { _action?: string }, action: string) {
  setLoading(action)

  const res = await fetch(`/api/jobs/${job.id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...updates, _action: action }),
  })

  const data = await res.json()

  if (!res.ok) {
    toast.error('Błąd: ' + data.error)
  } else {
    onUpdated(data)
    toast.success(
      action === 'take'     ? '✅ Zlecenie przyjęte!'  :
      action === 'start'    ? '🚛 Trasa rozpoczęta!'   :
      action === 'complete' ? '🏆 Zlecenie ukończone!' :
      action === 'cancel'   ? 'Zlecenie anulowane'     :
      'Zaktualizowano'
    )
  }
  setLoading(null)
}

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base leading-tight">
            <Truck className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="line-clamp-2">{job.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Statusy */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={`${statusCfg.bg} ${statusCfg.color} border text-xs`}>
            {statusCfg.label}
          </Badge>
          <Badge className={`${priorityCfg.bg} ${priorityCfg.color} border text-xs`}>
            ⚡ {priorityCfg.label}
          </Badge>
          <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">
            <Server className="w-3 h-3 mr-1" />{job.server}
          </Badge>
        </div>

        {/* Trasa */}
        <div className="bg-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-zinc-500 flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3 text-green-400" /> Start
              </div>
              <div className="font-black text-lg">{job.from_city}</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="w-6 h-6 text-amber-400" />
              {job.distance_km && (
                <span className="text-xs text-zinc-500 font-medium">
                  {job.distance_km} km
                </span>
              )}
            </div>
            <div className="flex-1 text-right">
              <div className="text-xs text-zinc-500 flex items-center justify-end gap-1 mb-1">
                Cel <MapPin className="w-3 h-3 text-red-400" />
              </div>
              <div className="font-black text-lg">{job.to_city}</div>
            </div>
          </div>
        </div>

        {/* Siatka szczegółów */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: Package,      color: 'text-amber-400',  bg: 'bg-amber-400/10',  label: 'Ładunek',  value: job.cargo            },
            { icon: Weight,       color: 'text-zinc-400',   bg: 'bg-zinc-400/10',   label: 'Masa',     value: `${job.cargo_weight}t` },
            { icon: Truck,        color: 'text-blue-400',   bg: 'bg-blue-400/10',   label: 'Naczepa',  value: job.trailer_type     },
            { icon: Truck,        color: 'text-zinc-400',   bg: 'bg-zinc-400/10',   label: 'Pojazd',   value: job.truck ?? 'Dowolny'},
          ].map(({ icon: Icon, color, bg, label, value }) => (
            <div key={label} className={`${bg} rounded-lg p-3 flex items-center gap-2`}>
              <Icon className={`w-4 h-4 ${color} shrink-0`} />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
                <div className={`text-sm font-bold ${color} truncate`}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Wynagrodzenie */}
        {job.pay && (
          <div className="bg-green-400/5 border border-green-400/20 rounded-xl p-4
                          flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <Coins className="w-5 h-5 text-green-400" />
              <span className="text-sm">Wynagrodzenie</span>
            </div>
            <span className="text-2xl font-black text-green-400">
              {job.pay.toLocaleString()} €
            </span>
          </div>
        )}

        {/* Twórca / Kierowca */}
        <div className="grid grid-cols-2 gap-2.5 text-sm">
          {job.creator && (
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500 mb-1.5">Zleceniodawca</div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-zinc-700 rounded-full flex items-center
                                justify-center text-amber-400 font-bold text-xs">
                  {job.creator.username[0].toUpperCase()}
                </div>
                <span className="font-semibold truncate">{job.creator.username}</span>
              </div>
            </div>
          )}
          {job.taker ? (
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500 mb-1.5">Kierowca</div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-900 rounded-full flex items-center
                                justify-center text-blue-400 font-bold text-xs">
                  {job.taker.username[0].toUpperCase()}
                </div>
                <span className="font-semibold truncate">{job.taker.username}</span>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-800/30 rounded-lg p-3 border border-dashed border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">Kierowca</div>
              <div className="text-xs text-zinc-600 italic">Brak — oczekuje</div>
            </div>
          )}
        </div>

        {/* Notatki */}
        {job.notes && (
          <div className="bg-zinc-800/40 rounded-lg p-3 text-sm text-zinc-400">
            <div className="text-xs text-zinc-600 mb-1">📝 Uwagi</div>
            {job.notes}
          </div>
        )}

        {/* Data */}
        <div className="text-xs text-zinc-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Dodano {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: pl })}
        </div>

        {/* Akcje */}
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          {canTake && (
            <Button
              disabled={!!loading}
              onClick={() => updateJob({
                status:   'taken',
                taken_by: currentUser.id,
                taken_at: new Date().toISOString(),
              }, 'take')}
              className="bg-amber-500 text-black hover:bg-amber-400 font-bold h-10 gap-2"
            >
              {loading === 'take'
                ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <><Truck className="w-4 h-4" /> Przyjmij zlecenie</>
              }
            </Button>
          )}
          {canStart && (
            <Button
              disabled={!!loading}
              onClick={() => updateJob({ status: 'in_progress' }, 'start')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Rozpocznij trasę
            </Button>
          )}
          {canComplete && (
            <Button
              disabled={!!loading}
              onClick={() => updateJob({
                status:       'completed',
                completed_at: new Date().toISOString(),
              }, 'complete')}
              className="bg-green-600 hover:bg-green-500 text-white font-bold h-10 gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Oznacz jako ukończone
            </Button>
          )}
          {canCancel && (
            <Button
              disabled={!!loading}
              variant="outline"
              onClick={() => updateJob({ status: 'cancelled' }, 'cancel')}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-9 gap-2"
            >
              <XCircle className="w-4 h-4" />
              Anuluj zlecenie
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
