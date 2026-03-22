'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Send, Gamepad2, MessageSquare, User, Truck } from 'lucide-react'

interface Props {
  userId: string
  canApply: boolean
}

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
  }),
}

export function ApplyForm({ userId, canApply }: Props) {
  const [form, setForm] = useState({
    username:       '',
    steam_id:       '',
    discord_tag:    '',
    truckershub_id: '',
    ets2_hours:     '',
    motivation:     '',
  })
  const [loading, setLoading] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canApply) return

    if (Number(form.ets2_hours) < 100) {
      toast.error('Wymagane minimum 100 godzin w ETS2!')
      return
    }
    if (form.motivation.length < 50) {
      toast.error('Motywacja musi mieć minimum 50 znaków!')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('applications').insert({
      user_id:        userId,
      username:       form.username,
      steam_id:       form.steam_id,
      discord_tag:    form.discord_tag,
      truckershub_id: form.truckershub_id || null,
      ets2_hours:     Number(form.ets2_hours),
      motivation:     form.motivation,
      status:         'pending',
    })

    if (error) {
      toast.error('Błąd wysyłania podania: ' + error.message)
      setLoading(false)
      return
    }

    toast.success('Podanie wysłane! Czekaj na odpowiedź zarządu 🎉')
    router.push('/pending')
    router.refresh()
  }

  const fields = [
    { key: 'username',       label: 'Nick w grze *',     icon: User,        type: 'text',   placeholder: 'TwójNick',           min: 3  },
    { key: 'steam_id',       label: 'Steam ID *',        icon: Gamepad2,    type: 'text',   placeholder: '76561198...',        min: 1  },
    { key: 'discord_tag',    label: 'Discord *',         icon: MessageSquare,type: 'text',  placeholder: 'nick#0000 lub nick', min: 1  },
    { key: 'truckershub_id', label: 'TruckersHub ID',    icon: Truck,       type: 'text',   placeholder: 'Opcjonalne',         min: 0  },
    { key: 'ets2_hours',     label: 'Godziny w ETS2 *',  icon: Gamepad2,    type: 'number', placeholder: '100',                min: 1  },
  ]

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      className="glass rounded-2xl p-7 space-y-5"
    >
      {/* Pola tekstowe */}
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(({ key, label, icon: Icon, type, placeholder }, i) => (
          <motion.div key={key} custom={i} variants={fadeUp} className="space-y-1.5">
            <Label className="text-zinc-300">{label}</Label>
            <div className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                type={type}
                value={(form as any)[key]}
                onChange={set(key)}
                placeholder={placeholder}
                className="pl-9 bg-zinc-900 border-zinc-700 focus:border-amber-500/50"
                required={label.includes('*')}
                min={type === 'number' ? 0 : undefined}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Motywacja */}
      <motion.div custom={5} variants={fadeUp} className="space-y-1.5">
        <Label className="text-zinc-300">
          Dlaczego chcesz dołączyć do VTC? *
          <span className="text-zinc-600 font-normal ml-2">
            ({form.motivation.length}/50 min)
          </span>
        </Label>
        <Textarea
          value={form.motivation}
          onChange={set('motivation')}
          placeholder="Opisz swoją motywację, doświadczenie z ETS2, co możesz wnieść do VTC..."
          rows={5}
          required
          minLength={50}
          className="bg-zinc-900 border-zinc-700 focus:border-amber-500/50 resize-none"
        />
      </motion.div>

      {/* Wymagania */}
      <motion.div custom={6} variants={fadeUp} className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Wymagania</p>
        {[
          'Minimum 100h w ETS2 lub ATS',
          'Zainstalowany TruckersMP',
          'Aktywność min. 2x w tygodniu',
        ].map(r => (
          <div key={r} className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {r}
          </div>
        ))}
      </motion.div>

      {/* Submit */}
      <motion.div custom={7} variants={fadeUp}>
        <Button
          type="submit"
          disabled={loading || !canApply}
          className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold h-11 gap-2 text-base"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {loading ? 'Wysyłanie...' : 'Wyślij podanie'}
        </Button>
      </motion.div>
    </motion.form>
  )
}
