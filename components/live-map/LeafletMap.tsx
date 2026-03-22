'use client'
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import { getRankConfig } from '@/lib/utils/rankUtils'
import { ArrowRight, Gauge, Package, Truck } from 'lucide-react'
import type { LiveDriver } from '@/lib/hooks/useLiveMap'

// Kalibracja ETS2 → LatLng (Europa Zachodnia/Środkowa)
function gameToLatLng(x: number, z: number): [number, number] {
  const lat = -(z / 115.0) + 55.5
  const lng =  (x /  85.0) + 14.5
  return [lat, lng]
}

function makeIcon(driver: LiveDriver): L.DivIcon {
  const ringColor = driver.has_job ? '#4ade80' : '#52525b'
  const initial   = driver.member?.username?.[0]?.toUpperCase() ?? '?'

  const html = renderToStaticMarkup(
    <div style={{
      position: 'relative', width: '44px', height: '44px',
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `3px solid ${ringColor}`,
        boxShadow: `0 0 10px ${ringColor}80`,
      }} />
      {driver.member?.avatar_url ? (
        <img src={driver.member.avatar_url} style={{
          width: '38px', height: '38px', borderRadius: '50%',
          objectFit: 'cover', position: 'absolute', top: '3px', left: '3px',
        }} />
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
      <div style={{
        position: 'absolute', bottom: '1px', right: '1px',
        width: '12px', height: '12px', borderRadius: '50%',
        background: ringColor, border: '2px solid #09090b',
      }} />
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

interface Props { drivers: LiveDriver[] }

export default function LeafletMap({ drivers }: Props) {
  return (
    <MapContainer
      center={[52.0, 15.0]}
      zoom={5}
      minZoom={4}
      maxZoom={10}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      {/* CartoDB Dark Matter — ciemny styl idealny dla VTC */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      <ZoomControl position="bottomright" />

      {drivers.map(driver => {
        if (driver.game_x == null || driver.game_z == null) return null
        const position = gameToLatLng(driver.game_x, driver.game_z)
        const cfg      = driver.member
          ? getRankConfig(driver.member.rank as any) : null

        return (
          <Marker
            key={driver.member_id}
            position={position}
            icon={makeIcon(driver)}
          >
            <Tooltip
              direction="top"
              offset={[0, -26]}
              opacity={1}
              className="!bg-transparent !border-0 !shadow-none !p-0"
            >
              <div style={{
                background: 'rgba(9,9,11,0.97)',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                padding: '12px',
                minWidth: '210px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {driver.member?.avatar_url ? (
                    <img src={driver.member.avatar_url} style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      objectFit: 'cover', border: '2px solid #4ade8040',
                    }} />
                  ) : (
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#27272a', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 'bold',
                      color: '#fbbf24', fontSize: '14px',
                    }}>
                      {driver.member?.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
                      {driver.member?.username ?? 'Unknown'}
                    </div>
                    {cfg && (
                      <div style={{ fontSize: '10px', color: '#a1a1aa' }}>
                        {cfg.label}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trasa */}
                {driver.from_city && driver.to_city && (
                  <div style={{
                    background: '#27272a', borderRadius: '8px',
                    padding: '6px 10px', marginBottom: '8px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '11px', color: '#d4d4d8',
                  }}>
                    <span>{driver.from_city}</span>
                    <span style={{ color: '#fbbf24' }}>→</span>
                    <span>{driver.to_city}</span>
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {[
                    {
                      label: 'Prędkość',
                      value: `${driver.speed_kmh ?? 0} km/h`,
                      color: (driver.speed_kmh ?? 0) > 90 ? '#f87171' : '#4ade80',
                    },
                    {
                      label: 'Ładunek',
                      value: driver.cargo?.split(' ')[0] ?? '—',
                      color: '#fbbf24',
                    },
                    {
                      label: 'Dystans',
                      value: driver.distance_remaining_km
                        ? `${driver.distance_remaining_km}km` : '—',
                      color: '#60a5fa',
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: '#1c1c1e', borderRadius: '8px',
                      padding: '6px', textAlign: 'center',
                    }}>
                      <div style={{ color, fontWeight: 'bold', fontSize: '11px' }}>
                        {value}
                      </div>
                      <div style={{ color: '#71717a', fontSize: '9px' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {driver.truck_brand && (
                  <div style={{
                    marginTop: '8px', textAlign: 'center', fontSize: '10px',
                    color: '#71717a', background: '#1c1c1e',
                    borderRadius: '6px', padding: '4px',
                  }}>
                    🚛 {driver.truck_brand} {driver.truck_model}
                  </div>
                )}
              </div>
            </Tooltip>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
