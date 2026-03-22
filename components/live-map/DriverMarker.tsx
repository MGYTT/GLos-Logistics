'use client'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { ArrowRight, Gauge, Package, Truck } from 'lucide-react'
import type { LiveDriver } from '@/lib/hooks/useLiveMap'

// Kalibracja ETS2 world coords → Leaflet LatLng
// Dopasowana do kafelków TruckyApp
function gameToLatLng(x: number, z: number): [number, number] {
  // Centrum mapy ETS2 odpowiada mniej więcej środkowej Europie
  const lat = (z / -115.0) + 55.0
  const lng = (x /   85.0) + 15.0
  return [lat, lng]
}

function makeIcon(driver: LiveDriver): L.DivIcon {
  const ringColor = driver.has_job ? '#4ade80' : '#52525b'
  const initial   = driver.member?.username?.[0]?.toUpperCase() ?? '?'

  const html = renderToStaticMarkup(
    <div style={{ position: 'relative', width: '44px', height: '44px', cursor: 'pointer' }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: `3px solid ${ringColor}`,
        boxShadow: `0 0 10px ${ringColor}80`,
      }} />
      {driver.member?.avatar_url ? (
        <img
          src={driver.member.avatar_url}
          style={{
            width: '38px', height: '38px', borderRadius: '50%',
            objectFit: 'cover', position: 'absolute', top: '3px', left: '3px',
          }}
        />
      ) : (
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: '#27272a', position: 'absolute', top: '3px', left: '3px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', color: '#fbbf24', fontSize: '14px',
        }}>
          {initial}
        </div>
      )}
      {/* Pulsująca kropka gdy w trasie */}
      {driver.has_job && (
        <div style={{
          position: 'absolute', bottom: '1px', right: '1px',
          width: '12px', height: '12px', borderRadius: '50%',
          background: '#4ade80', border: '2px solid #09090b',
        }} />
      )}
    </div>
  )

  return L.divIcon({
    html,
    className:     '',
    iconSize:      [44, 44],
    iconAnchor:    [22, 22],
    tooltipAnchor: [22, -22],
  })
}

interface Props { driver: LiveDriver }

export function DriverMarker({ driver }: Props) {
  if (driver.game_x == null || driver.game_z == null) return null

  const position = gameToLatLng(driver.game_x, driver.game_z)
  const icon     = makeIcon(driver)
  const cfg      = driver.member ? getRankConfig(driver.member.rank as any) : null

  return (
    <Marker position={position} icon={icon}>
      <Tooltip
        direction="top"
        offset={[0, -26]}
        opacity={1}
        className="!bg-transparent !border-0 !shadow-none !p-0"
      >
        <div className="bg-zinc-900/95 border border-zinc-700 rounded-xl p-3
                        shadow-2xl min-w-[210px] text-xs space-y-2 backdrop-blur">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            {driver.member?.avatar_url ? (
              <img src={driver.member.avatar_url}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-green-500/40" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center
                              justify-center font-bold text-amber-400 text-base ring-2
                              ring-green-500/40">
                {driver.member?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="font-bold text-white text-sm">
                {driver.member?.username ?? 'Unknown'}
              </p>
              {cfg && (
                <p className={`text-[10px] font-medium ${cfg.color}`}>
                  {cfg.label}
                </p>
              )}
            </div>
          </div>

          {/* Trasa */}
          {driver.from_city && driver.to_city && (
            <div className="flex items-center gap-1.5 bg-zinc-800/60
                            rounded-lg px-2.5 py-1.5 text-zinc-300">
              <span className="truncate max-w-[72px]">{driver.from_city}</span>
              <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate max-w-[72px]">{driver.to_city}</span>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              {
                Icon:  Gauge,
                color: driver.speed_kmh && driver.speed_kmh > 90
                  ? 'text-red-400' : 'text-green-400',
                bg:    driver.speed_kmh && driver.speed_kmh > 90
                  ? 'bg-red-400/10' : 'bg-green-400/10',
                value: `${driver.speed_kmh ?? 0}`,
                unit:  'km/h',
              },
              {
                Icon:  Package,
                color: 'text-amber-400',
                bg:    'bg-amber-400/10',
                value: driver.cargo?.split(' ')[0] ?? '—',
                unit:  'ładunek',
              },
              {
                Icon:  Truck,
                color: 'text-blue-400',
                bg:    'bg-blue-400/10',
                value: driver.truck_brand ?? '—',
                unit:  'marka',
              },
            ].map(({ Icon, color, bg, value, unit }) => (
              <div key={unit}
                className={`${bg} rounded-lg p-1.5 text-center`}>
                <Icon className={`w-3 h-3 ${color} mx-auto mb-0.5`} />
                <p className={`font-bold ${color} truncate text-[10px]`}>{value}</p>
                <p className="text-[9px] text-zinc-500">{unit}</p>
              </div>
            ))}
          </div>

          {/* Dystans do celu */}
          {driver.distance_remaining_km && (
            <div className="text-center text-[10px] text-zinc-500 bg-zinc-800/40
                            rounded-lg py-1">
              📍 Pozostało:{' '}
              <span className="text-white font-bold">
                {driver.distance_remaining_km} km
              </span>
            </div>
          )}
        </div>
      </Tooltip>
    </Marker>
  )
}
