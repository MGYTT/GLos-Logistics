'use client'
import { Job } from '@/types/jobs'
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/lib/ets2/data'
import { Badge } from '@/components/ui/badge'
import { MapPin, Package, Truck, ArrowRight, Coins, Weight } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

interface Props {
  job:           Job
  currentUserId: string
  onClick:       () => void
}

export function JobCard({ job, currentUserId, onClick }: Props) {
  const priorityCfg = PRIORITY_CONFIG[job.priority]
  const statusCfg   = STATUS_CONFIG[job.status]
  const isMyJob     = job.created_by === currentUserId
  const isTakenByMe = job.taken_by   === currentUserId

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`glass rounded-xl overflow-hidden cursor-pointer group
        hover:border-amber-500/20 hover:bg-white/[0.02] transition-all duration-200
        ${job.status === 'completed' || job.status === 'cancelled' ? 'opacity-60' : ''}
        ${isTakenByMe ? 'border-blue-500/20' : ''}
        ${isMyJob ? 'border-amber-500/10' : ''}
      `}
    >
      {/* Górny pasek priorytetu */}
      <div className={`h-0.5 w-full ${
        job.priority === 'urgent' ? 'bg-red-500'   :
        job.priority === 'high'   ? 'bg-amber-500' :
        job.priority === 'normal' ? 'bg-blue-500'  : 'bg-zinc-600'
      }`} />

      <div className="p-4 space-y-3">
        {/* Nagłówek */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm leading-tight line-clamp-1 group-hover:text-amber-300 transition-colors">
            {job.title}
          </h3>
          <div className="flex gap-1.5 shrink-0">
            <Badge className={`${priorityCfg.bg} ${priorityCfg.color} border text-[10px] px-1.5 py-0`}>
              {priorityCfg.label}
            </Badge>
            <Badge className={`${statusCfg.bg} ${statusCfg.color} border text-[10px] px-1.5 py-0`}>
              {statusCfg.label}
            </Badge>
          </div>
        </div>

        {/* Trasa */}
        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs text-zinc-500 mb-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              Skąd
            </div>
            <div className="font-bold text-sm truncate">{job.from_city}</div>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center justify-end gap-1 text-xs text-zinc-500 mb-0.5">
              Dokąd
              <MapPin className="w-3 h-3 shrink-0" />
            </div>
            <div className="font-bold text-sm truncate">{job.to_city}</div>
          </div>
        </div>

        {/* Szczegóły */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Package className="w-3.5 h-3.5 text-amber-400/70" />
            <span className="truncate">{job.cargo}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Weight className="w-3.5 h-3.5 text-zinc-500" />
            <span>{job.cargo_weight}t</span>
          </div>
          {job.distance_km && (
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Truck className="w-3.5 h-3.5 text-zinc-500" />
              <span>{job.distance_km} km</span>
            </div>
          )}
          {job.pay && (
            <div className="flex items-center gap-1.5 text-green-400 font-semibold">
              <Coins className="w-3.5 h-3.5" />
              <span>{job.pay.toLocaleString()} €</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
          <div className="flex items-center gap-2">
            {job.creator && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <div className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center
                                text-amber-400 font-bold text-[10px] border border-zinc-700">
                  {job.creator.username[0].toUpperCase()}
                </div>
                {job.creator.username}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isMyJob && (
              <span className="text-[10px] bg-amber-500/10 text-amber-400
                               border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                Twoje
              </span>
            )}
            {isTakenByMe && (
              <span className="text-[10px] bg-blue-500/10 text-blue-400
                               border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                Przyjęte
              </span>
            )}
            <span className="text-[10px] text-zinc-600">
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: pl })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
