import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch('https://api.truckyapp.com/v2/servers', {
      headers: {
        'User-Agent': 'Mozilla/5.0 VTC-LiveMap/1.0',
        'Referer':    'https://truckyapp.com/',
      },
      next: { revalidate: 30 },
    })

    const data = await res.json()
    const servers = (data?.response ?? []).filter(
      (s: any) => s.online && s.game === 'ETS2'
    )

    return NextResponse.json(servers)
  } catch {
    // Hardcoded fallback — zawsze dostępny
    return NextResponse.json([
      { id: 1, name: 'ETS2 Simulation 1', shortname: 'EU 1', online: true, players: 0, maxplayers: 4000, game: 'ETS2' },
      { id: 2, name: 'ETS2 Simulation 2', shortname: 'EU 2', online: true, players: 0, maxplayers: 4000, game: 'ETS2' },
      { id: 3, name: 'ETS2 Arcade',       shortname: 'Arcade', online: true, players: 0, maxplayers: 4000, game: 'ETS2' },
    ])
  }
}
