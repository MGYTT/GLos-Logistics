import { Map, Satellite, Radio, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata = { title: 'Live Map — Wkrótce' }

export default function LiveMapPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 p-4">
      <PageHeader
        icon={Map}
        title="Live Map"
        description="Kierowcy VTC w czasie rzeczywistym"
      />

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md space-y-8">

          {/* Ikona z animacją */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-amber-400/10
                            animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-amber-400/10
                            border border-amber-400/30 flex items-center
                            justify-center">
              <Map className="w-10 h-10 text-amber-400" />
            </div>
          </div>

          {/* Tekst */}
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-white">
              Mapa w przygotowaniu
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Pracujemy nad interaktywną mapą live pokazującą
              pozycje kierowców VTC w czasie rzeczywistym.
              Funkcja zostanie udostępniona wkrótce.
            </p>
          </div>

          {/* Planowane funkcje */}
          <div className="grid grid-cols-1 gap-3 text-left">
            {[
              {
                icon:  Satellite,
                color: 'text-blue-400',
                bg:    'bg-blue-400/10',
                label: 'Pozycje GPS w czasie rzeczywistym',
                desc:  'Markery kierowców aktualizowane co 10 sekund',
              },
              {
                icon:  Radio,
                color: 'text-green-400',
                bg:    'bg-green-400/10',
                label: 'Supabase Realtime',
                desc:  'Dane z VTC Bridge bez odświeżania strony',
              },
              {
                icon:  Clock,
                color: 'text-purple-400',
                bg:    'bg-purple-400/10',
                label: 'Status trasy i ładunku',
                desc:  'Prędkość, cargo, dystans do celu na tooltipie',
              },
            ].map(({ icon: Icon, color, bg, label, desc }) => (
              <div key={label}
                className="flex items-start gap-3 bg-zinc-900/60 border
                           border-zinc-800 rounded-xl p-4">
                <div className={`${bg} rounded-lg p-2 shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                          bg-zinc-900 border border-zinc-800 text-xs text-zinc-500">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            VTC Bridge już zbiera dane — mapa gotowa wkrótce
          </div>

        </div>
      </div>
    </div>
  )
}
