'use client'
import dynamic from 'next/dynamic'
import { useLiveMap } from '@/lib/hooks/useLiveMap'
import { ConnectionStatus } from './ConnectionStatus'
import { MapLegend } from './MapLegend'
import { Users } from 'lucide-react'

// Leaflet MUSI być załadowany dynamicznie bez SSR
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent
                        rounded-full animate-spin mx-auto" />
        <p className="text-zinc-500 text-sm">Ładowanie mapy...</p>
      </div>
    </div>
  ),
})

export function LiveMapClient() {
  const { drivers, connected, lastUpdate } = useLiveMap()

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden
                    border border-zinc-800">

      {/* Status — nakładka na mapę */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <ConnectionStatus
          connected={connected}
          lastUpdate={lastUpdate}
          count={drivers.length}
        />
      </div>

      {/* Legenda */}
      <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
        <MapLegend />
      </div>

      {/* Brak kierowców */}
      {drivers.length === 0 && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center
                        pointer-events-none">
          <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800
                          rounded-xl px-6 py-4 text-center shadow-2xl">
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm font-medium">
              Brak kierowców online
            </p>
            <p className="text-zinc-600 text-xs mt-1">
              Uruchom VTC Bridge aby pojawić się na mapie
            </p>
          </div>
        </div>
      )}

      {/* Mapa — pełna wysokość */}
      <div className="w-full h-full">
        <LeafletMap drivers={drivers} />
      </div>
    </div>
  )
}
