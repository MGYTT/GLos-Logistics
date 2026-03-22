'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recruitmentSchema, RecruitmentForm } from '@/lib/validations/recruitment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useState } from 'react'
import { Truck, Send } from 'lucide-react'
import type { z } from 'zod'

export default function RecruitmentPage() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } =
  useForm({
    resolver: zodResolver(recruitmentSchema),
  })

  async function onSubmit(data: z.infer<typeof recruitmentSchema>) {
    setLoading(true)
    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success('Podanie wysłane! Odezwiemy się na Discord.')
      reset()
    } catch {
      toast.error('Błąd wysyłania. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4">
            <Truck className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-3xl font-black mb-2">Złóż podanie</h1>
          <p className="text-zinc-500">Dołącz do naszego VTC i jedź razem z najlepszymi.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-2xl p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label>Nick w grze</Label>
              <Input {...register('username')} placeholder="TwójNick" className="bg-zinc-900 border-zinc-700" />
              {errors.username && <p className="text-xs text-red-400">{errors.username.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Steam ID</Label>
              <Input {...register('steam_id')} placeholder="76561198..." className="bg-zinc-900 border-zinc-700" />
              {errors.steam_id && <p className="text-xs text-red-400">{errors.steam_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Discord</Label>
              <Input {...register('discord_tag')} placeholder="nick#1234 lub @nick" className="bg-zinc-900 border-zinc-700" />
              {errors.discord_tag && <p className="text-xs text-red-400">{errors.discord_tag.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Godziny w ETS2</Label>
              <Input {...register('ets2_hours')} type="number" placeholder="np. 500" className="bg-zinc-900 border-zinc-700" />
              {errors.ets2_hours && <p className="text-xs text-red-400">{errors.ets2_hours.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>TruckersHub ID (opcjonalne)</Label>
            <Input {...register('truckershub_id')} placeholder="ID z TruckersHub" className="bg-zinc-900 border-zinc-700" />
          </div>

          <div className="space-y-1.5">
            <Label>Dlaczego chcesz do nas dołączyć?</Label>
            <Textarea
              {...register('motivation')}
              placeholder="Napisz kilka słów o sobie i swoich oczekiwaniach... (min. 50 znaków)"
              rows={5}
              className="bg-zinc-900 border-zinc-700 resize-none"
            />
            {errors.motivation && <p className="text-xs text-red-400">{errors.motivation.message}</p>}
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="rules"
              onCheckedChange={v => setValue('accepted_rules', v === true)}
            />
            <Label htmlFor="rules" className="text-sm text-zinc-400 leading-relaxed cursor-pointer">
              Akceptuję regulamin VTC, zobowiązuję się do aktywności min. 2x w tygodniu
              i przestrzegania zasad kulturalnej jazdy.
            </Label>
          </div>
          {errors.accepted_rules && <p className="text-xs text-red-400">{errors.accepted_rules.message}</p>}

          <Button type="submit" disabled={loading} className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold gap-2 h-11">
            {loading ? 'Wysyłanie...' : <><Send className="w-4 h-4" /> Wyślij podanie</>}
          </Button>
        </form>
      </div>
    </div>
  )
}
