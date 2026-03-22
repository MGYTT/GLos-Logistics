'use client'
import { VTCEvent }  from './EventsClient'
import { Button }    from '@/components/ui/button'
import { Badge }     from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion }    from 'framer-motion'
import {
  X, Calendar, MapPin, Users, Star, Clock,
  Server, Truck, Zap, Trophy, CheckCircle2,
  ArrowRight, AlertTriangle,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'

const TYPE_CFG = {
  convoy:  { label: 'Konwój',    icon: Truck,    color: 'text-amber-400',  bg: 'bg-amber-400/10'  },
  bonus:   { label: 'Bonus XP',  icon: Zap,      color: 'text-purple-400', bg: 'bg-purple-400/10' },
  meeting: { label: 'Spotkanie', icon: Users,    color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  race:    { label: 'Wyścig',    icon: Trophy,   color: 'text-red-400',    bg: 'bg-red-400/10'    },
  other:   { label: 'Inne',      icon: Calendar, color: 'text-zinc-400',   bg: 'bg-zinc-400/10'   },
}

interface Props {
  event:         VTCEvent
  currentUserId: string
  onClose:       () => void
  onRSVP:        () => void
}

export function EventDetailModal({
  event, currentUserId, onClose, onRSVP,
}: Props) {
  const type      = TYPE_CFG[event.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.other
  const TypeIcon  = type.icon
  const isJoined  = event.event_rsvp.some(r => r.member_id === currentUserId)
  const rsvpCount = event.event_rsvp.length
  const isFull    = event.max_players != null && rsvpCount >= event.max_players
  const isActive  = event.status === 'active'
  const isArchived = event.status === 'ended' || event.status === 'cancelled'
    || new Date(event.end_at) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center
                 justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{ y: 60,    opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl
                   sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh]
                   overflow-y-auto"
      >
        {/* Baner */}
        <div className="relative h-48 overflow-hidden rounded-t-3xl
                        sm:rounded-t-2xl">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${type.bg} flex items-center
                             justify-center`}>
              <TypeIcon className={`w-20 h-20 ${type.color} opacity-20`} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t
                          from-zinc-900 via-zinc-900/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full
                       bg-black/50 backdrop-blur-sm flex items-center
                       justify-center text-white hover:bg-black/70 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Status badge */}
          {isActive && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5
                            bg-green-500/20 border border-green-500/30
                            rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-green-400
                               animate-ping inline-block" />
              <span className="text-green-400 text-xs font-bold">
                TRWA TERAZ
              </span>
            </div>
          )}
        </div>

        {/* Treść */}
        <div className="p-6 space-y-5">

          {/* Tytuł + badges */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`${type.bg} ${type.color} border-0 text-xs`}>
                {type.label}
              </Badge>
              {event.bonus_points > 0 && (
                <Badge className="bg-purple-500/10 text-purple-400
                                  border-purple-500/20 text-xs gap-1">
                  <Star className="w-3 h-3" />
                  +{event.bonus_points} punktów bonusowych
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-black">{event.title}</h2>
            {event.description && (
              <p className="text-zinc-400 mt-2 leading-relaxed text-sm">
                {event.description}
              </p>
            )}
          </div>

          {/* Siatka detali */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-800/50 rounded-xl p-3">
              <p className="text-xs text-zinc-600 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Start
              </p>
              <p className="text-sm font-semibold">
                {format(new Date(event.start_at), 'dd MMM yyyy', { locale: pl })}
              </p>
              <p className="text-xs text-zinc-400">
                {format(new Date(event.start_at), 'HH:mm')}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3">
              <p className="text-xs text-zinc-600 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Koniec
              </p>
              <p className="text-sm font-semibold">
                {format(new Date(event.end_at), 'dd MMM yyyy', { locale: pl })}
              </p>
              <p className="text-xs text-zinc-400">
                {format(new Date(event.end_at), 'HH:mm')}
              </p>
            </div>
            {event.location && (
              <div className="bg-zinc-800/50 rounded-xl p-3">
                <p className="text-xs text-zinc-600 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Lokalizacja
                </p>
                <p className="text-sm font-semibold">{event.location}</p>
              </div>
            )}
            {event.server && (
              <div className="bg-zinc-800/50 rounded-xl p-3">
                <p className="text-xs text-zinc-600 mb-1 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" /> Serwer
                </p>
                <p className="text-sm font-semibold">{event.server}</p>
              </div>
            )}
          </div>

          {/* Wymagane DLC */}
          {event.required_dlc && (
            <div className="flex items-center gap-2 bg-amber-500/5 border
                            border-amber-500/20 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-400">
                  Wymagane DLC
                </p>
                <p className="text-xs text-zinc-400">{event.required_dlc}</p>
              </div>
            </div>
          )}

          {/* Lista uczestników */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase
                           tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Uczestnicy ({rsvpCount}
              {event.max_players ? `/${event.max_players}` : ''})
            </p>
            {rsvpCount === 0 ? (
              <p className="text-sm text-zinc-600 italic">
                Bądź pierwszy — zapisz się!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {event.event_rsvp.map(r => (
                  <div
                    key={r.member_id}
                    className="flex items-center gap-1.5 bg-zinc-800/60
                               border border-zinc-700/50 rounded-full
                               px-3 py-1.5"
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={r.members?.avatar_url ?? ''} />
                      <AvatarFallback className="text-[9px] bg-zinc-700
                                                  text-amber-400 font-bold">
                        {r.members?.username?.[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      'text-xs font-medium',
                      r.member_id === currentUserId
                        ? 'text-amber-400' : 'text-zinc-300'
                    )}>
                      {r.members?.username ?? 'Nieznany'}
                      {r.member_id === currentUserId && ' (Ty)'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Przycisk RSVP */}
          {!isArchived && (
            <Button
              onClick={() => { onRSVP(); onClose() }}
              disabled={!isJoined && isFull}
              className={cn(
                'w-full h-11 font-bold text-sm gap-2',
                isJoined
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                  : isFull
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-amber-500 text-black hover:bg-amber-400'
              )}
            >
              {isJoined ? (
                <>
                  <X className="w-4 h-4" />
                  Wypisz mnie z wydarzenia
                </>
              ) : isFull ? (
                'Brak wolnych miejsc'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Zapisz się na wydarzenie
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
