import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { z }                         from 'zod'
import { sendJobDeliveredWebhook }   from '@/lib/discord/webhooks'

// ─── Admin client ─────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

// ─── Rate limit ───────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(memberId: string): boolean {
  const now    = Date.now()
  const window = 10_000
  const limit  = 20
  const entry  = rateLimitMap.get(memberId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(memberId, { count: 1, resetAt: now + window })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// ─── Schematy Zod ─────────────────────────────────────────
const PositionSchema = z.object({
  x:         z.number(),
  y:         z.number().default(0),
  z:         z.number(),
  speed:     z.number().transform(v => Math.round(Math.abs(v) * 10) / 10),
  game_time: z.string().max(64).nullable().optional(),
  online:    z.boolean().default(true),
})

const JobSchema = z.object({
  cargo:              z.string().max(120).nullable().optional(),
  origin_city:        z.string().max(80).nullable().optional(),
  destination_city:   z.string().max(80).nullable().optional(),
  distance_km:        z.number().min(0).max(20_000).nullable().optional(),
  income:             z.number().min(0).nullable().optional(),
  fuel_used:          z.number().min(0).nullable().optional(),
  damage_percent:     z.number().min(0).max(100).nullable().optional(),
  truckershub_job_id: z.string().max(64).nullable().optional(),
})

const TelemetryExtSchema = z.object({
  has_job:               z.boolean().optional(),
  from_city:             z.string().max(80).nullable().optional(),
  from_company:          z.string().max(120).nullable().optional(),
  to_city:               z.string().max(80).nullable().optional(),
  to_company:            z.string().max(120).nullable().optional(),
  cargo:                 z.string().max(120).nullable().optional(),
  cargo_weight_kg:       z.number().nullable().optional(),
  income:                z.number().nullable().optional(),
  job_max_distance:      z.number().nullable().optional(),
  distance_remaining_km: z.number().nullable().optional(),
  eta_minutes:           z.number().nullable().optional(),
  truck_brand:           z.string().max(80).nullable().optional(),
  truck_model:           z.string().max(80).nullable().optional(),
  fuel_liters:           z.number().nullable().optional(),
  fuel_capacity:         z.number().nullable().optional(),
  odometer:              z.number().nullable().optional(),
  rpm:                   z.number().nullable().optional(),
  gear:                  z.number().nullable().optional(),
}).optional()

const BridgePayloadSchema = z.object({
  api_key:       z.string().uuid('Nieprawidłowy format api_key'),
  position:      PositionSchema,
  active_job:    JobSchema.nullable().optional(),
  event:         z.enum(['job_started', 'job_delivered', 'job_cancelled', 'none']).default('none'),
  delivered_job: JobSchema.nullable().optional(),
  telemetry:     TelemetryExtSchema,
})

type BridgePayload = z.infer<typeof BridgePayloadSchema>

// ─── Helpers ──────────────────────────────────────────────
async function resolveMember(apiKey: string) {
  const { data, error } = await supabase
    .from('members')
    .select('id, username, avatar_url, is_banned, rank')
    .eq('api_key', apiKey)
    .single()
  if (error || !data) return null
  return data
}

async function upsertPosition(
  memberId: string,
  position: z.infer<typeof PositionSchema>,
) {
  return supabase
    .from('driver_positions')
    .upsert(
      {
        member_id:  memberId,
        x:          position.x,
        y:          position.y,
        z:          position.z,
        speed:      position.speed,
        game_time:  position.game_time ?? null,
        online:     position.online,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'member_id' },
    )
}

async function upsertTelemetry(
  memberId: string,
  position: z.infer<typeof PositionSchema>,
  tel:      z.infer<typeof TelemetryExtSchema>,
) {
  const now = new Date().toISOString()
  return supabase
    .from('member_telemetry')
    .upsert(
      {
        member_id:             memberId,
        online:                position.online,
        has_job:               tel?.has_job               ?? false,
        from_city:             tel?.from_city             ?? null,
        from_company:          tel?.from_company          ?? null,
        to_city:               tel?.to_city               ?? null,
        to_company:            tel?.to_company            ?? null,
        cargo:                 tel?.cargo                 ?? null,
        cargo_weight_kg:       tel?.cargo_weight_kg       ?? null,
        income:                tel?.income                ?? null,
        job_max_distance:      tel?.job_max_distance      ?? null,
        distance_remaining_km: tel?.distance_remaining_km ?? null,
        eta_minutes:           tel?.eta_minutes != null
          ? Math.round(tel.eta_minutes)
          : null,
        truck_brand:           tel?.truck_brand           ?? null,
        truck_model:           tel?.truck_model           ?? null,
        speed_kmh:             position.speed,
        fuel_liters:           tel?.fuel_liters           ?? null,
        fuel_capacity:         tel?.fuel_capacity         ?? null,
        odometer:              tel?.odometer              ?? null,
        rpm:                   tel?.rpm != null
          ? Math.round(tel.rpm)
          : null,
        gear:                  tel?.gear != null
          ? Math.round(tel.gear)
          : null,
        game_time:             position.game_time         ?? null,
        updated_at:            now,
      },
      { onConflict: 'member_id' },
    )
}

// ─── handleJobStarted ─────────────────────────────────────
// FIX: anuluj tylko joby starsze niż 30s — nie nadpisuje świeżo dostarczonego
async function handleJobStarted(memberId: string, job: z.infer<typeof JobSchema>) {
  const thirtySecAgo = new Date(Date.now() - 30_000).toISOString()

  await supabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('member_id', memberId)
    .eq('status', 'taken')
    .lt('created_at', thirtySecAgo)

  return supabase.from('jobs').insert({
    member_id:          memberId,
    cargo:              job.cargo              ?? null,
    origin_city:        job.origin_city        ?? null,
    destination_city:   job.destination_city   ?? null,
    distance_km:        job.distance_km        ?? null,
    income:             job.income             ?? null,
    fuel_used:          null,
    damage_percent:     0,
    truckershub_job_id: job.truckershub_job_id ?? null,
    status:             'taken',
    source:             'bridge',
    completed_at:       null,
    created_at:         new Date().toISOString(),
  })
}

// ─── handleJobDelivered ───────────────────────────────────
// FIX: szuka też jobów 'cancelled' (race condition) i nadpisuje na 'completed'
async function handleJobDelivered(memberId: string, job: z.infer<typeof JobSchema>) {
  const now = new Date().toISOString()

  const { data: fuelRow } = await supabase
    .from('fuel_prices').select('price')
    .lte('valid_from', now).gte('valid_until', now)
    .order('valid_from', { ascending: false }).limit(1).single()

  const fuelPrice = fuelRow?.price ?? 2.8

  const { calculateJobPay } = await import('@/lib/vtc/payCalculator')
  const pay = calculateJobPay({
    distance_km:      job.distance_km    ?? 0,
    cargo_units:      1,
    fuel_used_liters: job.fuel_used      ?? null,
    damage_percent:   job.damage_percent ?? 0,
    cargo_type:       null,
    had_fine:         false,
    fine_amount:      0,
    fuel_price:       fuelPrice,
  })

  // FIX: szukaj 'taken' LUB 'cancelled' z ostatnich 60s (race condition fix)
  const sixtySecAgo = new Date(Date.now() - 60_000).toISOString()

  const { data: activeJob } = await supabase
    .from('jobs')
    .select('id')
    .eq('member_id', memberId)
    .in('status', ['taken', 'cancelled'])
    .eq('source', 'bridge')
    .gte('created_at', sixtySecAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const jobData = {
    cargo:            job.cargo            ?? null,
    origin_city:      job.origin_city      ?? null,
    destination_city: job.destination_city ?? null,
    distance_km:      job.distance_km      ?? null,
    income:           pay.driver_share,
    fuel_used:        job.fuel_used        ?? null,
    damage_percent:   job.damage_percent   ?? null,
    status:           'completed',          // zawsze completed — nigdy cancelled
    completed_at:     now,
  }

  let finalJobId: string | undefined

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
    p_job_id:      finalJobId ?? null,
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
    p_description: `Podatek firmowy — Job ${finalJobId?.slice(0, 8) ?? '?'}`,
  })

  const bonusPoints = Math.floor((job.distance_km ?? 0) / 100)
  if (bonusPoints > 0) {
    await supabase.rpc('increment_member_points', {
      p_member_id: memberId, p_points: bonusPoints,
    })
  }

  return pay
}

