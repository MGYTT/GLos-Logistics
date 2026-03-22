'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button }    from '@/components/ui/button'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import { Textarea }  from '@/components/ui/textarea'
import { Badge }     from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast }   from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Users, Star, Calendar,
  Pencil, MapPin, Server, Truck, Trophy,
  Clock, Ban, CheckCircle2, ChevronDown,
  ChevronUp, Zap,
} from 'lucide-react'
import { format } from 'date-fns'
import { pl }     from 'date-fns/locale'

// ─── Typy ──────────────────────────────────────────
interface RSVP {
  member_id: string
  members:   { username: string; avatar_url: string | null } | null
}

interface VTCEvent {
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
  created_by:   string
  event_rsvp:   RSVP[]
}

// ─── Konfiguracja typów ────────────────────────────
const EVENT_TYPES = {
  convoy:  { label: 'Konwój',     icon: Truck,    color: 'text-amber-400',  bg: 'bg-amber-400/10'  },
  bonus:   { label: 'Bonus XP',   icon: Zap,      color: 'text-purple-400', bg: 'bg-purple-400/10' },
  meeting: { label: 'Spotkanie',  icon: Users,    color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  race:    { label: 'Wyścig',     icon: Trophy,   color: 'text-red-400',    bg: 'bg-red-400/10'    },
  other:   { label: 'Inne',       icon: Calendar, color: 'text-zinc-400',   bg: 'bg-zinc-400/10'   },
}

const EVENT_STATUSES = {
  upcoming:  { label: 'Nadchodzące', color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  active:    { label: 'Trwa teraz',  color: 'text-green-400',  bg: 'bg-green-400/10'  },
  ended:     { label: 'Zakończone',  color: 'text-zinc-500',   bg: 'bg-zinc-500/10'   },
  cancelled: { label: 'Anulowane',   color: 'text-red-400',    bg: 'bg-red-400/10'    },
}

const emptyForm = {
  title: '', description: '', type: 'convoy', status: 'upcoming',
  start_at: '', end_at: '', bonus_points: 0,
  location: '', image_url: '', max_players: '', server: '', required_dlc: '',
}

// ─── Główny komponent ──────────────────────────────
export function EventsAdminPanel({ events: initial }: { events: VTCEvent[] }) {
  const [events,  setEvents]  = useState<VTCEvent[]>(initial)
  const [open,    setOpen]    = useState(false)
  const [editing, setEditing] = useState<VTCEvent | null>(null)
  const [form,    setForm]    = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [filter,  setFilter]  = useState<string>('all')
  const supabase = createClient()

  function setField(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(event: VTCEvent) {
    setEditing(event)
    setForm({
      title:        event.title,
      description:  event.description  ?? '',
      type:         event.type         ?? 'convoy',
      status:       event.status       ?? 'upcoming',
      start_at:     event.start_at.slice(0, 16),
      end_at:       event.end_at.slice(0, 16),
      bonus_points: event.bonus_points ?? 0,
      location:     event.location     ?? '',
      image_url:    event.image_url    ?? '',
      max_players:  String(event.max_players ?? ''),
      server:       event.server       ?? '',
      required_dlc: event.required_dlc ?? '',
    })
    setOpen(true)
  }

  async function saveEvent() {
    if (!form.title || !form.start_at || !form.end_at)
      return toast.error('Wypełnij tytuł i daty')

    if (new Date(form.end_at) <= new Date(form.start_at))
      return toast.error('Data końca musi być po dacie startu')

    setLoading(true)

    const payload = {
      title:        form.title,
      description:  form.description  || null,
      type:         form.type,
      status:       form.status,
      start_at:     new Date(form.start_at).toISOString(),
      end_at:       new Date(form.end_at).toISOString(),
      bonus_points: Number(form.bonus_points) || 0,
      location:     form.location     || null,
      image_url:    form.image_url    || null,
      max_players:  form.max_players  ? Number(form.max_players) : null,
      server:       form.server       || null,
      required_dlc: form.required_dlc || null,
    }

    if (editing) {
      // Edycja
      const { data, error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', editing.id)
        .select('*, event_rsvp(member_id, members(username, avatar_url))')
        .single()

      if (error) {
        toast.error('Błąd aktualizacji')
      } else {
        setEvents(prev => prev.map(e => e.id === editing.id ? data : e))
        toast.success('Wydarzenie zaktualizowane! ✅')
        setOpen(false)
      }
    } else {
      // Tworzenie
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('events')
        .insert({ ...payload, created_by: user!.id })
        .select('*, event_rsvp(member_id, members(username, avatar_url))')
        .single()

      if (error) {
        toast.error('Błąd tworzenia wydarzenia')
      } else {
        setEvents(prev => [data, ...prev])
        toast.success('Wydarzenie utworzone! 🎉')
        setForm(emptyForm)
        setOpen(false)
      }
    }
    setLoading(false)
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) return toast.error('Błąd usuwania')
    setEvents(prev => prev.filter(e => e.id !== id))
    toast.success('Wydarzenie usunięte')
  }

  async function changeStatus(id: string, status: string) {
    const { error } = await supabase
      .from('events').update({ status }).eq('id', id)
    if (error) return toast.error('Błąd zmiany statusu')
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    toast.success('Status zmieniony')
  }

  const filtered = events.filter(e =>
    filter === 'all' || e.status === filter
  )

  // Liczniki
  const counts = {
    all:       events.length,
    upcoming:  events.filter(e => e.status === 'upcoming').length,
    active:    events.filter(e => e.status === 'active').length,
    ended:     events.filter(e => e.status === 'ended').length,
    cancelled: events.filter(e => e.status === 'cancelled').length,
  }

  return (
    <div className="space-y-6">

      {/* Górna belka */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center
                      justify-between">

        {/* Filtry statusu */}
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'upcoming', 'active', 'ended', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === s
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'Wszystkie' : EVENT_STATUSES[s].label}
              <span className="ml-1.5 opacity-60">{counts[s]}</span>
            </button>
          ))}
        </div>

        <Button
          onClick={openCreate}
          className="bg-amber-500 text-black hover:bg-amber-400 font-bold gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nowe wydarzenie
        </Button>
      </div>

      {/* Lista wydarzeń */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-zinc-900/40 border border-zinc-800
                         rounded-2xl text-zinc-600"
            >
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Brak wydarzeń w tej kategorii</p>
            </motion.div>
          ) : filtered.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0  }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ delay: i * 0.04 }}
            >
              <EventRow
                event={event}
                onEdit={() => openEdit(event)}
                onDelete={() => deleteEvent(event.id)}
                onStatusChange={(s) => changeStatus(event.id, s)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal tworzenia/edycji */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-2xl
                                   max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editing ? (
                <><Pencil className="w-4 h-4 text-amber-400" /> Edytuj wydarzenie</>
              ) : (
                <><Plus className="w-4 h-4 text-amber-400" /> Nowe wydarzenie</>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">

            {/* Tytuł */}
            <div className="space-y-1.5">
              <Label>Tytuł <span className="text-red-400">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                placeholder="Wielki Konwój Europejski 2026"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Typ + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Typ wydarzenia</Label>
                <Select value={form.type} onValueChange={v => setField('type', v)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {Object.entries(EVENT_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <span className={v.color}>{v.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setField('status', v)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {Object.entries(EVENT_STATUSES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <span className={v.color}>{v.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Opis */}
            <div className="space-y-1.5">
              <Label>Opis</Label>
              <Textarea
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Szczegóły, trasa, wymagania..."
                rows={3}
                className="bg-zinc-800 border-zinc-700 resize-none"
              />
            </div>

            {/* Daty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start <span className="text-red-400">*</span></Label>
                <Input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={e => setField('start_at', e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Koniec <span className="text-red-400">*</span></Label>
                <Input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={e => setField('end_at', e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            {/* Lokalizacja + Serwer */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  Lokalizacja
                </Label>
                <Input
                  value={form.location}
                  onChange={e => setField('location', e.target.value)}
                  placeholder="Calais, Francja"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-zinc-500" />
                  Serwer
                </Label>
                <Input
                  value={form.server}
                  onChange={e => setField('server', e.target.value)}
                  placeholder="EU #1 ProMods"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            {/* Limit graczy + Punkty bonusowe */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  Limit uczestników
                </Label>
                <Input
                  type="number"
                  value={form.max_players}
                  onChange={e => setField('max_players', e.target.value)}
                  placeholder="Bez limitu"
                  min={1}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-zinc-500" />
                  Punkty bonusowe
                </Label>
                <Input
                  type="number"
                  value={form.bonus_points}
                  onChange={e => setField('bonus_points', e.target.value)}
                  placeholder="0"
                  min={0}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            {/* Wymagane DLC */}
            <div className="space-y-1.5">
              <Label>Wymagane DLC (opcjonalnie)</Label>
              <Input
                value={form.required_dlc}
                onChange={e => setField('required_dlc', e.target.value)}
                placeholder="Going East, Scandinavia..."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* URL obrazka */}
            <div className="space-y-1.5">
              <Label>URL obrazka banera</Label>
              <Input
                value={form.image_url}
                onChange={e => setField('image_url', e.target.value)}
                placeholder="https://..."
                className="bg-zinc-800 border-zinc-700"
              />
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Podgląd"
                  className="w-full h-28 object-cover rounded-lg mt-2
                             border border-zinc-700"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            {/* Przyciski */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={saveEvent}
                disabled={loading}
                className="flex-1 bg-amber-500 text-black hover:bg-amber-400 font-bold"
              >
                {loading
                  ? 'Zapisywanie...'
                  : editing ? 'Zapisz zmiany' : 'Utwórz wydarzenie'
                }
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-zinc-700"
              >
                Anuluj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Wiersz wydarzenia ─────────────────────────────
function EventRow({
  event, onEdit, onDelete, onStatusChange,
}: {
  event:          VTCEvent
  onEdit:         () => void
  onDelete:       () => void
  onStatusChange: (s: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const typeCfg   = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES]
    ?? EVENT_TYPES.other
  const statusCfg = EVENT_STATUSES[event.status as keyof typeof EVENT_STATUSES]
    ?? EVENT_STATUSES.upcoming
  const TypeIcon  = typeCfg.icon
  const rsvpCount = event.event_rsvp?.length ?? 0
  const isFull    = event.max_players != null && rsvpCount >= event.max_players

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700
                    rounded-xl overflow-hidden transition-colors">

      {/* Baner */}
      {event.image_url && (
        <div className="relative h-28 overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t
                          from-zinc-900/90 to-transparent" />
        </div>
      )}

      {/* Główna zawartość */}
      <div className="p-4 flex items-center gap-3 flex-wrap">

        {/* Ikona typu */}
        <div className={`w-10 h-10 ${typeCfg.bg} rounded-xl flex items-center
                         justify-center shrink-0`}>
          <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold truncate">{event.title}</span>
            <Badge className={`${statusCfg.bg} ${statusCfg.color}
                               border-0 text-[10px]`}>
              {statusCfg.label}
            </Badge>
            <Badge className={`${typeCfg.bg} ${typeCfg.color}
                               border-0 text-[10px]`}>
              {typeCfg.label}
            </Badge>
            {event.bonus_points > 0 && (
              <Badge className="bg-purple-500/10 text-purple-400
                                border-purple-500/20 text-[10px] gap-1">
                <Star className="w-2.5 h-2.5" />
                +{event.bonus_points} pkt
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500
                          flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(event.start_at), 'dd.MM.yyyy HH:mm', { locale: pl })}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            )}
            <span className={`flex items-center gap-1 ${
              isFull ? 'text-red-400' : ''
            }`}>
              <Users className="w-3 h-3" />
              {rsvpCount}
              {event.max_players ? `/${event.max_players}` : ''} zapisanych
            </span>
          </div>
        </div>

        {/* Akcje */}
        <div className="flex items-center gap-1 shrink-0">

          {/* Szybka zmiana statusu */}
          <Select value={event.status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-8 w-32 text-xs bg-zinc-800
                                      border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {Object.entries(EVENT_STATUSES).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  <span className={v.color}>{v.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm" variant="ghost"
            onClick={onEdit}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-white
                       hover:bg-zinc-800"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm" variant="ghost"
                className="h-8 w-8 p-0 text-zinc-600 hover:text-red-400
                           hover:bg-red-400/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-zinc-700">
              <AlertDialogHeader>
                <AlertDialogTitle>Usunąć to wydarzenie?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  Zostaną usunięte wszystkie zapisy RSVP.
                  Ta operacja jest nieodwracalna.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-zinc-700">
                  Anuluj
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  Usuń
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Rozwiń RSVP */}
          <Button
            size="sm" variant="ghost"
            onClick={() => setExpanded(v => !v)}
            className="h-8 w-8 p-0 text-zinc-500 hover:text-white"
          >
            {expanded
              ? <ChevronUp   className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />
            }
          </Button>
        </div>
      </div>

      {/* Rozwinięta lista RSVP */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
          {event.description && (
            <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Szczegóły techniczne */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {event.server && (
              <div className="bg-zinc-800/50 rounded-lg p-2 text-xs">
                <p className="text-zinc-600 mb-0.5">Serwer</p>
                <p className="text-zinc-300 font-medium">{event.server}</p>
              </div>
            )}
            {event.required_dlc && (
              <div className="bg-zinc-800/50 rounded-lg p-2 text-xs">
                <p className="text-zinc-600 mb-0.5">Wymagane DLC</p>
                <p className="text-zinc-300 font-medium">{event.required_dlc}</p>
              </div>
            )}
            <div className="bg-zinc-800/50 rounded-lg p-2 text-xs">
              <p className="text-zinc-600 mb-0.5">Koniec</p>
              <p className="text-zinc-300 font-medium">
                {format(new Date(event.end_at), 'dd.MM HH:mm', { locale: pl })}
              </p>
            </div>
            {event.max_players && (
              <div className={`rounded-lg p-2 text-xs ${
                isFull ? 'bg-red-500/10' : 'bg-zinc-800/50'
              }`}>
                <p className="text-zinc-600 mb-0.5">Miejsca</p>
                <p className={`font-medium ${
                  isFull ? 'text-red-400' : 'text-zinc-300'
                }`}>
                  {rsvpCount}/{event.max_players}
                  {isFull && ' — PEŁNE'}
                </p>
              </div>
            )}
          </div>

          {/* Lista zapisanych */}
          <div>
            <p className="text-xs font-semibold text-zinc-600 uppercase
                          tracking-wider mb-2">
              Zapisani kierowcy ({rsvpCount})
            </p>
            {rsvpCount === 0 ? (
              <p className="text-xs text-zinc-700 italic">
                Nikt jeszcze się nie zapisał
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {event.event_rsvp.map((r) => (
                  <div
                    key={r.member_id}
                    className="flex items-center gap-1.5 bg-zinc-800/60
                               rounded-full px-2.5 py-1"
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={r.members?.avatar_url ?? ''} />
                      <AvatarFallback className="text-[9px] bg-zinc-700
                                                  text-amber-400 font-bold">
                        {r.members?.username?.[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-zinc-300">
                      {r.members?.username ?? 'Nieznany'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
