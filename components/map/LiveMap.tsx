'use client'
import { useState } from 'react'
import { useLiveMap, DriverOnMap, Member } from '@/lib/hooks/useLiveMap'
import { MapStatusBar } from './MapStatusBar'
import { MapDriverPanel } from './MapDriverPanel'
import { ServerSelector } from './ServerSelector'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const MapCanvas = dynamic(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
        <p className="text-zinc-500 text-sm">Ładowanie mapy ETS2...</p>
        <p className="text-zinc-600 text-xs">Pobieranie tileset...</p>
      </div>
    </div>
  ),
})

interface Props { members: Member[] }

export function LiveMap({ members }: Props) {
  const [serverId, setServerId] = useState(1)
  const [selected, setSelected] = useState<DriverOnMap | null>(null)
  const { drivers, status, lastUpdate, vtcOnline, totalOnline } = useLiveMap(members, serverId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <MapStatusBar
        status={status}
        vtcOnline={vtcOnline}
        totalOnline={totalOnline}
        totalMembers={members.length}
        lastUpdate={lastUpdate}
      >
        <ServerSelector
          current={serverId}
          onChange={(id) => { setServerId(id); setSelected(null) }}
        />
      </MapStatusBar>

      <div className="flex-1 relative overflow-hidden">
        <MapCanvas
          drivers={drivers}
          selected={selected}
          onSelect={setSelected}
        />
        {selected && (
          <MapDriverPanel
            driver={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  )
}
