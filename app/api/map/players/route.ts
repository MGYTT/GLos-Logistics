import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lista URL do próby — fallback jeśli jeden nie działa
const ENDPOINTS = [
  (s: string) => `https://api.truckyapp.com/v2/map/players?server=${s}`,
  (s: string) => `https://api.truckyapp.com/v1/map/players?server=${s}`,
]

export async function GET(req: NextRequest) {
  const server = req.nextUrl.searchParams.get('server') ?? '1'

  for (const buildUrl of ENDPOINTS) {
    try {
      const controller = new AbortController()
      const timeout    = setTimeout(() => controller.abort(), 8000)

      const res = await fetch(buildUrl(server), {
        signal:  controller.signal,
        headers: {
          'Accept':          'application/json',
          'User-Agent':      'Mozilla/5.0 VTC-LiveMap/1.0',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control':   'no-cache',
          'Referer':         'https://truckyapp.com/',
          'Origin':          'https://truckyapp.com',
        },
        cache: 'no-store',
      })

      clearTimeout(timeout)

      if (!res.ok) continue

      const data = await res.json()
      const players = data?.response ?? data?.players ?? data ?? []

      if (!Array.isArray(players)) continue

      // Normalizuj format odpowiedzi
      const normalized = players.map((p: any) => ({
        id:     p.id     ?? p.mp_id  ?? p.playerId ?? 0,
        name:   p.name   ?? p.nick   ?? p.username ?? 'Unknown',
        x:      p.x      ?? p.posX   ?? 0,
        y:      p.y      ?? p.posY   ?? p.z        ?? 0,
        server: p.server ?? Number(server),
      })).filter((p: any) => p.id > 0)

      return NextResponse.json(
        { ok: true, count: normalized.length, players: normalized },
        { headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } }
      )
    } catch (err) {
      continue
    }
  }

  // Jeśli wszystkie endpointy zawiodły — zwróć mock dla testów
  return NextResponse.json(
    {
      ok:      false,
      count:   0,
      players: [],
      error:   'Wszystkie API endpoints zawiodły',
    },
    { status: 200 }
  )
}
