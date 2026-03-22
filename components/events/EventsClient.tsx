'use client'
import { useState, useMemo } from 'react'
import { createClient }      from '@/lib/supabase/client'
import { EventCard }         from './EventCard'
import { EventDetailModal }  from './EventDetailModal'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Truck, Zap, Users,
  Trophy, LayoutGrid, List,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Typy ──────────────────────────────────────────
export interface RSVP {
  member_id: string
  members:   { username: string; avatar_url: string | null } | null
}

export interface VTCEvent {
  id:           string
  title:        string
  description:  string | null
  type:         string
  status:       string
  start_at:     string
  end_at:       string
  bonus_points: number
  location:     string | null
  image_url:    string | null
  max_players:  number | null
  server:       string | null
  required_dlc: string | null
  event_rsvp:   RSVP[]
}

interface Props {
  events:        VTCEvent[]
  currentUserId: string
}

// ─── Filtry typów ───────────────────────────────────
const TYPE_FILTERS = [
  { value: 'all',     label: 'Wszystkie', icon: Calendar },
  { value: 'convoy',  label: 'Konwoje',   icon: Truck    },
  { value: 'bonus',   label: 'Bonus XP',  icon: Zap      },
  { value: 'meeting', label: 'Spotkania', icon: Users    },
  { value: 'race',    label: 'Wyścigi',   icon: Trophy   },
]

// ─── Główny komponent ───────────────────────────────
export function EventsClient({ events: initial, currentUserId }: Props) {
  const [events,   setEvents]   = useState<VTCEvent[]>(initial)
  const [filter,   setFilter]   = useState('all')
  const [view,     setView]     = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<VTCEvent | null>(null)
  const supabase = createClient()

  const now = new Date()

  const filtered = useMemo(() =>
    events.filter(e => filter === 'all' || e.type === filter),
    [events, filter]
  )

  const upcoming = filtered.filter(e =>
    e.status !== 'ended' &&
    e.status !== 'cancelled' &&
    new Date(e.end_at) >= now
  )

  const past = filtered.filter(e =>
    e.status === 'ended' ||
    e.status === 'cancelled' ||
    new Date(e.end_at) < now
  )

  // ─── RSVP ────────────────────────────────────────
  async function handleRSVP(eventId: string) {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    const isJoined = event.event_rsvp.some(r => r.member_id === currentUserId)

    // Sprawdź limit miejsc
    if (!isJoined && event.max_players != null) {
      if (event.event_rsvp.length >= event.max_players) {
        toast.error('Brak wolnych miejsc!')
        return
      }
    }

    if (isJoined) {
      // ─── Wypisz ──────────────────────────────────
      const { error } = await supabase
        .from('event_rsvp')
        .delete()
        .eq('event_id', eventId)
        .eq('member_id', currentUserId)

      if (error) {
        toast.error('Błąd wypisania')
        return
      }

      setEvents(prev => {
        const updated = prev.map(e =>
          e.id === eventId
            ? {
                ...e,
                event_rsvp: e.event_rsvp.filter(
                  r => r.member_id !== currentUserId
                ),
              }
            : e
        )
        // ✅ Aktualizuj modal tym samym świeżym obiektem
        setSelected(sel =>
          sel?.id === eventId
            ? (updated.find(e => e.id === eventId) ?? null)
            : sel
        )
        return updated
      })

      toast.success('Wypisano z wydarzenia')

    } else {
      // ─── Zapisz ──────────────────────────────────
      const { data: memberData } = await supabase
        .from('members')
        .select('username, avatar_url')
        .eq('id', currentUserId)
        .single()

      const { error } = await supabase
        .from('event_rsvp')
        .insert({ event_id: eventId, member_id: currentUserId })

      if (error) {
        if (error.code === '23505') {
          toast.error('Już jesteś zapisany!')
        } else {
          toast.error('Błąd zapisu na wydarzenie')
          console.error('[RSVP insert]', error)
        }
        return
      }

      const newRsvp: RSVP = {
        member_id: currentUserId,
        members:   memberData,
      }

      setEvents(prev => {
        const updated = prev.map(e =>
          e.id === eventId
            ? { ...e, event_rsvp: [...e.event_rsvp, newRsvp] }
            : e
        )
        // ✅ Aktualizuj modal tym samym świeżym obiektem
        setSelected(sel =>
          sel?.id === eventId
            ? (updated.find(e => e.id === eventId) ?? null)
            : sel
        )
        return updated
      })

      toast.success('Zapisano na wydarzenie! 🎉')
    }
  }

  // ─── Render ──────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Filtry + przełącznik widoku */}
      <div className="flex flex-col sm:flex-row gap-3 items-start
                      sm:items-center justify-between">

        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                text-xs font-medium transition-all border
                ${filter === value
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800
                        rounded-xl p-1 shrink-0">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              view === 'grid'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-lg transition-all ${
              view === 'list'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nadchodzące i aktywne */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase
                         tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400
                             animate-pulse inline-block" />
            Nadchodzące i aktywne ({upcoming.length})
          </h2>
          <div className={
            view === 'grid'
              ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-4'
              : 'space-y-3'
          }>
            <AnimatePresence>
              {upcoming.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0  }}
                  transition={{ delay: i * 0.06 }}
                >
                  <EventCard
                    event={event}
                    currentUserId={currentUserId}
                    view={view}
                    onRSVP={() => handleRSVP(event.id)}
                    onClick={() => setSelected(event)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Brak nadchodzących */}
      {upcoming.length === 0 && (
        <div className="text-center py-20 bg-zinc-900/40 border
                        border-zinc-800 rounded-2xl">
          <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">
            Brak nadchodzących wydarzeń
          </p>
          <p className="text-zinc-600 text-sm mt-1">
            Administrator wkrótce doda nowe eventy!
          </p>
        </div>
      )}

      {/* Archiwum */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-600 uppercase
                         tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600
                             inline-block" />
            Archiwum ({past.length})
          </h2>
          <div className={cn(
            view === 'grid'
              ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-4'
              : 'space-y-3',
            'opacity-60'
          )}>
            {past.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <EventCard
                  event={event}
                  currentUserId={currentUserId}
                  view={view}
                  onRSVP={() => {}}
                  onClick={() => setSelected(event)}
                  archived
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Modal szczegółów */}
      <AnimatePresence>
        {selected && (
          <EventDetailModal
            event={selected}
            currentUserId={currentUserId}
            onClose={() => setSelected(null)}
            onRSVP={() => handleRSVP(selected.id)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Helper ──────────────────────────────────────
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
