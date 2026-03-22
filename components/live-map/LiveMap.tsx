'use client'
import { useEffect, useRef, useState } from 'react'
import { useLiveMap } from '@/lib/hooks/useLiveMap'
import { ConnectionStatus } from './ConnectionStatus'
import { MapLegend } from './MapLegend'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { Users } from 'lucide-react'

// ETS2 world bounds
const WORLD_X_MIN = -16000
const WORLD_X_MAX =  16000
const WORLD_Z_MIN = -16000
const WORLD_Z_MAX =  16000

function gameToPercent(x: number, z: number) {
  const left = ((x - WORLD_X_MIN) / (WORLD_X_MAX - WORLD_X_MIN)) * 100
  const top  = ((z - WORLD_Z_MIN) / (WORLD_Z_MAX - WORLD_Z_MIN)) * 100
  return {
    left: Math.max(0, Math.min(100, left)),
    top:  Math.max(0, Math.min(100, top)),
  }
}

export function LiveMap() {
  const { drivers, connected, lastUpdate } = useLiveMap()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError]   = useState(false)

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden
                    border border-zinc-800 bg-[#1a1a2e]">

      {/* Status */}
      <div className="absolute top-4 left-4 z-20">
        <ConnectionStatus
          connected={connected}
          lastUpdate={lastUpdate}
          count={drivers.length}
        />
      </div>

      {/* Legenda */}
      <div className="absolute top-4 right-4 z-20">
        <MapLegend />
      </div>

      {/* Mapa ETS2 — obraz w tle */}
      <div className="relative w-full h-full select-none">

        {/* Loader dopóki obraz się ładuje */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-2 border-amber-400
                              border-t-transparent rounded-full
                              animate-spin mx-auto" />
              <p className="text-zinc-500 text-sm">Ładowanie mapy ETS2...</p>
            </div>
          </div>
        )}

        {/* Mapa jako tło — używamy publicznej mapy z TruckyApp web */}
        {!imgError ? (
          <img
            src="https://cdn.trucky.app/images/maps/ets2-map.jpg"
            alt="ETS2 Map"
            className={`w-full h-full object-cover transition-opacity duration-500
                        ${imgLoaded ? 'opacity-90' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true)
              setImgLoaded(true)
            }}
            draggable={false}
          />
        ) : (
          /* Fallback — ciemna mapa z gridlines gdy obraz niedostępny */
          <MapFallback />
        )}

        {/* Brak kierowców */}
        {drivers.length === 0 && imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10
                          pointer-events-none">
            <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800
                            rounded-xl px-6 py-4 text-center shadow-2xl">
              <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm font-medium">Brak kierowców online</p>
              <p className="text-zinc-600 text-xs mt-1">
                Uruchom VTC Bridge aby pojawić się na mapie
              </p>
            </div>
          </div>
        )}

        {/* Markery kierowców */}
        {imgLoaded && drivers.map(driver => {
          if (driver.game_x == null || driver.game_z == null) return null
          const { left, top } = gameToPercent(driver.game_x, driver.game_z)
          const isHovered      = hoveredId === driver.member_id
          const cfg            = driver.member
            ? getRankConfig(driver.member.rank as any)
            : null

          return (
            <div
              key={driver.member_id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2
                         cursor-pointer"
              style={{ left: `${left}%`, top: `${top}%` }}
              onMouseEnter={() => setHoveredId(driver.member_id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Marker */}
              <div className="relative">
                {/* Pulsujący ring gdy w trasie */}
                {driver.has_job && (
                  <div className="absolute inset-0 rounded-full bg-green-400/30
                                  animate-ping" />
                )}

                {/* Avatar */}
                <div className={`relative w-10 h-10 rounded-full border-2
                  transition-transform duration-150
                  ${isHovered ? 'scale-125' : 'scale-100'}
                  ${driver.has_job
                    ? 'border-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                    : 'border-zinc-600'
                  }`}>
                  {driver.member?.avatar_url ? (
                    <img
                      src={driver.member.avatar_url}
                      className="w-full h-full rounded-full object-cover"
                      alt={driver.member.username}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-zinc-800
                                    flex items-center justify-center
                                    font-bold text-amber-400 text-sm">
                      {driver.member?.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}

                  {/* Ranga dot */}
                  {cfg && (
                    <div className={`absolute -bottom-0.5 -right-0.5
                      w-3 h-3 rounded-full border-2 border-zinc-900
                      ${cfg.bg}`}
                    />
                  )}
                </div>

                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2
                                  mb-3 w-52 pointer-events-none z-30">
                    <div className="bg-zinc-900/98 border border-zinc-700
                                    rounded-xl p-3 shadow-2xl space-y-2 text-xs">

                      {/* Header */}
                      <div className="flex items-center gap-2">
                        {driver.member?.avatar_url ? (
                          <img src={driver.member.avatar_url}
                            className="w-8 h-8 rounded-full object-cover
                                       ring-1 ring-green-500/40" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-800
                                          flex items-center justify-center
                                          font-bold text-amber-400">
                            {driver.member?.username?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white">
                            {driver.member?.username ?? 'Unknown'}
                          </p>
                          {cfg && (
                            <p className={`text-[10px] ${cfg.color}`}>
                              {cfg.label}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Trasa */}
                      {driver.from_city && driver.to_city && (
                        <div className="flex items-center gap-1 bg-zinc-800/60
                                        rounded-lg px-2 py-1.5 text-zinc-300">
                          <span className="truncate max-w-[70px]">
                            {driver.from_city}
                          </span>
                          <span className="text-amber-400 shrink-0">→</span>
                          <span className="truncate max-w-[70px]">
                            {driver.to_city}
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-1">
                        <Stat
                          label="Prędkość"
                          value={`${driver.speed_kmh ?? 0} km/h`}
                          color={
                            (driver.speed_kmh ?? 0) > 90
                              ? 'text-red-400' : 'text-green-400'
                          }
                        />
                        <Stat
                          label="Ładunek"
                          value={driver.cargo?.split(' ')[0] ?? '—'}
                          color="text-amber-400"
                        />
                        <Stat
                          label="Dystans"
                          value={
                            driver.distance_remaining_km
                              ? `${driver.distance_remaining_km}km`
                              : '—'
                          }
                          color="text-blue-400"
                        />
                      </div>

                      {/* Ciężarówka */}
                      {driver.truck_brand && (
                        <p className="text-center text-[10px] text-zinc-500
                                      bg-zinc-800/40 rounded py-1">
                          🚛 {driver.truck_brand} {driver.truck_model}
                        </p>
                      )}
                    </div>

                    {/* Strzałka tooltipa */}
                    <div className="w-2.5 h-2.5 bg-zinc-900 border-r border-b
                                    border-zinc-700 rotate-45 mx-auto
                                    -mt-1.5" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Mini komponent stat w tooltipie
function Stat({ label, value, color }: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-zinc-800/60 rounded-lg p-1.5 text-center">
      <p className={`font-bold ${color} truncate text-[10px]`}>{value}</p>
      <p className="text-[9px] text-zinc-500">{label}</p>
    </div>
  )
}

// Fallback gdy mapa nie załaduje się z CDN
function MapFallback() {
  return (
    <div className="w-full h-full relative bg-[#0f172a]"
         style={{
           backgroundImage: `
             linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px),
             linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)
           `,
           backgroundSize: '5% 5%',
         }}>
      {/* Kontury Europy — uproszczone SVG */}
      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text x="50%" y="50%" textAnchor="middle"
          fill="#475569" fontSize="14"
          fontFamily="monospace">
          Mapa niedostępna — kierowcy widoczni na markerach
        </text>
      </svg>
    </div>
  )
}
