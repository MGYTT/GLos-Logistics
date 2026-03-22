'use client'
import { useState } from 'react'
import { FleetTruck } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { TruckCard } from '@/components/fleet/TruckCard'
import { ImageUpload } from '@/components/fleet/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Plus, Trash2, Truck } from 'lucide-react'

interface Member { id: string; username: string }

interface Props {
  fleet:   FleetTruck[]
  members: Member[]
}

// Stała dla "brak przypisania" – nigdy nie jest pustym stringiem
const UNASSIGNED = 'UNASSIGNED'

const emptyForm = {
  name:        '',
  brand:       '',
  model:       '',
  assigned_to: UNASSIGNED,
  image_urls:  [] as string[],
}

export function FleetAdminPanel({ fleet: initial, members }: Props) {
  const [fleet, setFleet]     = useState(initial)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function setField(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function addTruck() {
  if (!form.name.trim())  return toast.error('Podaj nazwę pojazdu')
  if (!form.brand.trim()) return toast.error('Podaj markę pojazdu')
  setLoading(true)

  const res = await fetch('/api/admin/fleet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:        form.name.trim(),
      brand:       form.brand.trim(),
      model:       form.model.trim() || null,
      assigned_to: form.assigned_to,
      image_urls:  form.image_urls,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    toast.error('Błąd dodawania: ' + data.error)
  } else {
    setFleet(prev => [...prev, data])
    setForm(emptyForm)
    setOpen(false)
    toast.success('Pojazd dodany do floty! 🚛')
  }
  setLoading(false)
}

async function deleteTruck(id: string, name: string) {
  const res = await fetch('/api/admin/fleet', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })

  if (!res.ok) {
    const data = await res.json()
    return toast.error('Błąd usuwania: ' + data.error)
  }

  setFleet(prev => prev.filter(t => t.id !== id))
  toast.success(`${name} usunięty z floty`)
}

async function updateAssignment(truckId: string, memberId: string) {
  const res = await fetch('/api/admin/fleet', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id:          truckId,
      assigned_to: memberId,
    }),
  })

  const data = await res.json()

  if (!res.ok) return toast.error('Błąd przypisania: ' + data.error)

  setFleet(prev => prev.map(t => t.id === truckId ? data : t))
  toast.success(memberId === 'UNASSIGNED' ? 'Przypisanie usunięte' : 'Kierowca przypisany')
}

  return (
    <div className="space-y-6">

      {/* Przycisk dodawania */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-amber-500 text-black hover:bg-amber-400 font-bold gap-2">
            <Plus className="w-4 h-4" />
            Dodaj pojazd
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              Nowy pojazd
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              {/* Nazwa */}
              <div className="space-y-1.5">
                <Label>Nazwa *</Label>
                <Input
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="Volvo FH16 #1"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              {/* Marka */}
              <div className="space-y-1.5">
                <Label>Marka *</Label>
                <Input
                  value={form.brand}
                  onChange={e => setField('brand', e.target.value)}
                  placeholder="Volvo"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              {/* Model */}
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input
                  value={form.model}
                  onChange={e => setField('model', e.target.value)}
                  placeholder="FH16 750"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              {/* Kierowca */}
              <div className="space-y-1.5">
                <Label>Przypisz kierowcę</Label>
                <Select
                  value={form.assigned_to}
                  onValueChange={v => setField('assigned_to', v)}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Nieprzypisany" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value={UNASSIGNED}>
                      <span className="text-zinc-500">— Nieprzypisany</span>
                    </SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Upload zdjęć */}
            <div className="space-y-1.5">
              <Label>Zdjęcia pojazdu</Label>
              <ImageUpload
                onUpload={urls => setField('image_urls', [...form.image_urls, ...urls])}
                folder="trucks"
                maxFiles={5}
              />
              {form.image_urls.length > 0 && (
                <p className="text-xs text-zinc-500">
                  Wgrano {form.image_urls.length} zdjęć
                </p>
              )}
            </div>

            <Button
              onClick={addTruck}
              disabled={loading}
              className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold h-10"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj do floty
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Siatka pojazdów */}
      {fleet.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <Truck className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">Flota jest pusta</p>
          <p className="text-zinc-600 text-sm mt-1">Dodaj pierwszy pojazd!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fleet.map(truck => (
            <div key={truck.id} className="relative group">
              <TruckCard truck={truck} />

              {/* Overlay akcji */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">

                {/* Zmień przypisanie */}
                <Select
                  value={truck.assigned_to ?? UNASSIGNED}
                  onValueChange={v => updateAssignment(truck.id, v)}
                >
                  <SelectTrigger className="flex-1 h-7 text-xs bg-zinc-900/90 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value={UNASSIGNED}>
                      <span className="text-zinc-500">— Nieprzypisany</span>
                    </SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Usuń */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-zinc-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Usunąć {truck.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        Pojazd zostanie trwale usunięty z floty.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-zinc-700">
                        Anuluj
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTruck(truck.id, truck.name)}
                        className="bg-red-600 hover:bg-red-500 text-white"
                      >
                        Usuń
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {fleet.length > 0 && (
        <p className="text-xs text-zinc-600 text-right">
          {fleet.length} {fleet.length === 1 ? 'pojazd' : 'pojazdów'} w flocie
        </p>
      )}
    </div>
  )
}
