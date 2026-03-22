import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { headers }                   from 'next/headers'
import crypto                        from 'crypto'
import { THJobWebhook }              from '@/lib/truckershub/types'
import { RANK_CONFIG }               from '@/lib/utils/rankUtils'
import { MemberRank }                from '@/types'

export async function POST(req: NextRequest) {
  const body        = await req.text()
  const headersList = await headers()
  const signature   = headersList.get('x-truckershub-signature') ?? ''
  const secret      = process.env.TRUCKERSHUB_SECRET

  if (secret) {
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
    if (signature !== `sha256=${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let job: THJobWebhook
  try {
    job = JSON.parse(body) as THJobWebhook
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!job.driver_uuid) {
    return NextResponse.json({ error: 'Missing driver_uuid' }, { status: 422 })
  }

  const supabase = await createClient()

  // ── Zapisz job ────────────────────────────
  await supabase.from('jobs').insert({
    member_id:          job.driver_uuid,
    cargo:              job.cargo,
    origin_city:        job.source_city,
    destination_city:   job.destination_city,
    distance_km:        job.distance,
    income:             job.income,
    fuel_used:          job.fuel_used,
    damage_percent:     job.cargo_damage,
    truckershub_job_id: job.id,
    status:             'completed',
    source:             'truckershub',
    completed_at:       job.completed_at ?? new Date().toISOString(),
  })

  // ── Punkty + awans rangi ──────────────────
  const pointsEarned = Math.floor(job.distance / 100)

  const { data: member } = await supabase
    .from('members')
    .select('points, rank, discord_id, username')
    .eq('id', job.driver_uuid)
    .single()

  if (member && pointsEarned > 0) {
    const newPoints = (member.points ?? 0) + pointsEarned

    const ranks = Object.entries(RANK_CONFIG) as [MemberRank, typeof RANK_CONFIG[MemberRank]][]
    const newRank = ranks
      .filter(([, cfg]) => newPoints >= cfg.minPoints)
      .sort(([, a], [, b]) => b.minPoints - a.minPoints)[0]?.[0] ?? 'Recruit'

    await supabase
      .from('members')
      .update({ points: newPoints, rank: newRank })
      .eq('id', job.driver_uuid)
  }

  return NextResponse.json({ received: true })
}
