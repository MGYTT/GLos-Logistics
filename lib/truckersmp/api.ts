export interface TruckyPlayer {
  mp_id:    number
  name:     string
  x:        number
  y:        number
  server:   number
  t:        number   // timestamp
}

export interface TruckyServer {
  id:        number
  name:      string
  shortname: string
  online:    boolean
  players:   number
  maxplayers: number
}

const BASE = 'https://api.truckyapp.com/v2'

export async function getPlayers(server = 1): Promise<TruckyPlayer[]> {
  try {
    const res = await fetch(
      `${BASE}/map/players?server=${server}`,
      {
        next: { revalidate: 5 },  // cache 5s
        headers: { 'Accept': 'application/json' },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data?.response ?? []
  } catch {
    return []
  }
}

export async function getServers(): Promise<TruckyServer[]> {
  try {
    const res = await fetch(`${BASE}/servers`, { next: { revalidate: 30 } })
    if (!res.ok) return []
    const data = await res.json()
    return data?.response ?? []
  } catch {
    return []
  }
}
