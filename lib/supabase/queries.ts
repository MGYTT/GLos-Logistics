import { createClient }  from './server'
import type { RankingEntry, WeekStats, MemberRank } from '@/types'

// ─── Typy pomocnicze ───────────────────────────
type RankingRPCRow = {
  member_id:      string
  username:       string
  avatar_url:     string | null
  rank:           string | null
  total_distance: number | string | null
  total_income:   number | string | null
  job_count:      number | string | null
}

// ─── Mapowanie ─────────────────────────────────
function mapRankingRow(r: RankingRPCRow): RankingEntry {
  return {
    member_id:      r.member_id,
    username:       r.username       ?? 'Nieznany',
    avatar_url:     r.avatar_url     ?? null,
    rank:           (r.rank          ?? 'recruit') as MemberRank,
    total_distance: Number(r.total_distance ?? 0),
    total_income:   Number(r.total_income   ?? 0),
    job_count:      Number(r.job_count      ?? 0),
  }
}

export async function getMemberById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function getWeeklyRankings(
  period: 'week' | 'month' | 'all' = 'week'
): Promise<RankingEntry[]> {
  const supabase = await createClient()

  // ── Próba RPC ──────────────────────────────
  const { data, error } = await supabase
    .rpc('get_weekly_rankings', { p_period: period })

  if (!error && data && Array.isArray(data) && data.length > 0) {
    return (data as RankingRPCRow[]).map(mapRankingRow)
  }

  if (error) {
    console.error('[getWeeklyRankings] RPC error:', {
      message: error.message,
      code:    error.code,
      details: error.details,
      hint:    error.hint,
    })
  }

  // ── Fallback ────────────────────────────────
  console.warn('[getWeeklyRankings] Używam fallbacku')

  const periodFrom = period === 'week'
    ? new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString()
    : period === 'month'
    ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(0).toISOString()

  const { data: members, error: mErr } = await supabase
    .from('members')
    .select('id, username, avatar_url, rank')
    .eq('is_banned', false)

  if (mErr || !members) return []

  // Pobierz WSZYSTKIE ukończone joby — bez filtra completed_at jeśli 'all'
  let jobsQuery = supabase
    .from('jobs')
    .select('member_id, created_by, distance_km, income, pay, completed_at')
    .eq('status', 'completed')

  // Dla week/month filtruj po completed_at LUB created_at (bo completed_at może być null)
  if (period !== 'all') {
    jobsQuery = jobsQuery.or(
      `completed_at.gte.${periodFrom},and(completed_at.is.null,created_at.gte.${periodFrom})`
    )
  }

  const { data: jobs, error: jErr } = await jobsQuery

  if (jErr) {
    console.error('[getWeeklyRankings] Fallback jobs error:', jErr)
    return []
  }

  // Agreguj — uwzględnij ZARÓWNO member_id jak i created_by
  const statsMap = new Map<string, {
    total_distance: number
    total_income:   number
    job_count:      number
  }>()

  for (const job of jobs ?? []) {
    // Użyj member_id, jeśli brak — created_by
    const driverId = job.member_id ?? job.created_by
    if (!driverId) continue

    const prev = statsMap.get(driverId) ?? {
      total_distance: 0,
      total_income:   0,
      job_count:      0,
    }
    statsMap.set(driverId, {
      total_distance: prev.total_distance + Number(job.distance_km ?? 0),
      total_income:   prev.total_income   + Number(job.income ?? job.pay ?? 0),
      job_count:      prev.job_count      + 1,
    })
  }

  if (statsMap.size === 0) {
    console.warn('[getWeeklyRankings] Brak jobów po agregacji — sprawdź kolumnę member_id w tabeli jobs')
  }

  return members
    .filter(m => statsMap.has(m.id))
    .map(m => {
      const stats = statsMap.get(m.id)!
      return {
        member_id:      m.id,
        username:       m.username   ?? 'Nieznany',
        avatar_url:     m.avatar_url ?? null,
        rank:           (m.rank      ?? 'recruit') as MemberRank,
        total_distance: Math.round(stats.total_distance),
        total_income:   Math.round(stats.total_income),
        job_count:      stats.job_count,
      }
    })
    .sort((a, b) => b.total_distance - a.total_distance)
}

export async function getMemberWeekStats(
  memberId: string
): Promise<WeekStats | null> {
  const supabase = await createClient()

  const { data: rpcData, error } = await supabase
    .rpc('get_week_stats', { p_member_id: memberId })

  if (rpcData && !error) return rpcData

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('distance_km, pay, income, fuel_used')
    .or(`member_id.eq.${memberId},created_by.eq.${memberId}`)
    .eq('status', 'completed')
    .gte('completed_at', weekAgo)

  if (!jobs?.length) return { distance_km: 0, income: 0, job_count: 0, fuel_used: 0 }

  return {
    distance_km: jobs.reduce((s, j) => s + (j.distance_km ?? 0), 0),
    income:      jobs.reduce((s, j) => s + (j.pay ?? j.income ?? 0), 0),
    job_count:   jobs.length,
    fuel_used:   jobs.reduce((s, j) => s + (j.fuel_used ?? 0), 0),
  }
}

export async function getMemberJobs(memberId: string, limit = 50) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('jobs')
    .select('*')
    .or(`member_id.eq.${memberId},created_by.eq.${memberId}`)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(j => ({
    ...j,
    origin_city:      j.origin_city      ?? j.from_city ?? '—',
    destination_city: j.destination_city ?? j.to_city   ?? '—',
    income:           j.income           ?? j.pay       ?? 0,
    distance_km:      j.distance_km      ?? 0,
    damage_percent:   j.damage_percent   ?? 0,
    completed_at:     j.completed_at     ?? j.created_at,
  }))
}

export async function getAllMembers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('is_banned', false)
    .order('points', { ascending: false })
  return data ?? []
}

export async function getFleet() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fleet')
    .select('*, members(username, avatar_url)')
    .order('name')
  return data ?? []
}

export async function getUpcomingEvents() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*, event_rsvp(member_id)')
    .gte('end_at', new Date().toISOString())
    .order('start_at')
  return data ?? []
}
