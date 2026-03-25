'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  CalendarDays, Plus, Clock, CheckCircle2, 
  XCircle, Plane, Heart, Briefcase 
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'

type Leave = {
  id: string
  type: string
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
}

type Member = {
  id: string
  username: string
  rank: string
}

const leaveTypes = [
  { value: 'vacation',  label: 'Urlop',        icon: Plane     },
  { value: 'sick',      label: 'Zwolnienie',   icon: Heart     },
  { value: 'other',     label: 'Inne',         icon: Briefcase },
]

const statusConfig = {
  pending:  { label: 'Oczekuje',  color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', icon: Clock        },
  approved: { label: 'Zatwierdzo', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', icon: CheckCircle2 },
  rejected: { label: 'Odrzucony', color: 'text-red-400',   bg: 'bg-red-400/10   border-red-400/20',   icon: XCircle      },
}

export function LeavesClient({ member, leaves: initial }: { member: Member; leaves: Leave[] }) {
  const [leaves, setLeaves]       = useState(initial)
  const [showForm, setShowForm]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [form, setForm] = useState({
    type:       'vacation',
    start_date: '',
    end_date:   '',
    reason:     '',
  })
  const supabase = createClient()

  async function submitLeave() {
    if (!form.start_date || !form.end_date) {
      toast.error('Podaj daty urlopu')
      return
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error('Data końca nie może być przed datą początku')
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('member_leaves')
      .insert({
        member_id:  member.id,
        type:       form.type,
        start_date: form.start_date,
        end_date:   form.end_date,
        reason:     form.reason || null,
        status:     'pending',
      })
      .select()
      .single()

    if (error) {
      toast.error('Błąd wysyłania wniosku: ' + error.message)
      setLoading(false)
      return
    }

    setLeaves(prev => [data as Leave, ...prev])
    setForm({ type: 'vacation', start_date: '', end_date: '', reason: '' })
    setShowForm(false)
    toast.success('Wniosek urlopowy wysłany!')
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-amber-400" />
            Moje urlopy
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Zarządzaj swoimi wnioskami urlopowymi
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-2"
        >
          <Plus className="w-4 h-4" />
          Nowy wniosek
        </Button>
      </div>

      {/* Formularz */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-bold text-sm text-zinc-300">Nowy wniosek urlopowy</h2>

            {/* Typ urlopu */}
            <div className="flex gap-2">
              {leaveTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setForm(f => ({ ...f, type: value }))}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                    form.type === value
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Daty */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Data od</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Data do</label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  min={form.start_date || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Powód */}
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">
                Powód <span className="text-zinc-600">(opcjonalnie)</span>
              </label>
              <Textarea
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Krótki opis powodu nieobecności..."
                className="bg-zinc-800 border-zinc-700 resize-none"
                rows={3}
              />
            </div>

            {/* Przyciski */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="text-zinc-500"
              >
                Anuluj
              </Button>
              <Button
                onClick={submitLeave}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : 'Wyślij wniosek'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista urlopów */}
      <div className="space-y-3">
        {leaves.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <CalendarDays className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 font-medium">Brak wniosków urlopowych</p>
            <p className="text-zinc-600 text-sm mt-1">Kliknij „Nowy wniosek" aby złożyć urlop</p>
          </div>
        ) : (
          leaves.map(leave => {
            const cfg        = statusConfig[leave.status] ?? statusConfig.pending
            const StatusIcon = cfg.icon
            const typeLabel  = leaveTypes.find(t => t.value === leave.type)?.label ?? leave.type
            const days = Math.ceil(
              (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime())
              / (1000 * 60 * 60 * 24)
            ) + 1

            return (
              <motion.div
                key={leave.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{typeLabel}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(leave.start_date).toLocaleDateString('pl-PL')}
                        {' — '}
                        {new Date(leave.end_date).toLocaleDateString('pl-PL')}
                        <span className="ml-2 text-zinc-600">({days} {days === 1 ? 'dzień' : 'dni'})</span>
                      </p>
                    </div>
                  </div>
                  <Badge className={`${cfg.bg} ${cfg.color} border gap-1 text-xs`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </Badge>
                </div>

                {leave.reason && (
                  <p className="text-xs text-zinc-500 pl-12">{leave.reason}</p>
                )}
                {leave.admin_note && (
                  <p className="text-xs text-zinc-400 pl-12 border-l-2 border-zinc-700 ml-12">
                    <span className="text-zinc-600">Notatka admina: </span>
                    {leave.admin_note}
                  </p>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
