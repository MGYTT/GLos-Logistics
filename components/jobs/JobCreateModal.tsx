'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Job } from '@/types/jobs'
import {
  ETS2_CITIES, ETS2_CARGO, ETS2_TRUCKS, ETS2_SERVERS,
  estimateDistance, estimatePay, PRIORITY_CONFIG
} from '@/lib/ets2/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  MapPin, Package, Truck, ArrowRight,
  Coins, Weight, Server, Info
} from 'lucide-react'

interface Props {
  currentUser: { id: string; username: string; rank: string }
  onCreated:   (job: Job) => void
  onClose:     () => void
}

const STEPS = ['Trasa', 'Ładunek', 'Szczegóły']

export function JobCreateModal({ currentUser, onCreated, onClose }: Props) {
  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    title:        '',
    from_city:    '',
    to_city:      '',
    cargo:        '',
    cargo_weight: 0,
    trailer_type: '',
    truck:        'UNASSIGNED',
    distance_km:  0,
    pay:          0,
    priority:     'normal' as keyof typeof PRIORITY_CONFIG,
    server:       'EU1',
    notes:        '',
  })

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  // Auto-uzupełnianie po wyborze ładunku
  const handleCargoSelect = useCallback((cargoName: string) => {
    const cargo = ETS2_CARGO.find(c => c.name === cargoName)
    if (!cargo) return
    set('cargo', cargoName)
    set('cargo_weight', cargo.weight)
    set('trailer_type', cargo.trailer)
  }, [])

  // Auto-oblicz dystans i pay po wyborze miast
  const recalculate = useCallback((from: string, to: string, priority: string) => {
    if (!from || !to) return
    const dist = estimateDistance(from, to)
    const cargo = ETS2_CARGO.find(c => c.name === form.cargo)
    const weight = cargo?.weight ?? form.cargo_weight
    const pay = estimatePay(dist, weight, priority as any)
    set('distance_km', dist)
    set('pay', pay)
  }, [form.cargo, form.cargo_weight])

  // Generuj tytuł automatycznie
  const autoTitle = form.from_city && form.to_city && form.cargo
    ? `${form.cargo} | ${form.from_city} → ${form.to_city}`
    : ''

  const canNext = [
    form.from_city && form.to_city && form.from_city !== form.to_city,
    form.cargo && form.cargo_weight > 0 && form.trailer_type,
    true,
  ]

  async function handleSubmit() {
  setLoading(true)
  const title = form.title.trim() || autoTitle

  const res = await fetch('/api/jobs', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      from_city:    form.from_city,
      to_city:      form.to_city,
      cargo:        form.cargo,
      cargo_weight: form.cargo_weight,
      trailer_type: form.trailer_type,
      truck:        form.truck === 'UNASSIGNED' ? null : form.truck,
      distance_km:  form.distance_km || null,
      pay:          form.pay || null,
      priority:     form.priority,
      server:       form.server,
      notes:        form.notes.trim() || null,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    toast.error('Błąd tworzenia zlecenia: ' + data.error)
  } else {
    toast.success('Zlecenie dodane! 🚛')
    onCreated(data)
  }
  setLoading(false)
}

  const cityItems = ETS2_CITIES.map(c => (
    <SelectItem key={c.name} value={c.name}>
      <span className="flex items-center gap-2">
        <span>{c.flag}</span>
        <span>{c.name}</span>
        <span className="text-zinc-500 text-xs">{c.country}</span>
      </span>
    </SelectItem>
  ))

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            Nowe zlecenie
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex gap-2 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${
                i < step  ? 'bg-amber-500'   :
                i === step ? 'bg-amber-400'   : 'bg-zinc-700'
              }`} />
              <div className={`text-[10px] mt-1 font-medium ${
                i === step ? 'text-amber-400' : 'text-zinc-600'
              }`}>{s}</div>
            </div>
          ))}
        </div>

        {/* KROK 0 – Trasa */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-green-400" />
                Miasto startowe *
              </Label>
              <Select
                value={form.from_city}
                onValueChange={v => {
                  set('from_city', v)
                  recalculate(v, form.to_city, form.priority)
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Wybierz miasto..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                  {cityItems}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-zinc-600">
              <div className="flex-1 h-px bg-zinc-800" />
              <ArrowRight className="w-4 h-4 text-amber-500" />
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                Miasto docelowe *
              </Label>
              <Select
                value={form.to_city}
                onValueChange={v => {
                  set('to_city', v)
                  recalculate(form.from_city, v, form.priority)
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Wybierz miasto..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                  {cityItems}
                </SelectContent>
              </Select>
            </div>

            {form.from_city === form.to_city && form.from_city && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Miasta startowe i docelowe muszą być różne
              </p>
            )}

            {form.distance_km > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Szacowany dystans:</span>
                  <span className="text-amber-400 font-bold">{form.distance_km} km</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* KROK 1 – Ładunek */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                Rodzaj ładunku *
              </Label>
              <Select value={form.cargo} onValueChange={handleCargoSelect}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Wybierz ładunek..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 max-h-64">
                  {/* Grupuj po kategorii */}
                  {Array.from(new Set(ETS2_CARGO.map(c => c.category))).map(cat => (
                    <div key={cat}>
                      <div className="px-2 py-1 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                        {cat}
                      </div>
                      {ETS2_CARGO.filter(c => c.category === cat).map(c => (
                        <SelectItem key={c.name} value={c.name}>
                          <span className="flex items-center justify-between w-full gap-4">
                            <span>{c.name}</span>
                            <span className="text-zinc-500 text-xs">{c.weight}t</span>
                          </span>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Weight className="w-3.5 h-3.5 text-zinc-400" />
                  Masa (tony)
                </Label>
                <Input
                  type="number" min={1} max={60} step={0.5}
                  value={form.cargo_weight}
                  onChange={e => set('cargo_weight', parseFloat(e.target.value))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Typ naczepy</Label>
                <Input
                  value={form.trailer_type}
                  onChange={e => set('trailer_type', e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="Auto-wypełnione"
                />
              </div>
            </div>

            {form.cargo && (
              <div className="bg-zinc-800/50 rounded-lg p-3 text-xs space-y-1 text-zinc-400">
                <div className="flex justify-between">
                  <span>Naczepa:</span>
                  <span className="text-white">{form.trailer_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Masa:</span>
                  <span className="text-amber-400 font-bold">{form.cargo_weight}t</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* KROK 2 – Szczegóły */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tytuł zlecenia</Label>
              <Input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder={autoTitle || 'Opcjonalny tytuł...'}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-zinc-400" />
                  Preferowana ciężarówka
                </Label>
                <Select value={form.truck} onValueChange={v => set('truck', v)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-56">
                    <SelectItem value="UNASSIGNED">
                      <span className="text-zinc-500">— Dowolna</span>
                    </SelectItem>
                    {ETS2_TRUCKS.map(t => (
                      <SelectItem key={`${t.brand} ${t.model}`} value={`${t.brand} ${t.model}`}>
                        {t.brand} {t.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-zinc-400" />
                  Serwer TMP
                </Label>
                <Select value={form.server} onValueChange={v => set('server', v)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {ETS2_SERVERS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Priorytet</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(PRIORITY_CONFIG) as any[]).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      set('priority', k)
                      recalculate(form.from_city, form.to_city, k)
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                      form.priority === k
                        ? `${v.bg} ${v.color}`
                        : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Podsumowanie */}
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="font-bold text-zinc-300 mb-3">📋 Podsumowanie</div>
              {[
                { label: 'Trasa',    value: `${form.from_city} → ${form.to_city}` },
                { label: 'Ładunek', value: `${form.cargo} (${form.cargo_weight}t)` },
                { label: 'Dystans', value: form.distance_km ? `${form.distance_km} km` : '—' },
                { label: 'Serwer',  value: form.server },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-zinc-500">{label}:</span>
                  <span className="font-medium text-zinc-200">{value}</span>
                </div>
              ))}
              {form.pay > 0 && (
                <div className="flex justify-between pt-2 border-t border-zinc-700">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    Wynagrodzenie:
                  </span>
                  <span className="font-black text-green-400 text-base">
                    {form.pay.toLocaleString()} €
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Dodatkowe uwagi</Label>
              <Textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Szczegóły trasy, wymagania, itp..."
                rows={3}
                className="bg-zinc-800 border-zinc-700 resize-none"
              />
            </div>
          </div>
        )}

        {/* Nawigacja */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}
              className="border-zinc-700 flex-1">
              Wstecz
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              disabled={!canNext[step]}
              onClick={() => setStep(s => s + 1)}
              className="bg-amber-500 text-black hover:bg-amber-400 font-bold flex-1"
            >
              Dalej →
            </Button>
          ) : (
            <Button
              disabled={loading || !canNext[0]}
              onClick={handleSubmit}
              className="bg-amber-500 text-black hover:bg-amber-400 font-bold flex-1"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : '🚛 Opublikuj zlecenie'
              }
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
