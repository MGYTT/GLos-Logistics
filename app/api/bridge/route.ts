import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { sendJobDeliveredWebhook } from '@/lib/discord/webhooks'

// ─── Admin client (service role) ───────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// ─── Rate limit ────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(memberId: string): boolean {
  const now    = Date.now()
  const window = 10_000
  const limit  = 20

  const entry = rateLimitMap.get(memberId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(memberId, { count: 1, resetAt: now + window })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// ─── Schematy Zod ──────────────────────────────
const PositionSchema = z.object({
  x:         z.number(),
  y:         z.number().default(0),
  z:         z.number(),
  speed:     z.number().min(0).max(300),
  game_time: z.string().max(8).optional(),
  online:    z.boolean().default(true),
})

const JobSchema = z.object({
  cargo:              z.string().max(120).optional(),
  origin_city:        z.string().max(80).optional(),
  destination_city:   z.string().max(80).optional(),
  distance_km:        z.number().min(0).max(20000).optional(),
  income:             z.number().min(0).optional(),
  fuel_used:          z.number().min(0).optional(),
  damage_percent:     z.number().min(0).max(100).optional(),
  truckershub_job_id: z.string().max(64).optional().nullable(),
})

const BridgePayloadSchema = z.object({
  api_key:       z.string().uuid('Nieprawidłowy format api_key'),
  position:      PositionSchema,
  active_job:    JobSchema.nullable().optional(),
  event:         z.enum(['job_started', 'job_delivered', 'job_cancelled', 'none']).default('none'),
  delivered_job: JobSchema.optional(),
})

type BridgePayload = z.infer<typeof BridgePayloadSchema>

// ─── Helpers ───────────────────────────────────
async function resolveMember(apiKey: string) {
  const { data, error } = await supabase
    .from('members')
    .select('id, username, avatar_url, is_banned, rank')  // ← dodano avatar_url
    .eq('api_key', apiKey)
    .single()

  if (error || !data) return null
  return data
}

async function upsertPosition(
  memberId: string,
  position: z.infer<typeof PositionSchema>
) {
  return supabase
    .from('driver_positions')
    .upsert(
      {
        member_id:  memberId,
        x:          position.x,
        y:          position.y,
        z:          position.z,
        speed:      Math.round(position.speed * 10) / 10,
        game_time:  position.game_time ?? null,
        online:     position.online,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'member_id' }
    )
}

async function handleJobStarted(
  memberId: string,
  job: z.infer<typeof JobSchema>
) {
  await supabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('member_id', memberId)
    .eq('status', 'taken')

  return supabase
    .from('jobs')
    .insert({
      member_id:          memberId,
      cargo:              job.cargo            ?? null,
      origin_city:        job.origin_city      ?? null,
      destination_city:   job.destination_city ?? null,
      distance_km:        job.distance_km      ?? null,
      income:             job.income           ?? null,
      fuel_used:          null,
      damage_percent:     0,
      truckershub_job_id: job.truckershub_job_id ?? null,
      status:             'taken',
      source:             'bridge',
      completed_at:       null,
      created_at:         new Date().toISOString(),
    })
}

// ─── handleJobDelivered zwraca pay ─────────────
async function handleJobDelivered(
  memberId: string,
  job: z.infer<typeof JobSchema>
) {
  const now = new Date().toISOString()

  const { data: fuelRow } = await supabase
    .from('fuel_prices')
    .select('price')
    .lte('valid_from', now)
    .gte('valid_until', now)
    .order('valid_from', { ascending: false })
    .limit(1)
    .single()

  const fuelPrice = fuelRow?.price ?? 2.8

  const { calculateJobPay } = await import('@/lib/vtc/payCalculator')
  const pay = calculateJobPay({
    distance_km:      job.distance_km      ?? 0,
    cargo_units:      1,
    fuel_used_liters: job.fuel_used        ?? null,
    damage_percent:   job.damage_percent   ?? 0,
    cargo_type:       null,
    had_fine:         false,
    fine_amount:      0,
    fuel_price:       fuelPrice,
  })

  const { data: activeJob } = await supabase
    .from('jobs')
    .select('id')
    .eq('member_id', memberId)
    .eq('status', 'taken')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const jobData = {
    cargo:            job.cargo            ?? undefined,
    origin_city:      job.origin_city      ?? undefined,
    destination_city: job.destination_city ?? undefined,
    distance_km:      job.distance_km      ?? undefined,
    income:           pay.driver_share,
    fuel_used:        job.fuel_used        ?? undefined,
    damage_percent:   job.damage_percent   ?? undefined,
    status:           'completed',
    completed_at:     now,
  }

  let finalJobId: string

  if (activeJob) {
    await supabase.from('jobs').update(jobData).eq('id', activeJob.id)
    finalJobId = activeJob.id
  } else {
    const { data: inserted } = await supabase
      .from('jobs')
      .insert({ member_id: memberId, source: 'bridge', created_at: now, ...jobData })
      .select('id').single()
    finalJobId = inserted?.id
  }

  await supabase.rpc('credit_wallet', {
    p_member_id:   memberId,
    p_amount:      pay.driver_share,
    p_type:        'job_pay',
    p_job_id:      finalJobId,
    p_description: `Job ${job.origin_city ?? '?'} → ${job.destination_city ?? '?'}`,
    p_metadata: {
      gross:          pay.gross,
      breakdown:      pay.breakdown,
      distance_km:    job.distance_km,
      damage_percent: job.damage_percent,
    },
  })

  await supabase.rpc('credit_company', {
    p_amount:      pay.company_share,
    p_type:        'company_tax',
    p_member_id:   memberId,
    p_description: `Podatek firmowy — Job ${finalJobId?.slice(0, 8)}`,
  })

  const bonusPoints = Math.floor((job.distance_km ?? 0) / 100)
  if (bonusPoints > 0) {
    await supabase.rpc('increment_member_points', {
      p_member_id: memberId,
      p_points:    bonusPoints,
    })
  }

  // ← zwracamy pay żeby użyć w POST handler
  return pay
}

async function handleJobCancelled(memberId: string) {
  await supabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('member_id', memberId)
    .eq('status', 'taken')
}

// ─── POST /api/bridge ──────────────────────────
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BridgePayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok:     false,
        error:  'Validation failed',
        issues: parsed.error.issues.map(i => ({
          path:    i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 422 }
    )
  }

  const payload = parsed.data

  const member = await resolveMember(payload.api_key)
  if (!member) {
    return NextResponse.json({ ok: false, error: 'Invalid api_key' }, { status: 401 })
  }

  if (member.is_banned) {
    return NextResponse.json({ ok: false, error: 'Account is banned' }, { status: 403 })
  }

  if (!checkRateLimit(member.id)) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded. Max 20 req / 10s' },
      { status: 429 }
    )
  }

  const { error: posError } = await upsertPosition(member.id, payload.position)
  if (posError) {
    console.error('[Bridge] upsertPosition error:', posError)
    return NextResponse.json({ ok: false, error: 'DB error (position)' }, { status: 500 })
  }

  switch (payload.event) {
    case 'job_started':
      if (payload.active_job) {
        const { error } = await handleJobStarted(member.id, payload.active_job)
        if (error) console.error('[Bridge] handleJobStarted error:', error)
      }
      break

    case 'job_delivered':
      if (payload.delivered_job) {
        const pay = await handleJobDelivered(member.id, payload.delivered_job)

        // ── Discord webhook ─────────────────────
        await sendJobDeliveredWebhook({
          username:         member.username,
          avatar_url:       member.avatar_url ?? null,
          rank:             member.rank,
          origin_city:      payload.delivered_job.origin_city      ?? '—',
          destination_city: payload.delivered_job.destination_city ?? '—',
          distance_km:      payload.delivered_job.distance_km      ?? 0,
          income:           pay.driver_share,
          damage_percent:   payload.delivered_job.damage_percent   ?? 0,
          cargo:            payload.delivered_job.cargo            ?? null,
        })
      }
      break

    case 'job_cancelled':
      await handleJobCancelled(member.id)
      break

    case 'none':
    default:
      break
  }

  return NextResponse.json({
    ok:        true,
    member_id: member.id,
    username:  member.username,
    timestamp: new Date().toISOString(),
  })
}

// ─── GET /api/bridge (health check) ────────────
export async function GET() {
  return NextResponse.json({
    ok:      true,
    service: 'VTC Bridge API',
    version: '1.0.0',
    time:    new Date().toISOString(),
  })
}
