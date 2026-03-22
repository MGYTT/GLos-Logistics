'use client'
import { VTCEvent }  from './EventsClient'
import { Badge }     from '@/components/ui/badge'
import { Button }    from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Calendar, MapPin, Users, Star,
  Clock, Truck, Zap, Trophy, Server,
  CheckCircle2, ArrowRight,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'

const TYPE_CFG = {
  convoy:  { label: 'Konwój',    icon: Truck,    color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
  bonus:   { label: 'Bonus XP',  icon: Zap,      color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  meeting: { label: 'Spotkanie', icon: Users,    color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  race:    { label: 'Wyścig',    icon: Trophy,   color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20'    },
  other:   { label: 'Inne',      icon: Calendar, color: 'text-zinc-400',   bg: 'bg-zinc-400/10',   border: 'border-zinc-400/20'   },
}

const STATUS_CFG = {
  upcoming:  { label: 'Nadchodzące', color: 'text-blue-400',  bg: 'bg-blue-400/10'  },
  active:    { label: 'Trwa teraz',  color: 'text-green-400', bg: 'bg-green-400/10' },
  ended:     { label: 'Zakończone',  color: 'text-zinc-500',  bg: 'bg-zinc-500/10'  },
  cancelled: { label: 'Anulowane',   color: 'text-red-400',   bg: 'bg-red-400/10'   },
}

interface Props {
  event:         VTCEvent
  currentUserId: string
  view:          'grid' | 'list'
  onRSVP:        () => void
  onClick:       () => void
  archived?:     boolean
}

export function EventCard({
  event, currentUserId, view, onRSVP, onClick, archived,
}: Props) {
  const type      = TYPE_CFG[event.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.other
  const status    = STATUS_CFG[event.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.upcoming
  const TypeIcon  = type.icon
  const isJoined  = event.event_rsvp.some(r => r.member_id === currentUserId)
  const rsvpCount = event.event_rsvp.length
  const isFull    = event.max_players != null && rsvpCount >= event.max_players
  const isActive  = event.status === 'active'

  const timeLabel = isActive
    ? 'Trwa teraz!'
    : new Date(event.start_at) > new Date()
      ? `Za ${formatDistanceToNow(new Date(event.start_at), { locale: pl })}`
      : formatDistanceToNow(new Date(event.start_at), { locale: pl, addSuffix: true })

  if (view === 'list') {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer',
          'bg-zinc-900/60 hover:border-zinc-700',
          isActive  ? 'border-green-500/30' : `${type.border}`,
        )}
      >
        <div className={`w-10 h-10 ${type.bg} rounded-xl flex items-center
                         justify-center shrink-0`}>
          <TypeIcon className={`w-5 h-5 ${type.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold truncate">{event.title}</span>
            {isActive && (
              <span className="flex items-center gap-1 text-xs text-green-400
                               font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400
                                 animate-ping inline-block" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeLabel}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 hidden sm:flex">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {rsvpCount}{event.max_players ? `/${event.max_players}` : ''}
            </span>
          </div>
        </div>
        {!archived && (
          <Button
            size="sm"
            onClick={e => { e.stopPropagation(); onRSVP() }}
            disabled={!isJoined && isFull}
            className={cn(
              'shrink-0 h-8 text-xs font-bold',
              isJoined
                ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400 border border-green-500/30'
                : isFull
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : `${type.bg} ${type.color} hover:opacity-80 border ${type.border}`
            )}
          >
            {isJoined ? '✓ Zapisany' : isFull ? 'Brak miejsc' : 'Zapisz się'}
          </Button>
        )}
      </div>
    )
  }

  // Grid view
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-2xl border overflow-hidden cursor-pointer',
        'bg-zinc-900/60 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-xl',
        isActive
          ? 'border-green-500/40 hover:shadow-green-500/10'
          : `${type.border} hover:shadow-${type.color}/10`,
      )}
    >
      {/* Baner lub gradient */}
      <div className="relative h-36 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover transition-transform
                       duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full ${type.bg} flex items-center
                           justify-center`}>
            <TypeIcon className={`w-12 h-12 ${type.color} opacity-30`} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t
                        from-zinc-900 via-zinc-900/20 to-transparent" />

        {/* Badges na baner */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className={`${status.bg} ${status.color} border-0 text-[10px]`}>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400
                               animate-ping mr-1 inline-block" />
            )}
            {status.label}
          </Badge>
          <Badge className={`${type.bg} ${type.color} border-0 text-[10px]`}>
            {type.label}
          </Badge>
        </div>

        {/* Bonus punkty */}
        {event.bonus_points > 0 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-purple-500/20 text-purple-400
                              border-purple-500/30 text-[10px] gap-1">
              <Star className="w-2.5 h-2.5" />
              +{event.bonus_points} pkt
            </Badge>
          </div>
        )}

        {/* Czas */}
        <div className="absolute bottom-3 left-3">
          <span className={cn(
            'text-xs font-semibold flex items-center gap-1',
            isActive ? 'text-green-400' : 'text-white/80'
          )}>
            <Clock className="w-3 h-3" />
            {timeLabel}
          </span>
        </div>
      </div>

      {/* Treść karty */}
      <div className="p-4 space-y-3">
        <h3 className="font-black text-base leading-snug line-clamp-1">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Meta */}
        <div className="space-y-1.5 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {format(new Date(event.start_at), 'EEEE, dd MMM yyyy · HH:mm', { locale: pl })}
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {event.location}
            </div>
          )}
          {event.server && (
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 shrink-0" />
              {event.server}
            </div>
          )}
        </div>

        {/* Avatary zapisanych */}
        {rsvpCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {event.event_rsvp.slice(0, 5).map((r, i) => (
                <Avatar
                  key={r.member_id}
                  className="w-6 h-6 border-2 border-zinc-900"
                  style={{ zIndex: 5 - i }}
                >
                  <AvatarImage src={r.members?.avatar_url ?? ''} />
                  <AvatarFallback className="bg-zinc-700 text-amber-400
                                             text-[9px] font-bold">
                    {r.members?.username?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {rsvpCount > 5 && (
                <div className="w-6 h-6 rounded-full bg-zinc-700 border-2
                                border-zinc-900 flex items-center justify-center
                                text-[9px] font-bold text-zinc-400">
                  +{rsvpCount - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-zinc-500">
              {rsvpCount}
              {event.max_players ? `/${event.max_players}` : ''} uczestników
            </span>
          </div>
        )}

        {/* Przycisk RSVP */}
        {!archived && (
          <Button
            onClick={e => { e.stopPropagation(); onRSVP() }}
            disabled={!isJoined && isFull}
            className={cn(
              'w-full h-9 text-xs font-bold gap-2 transition-all',
              isJoined
                ? 'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400 border border-green-500/20'
                : isFull
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                  : `bg-amber-500 text-black hover:bg-amber-400`
            )}
          >
            {isJoined ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Jesteś zapisany</>
            ) : isFull ? (
              'Brak wolnych miejsc'
            ) : (
              <>Zapisz się <ArrowRight className="w-3.5 h-3.5" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