// ─── handleJobCancelled ───────────────────────────────────
// FIX: anuluj tylko joby starsze niż 60s — chroni świeżo dostarczone
async function handleJobCancelled(memberId: string) {
  const sixtySecAgo = new Date(Date.now() - 60_000).toISOString()

  await supabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('member_id', memberId)
    .eq('status', 'taken')
    .lt('created_at', sixtySecAgo)
}

// ─── POST /api/bridge ─────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() }
  catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BridgePayloadSchema.safeParse(body)
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    console.error('[Bridge] Validation failed:', JSON.stringify(issues, null, 2))
    return NextResponse.json({ ok: false, error: 'Validation failed', issues }, { status: 422 })
  }

  const payload = parsed.data

  const member = await resolveMember(payload.api_key)
  if (!member) return NextResponse.json({ ok: false, error: 'Invalid api_key' }, { status: 401 })
  if (member.is_banned) return NextResponse.json({ ok: false, error: 'Account is banned' }, { status: 403 })
  if (!checkRateLimit(member.id)) return NextResponse.json(
    { ok: false, error: 'Rate limit exceeded. Max 20 req / 10s' }, { status: 429 }
  )

  // Upsert pozycji (mapa)
  const { error: posError } = await upsertPosition(member.id, payload.position)
  if (posError) {
    console.error('[Bridge] upsertPosition error:', posError)
    return NextResponse.json({ ok: false, error: 'DB error (position)' }, { status: 500 })
  }

  // Upsert telemetrii (dashboard)
  const { error: telError } = await upsertTelemetry(member.id, payload.position, payload.telemetry)
  if (telError) console.error('[Bridge] upsertTelemetry error:', telError.message, telError.details)

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
  }

  return NextResponse.json({
    ok:        true,
    member_id: member.id,
    username:  member.username,
    timestamp: new Date().toISOString(),
  })
}

// ─── GET /api/bridge (health check) ──────────────────────
export async function GET() {
  return NextResponse.json({
    ok: true, service: 'VTC Bridge API', version: '1.0.0', time: new Date().toISOString(),
  })
}
