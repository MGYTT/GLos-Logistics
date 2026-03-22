import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse }   from 'next/server'
import { calculateJobPay }             from '@/lib/vtc/payCalculator'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// ─── Typy ──────────────────────────────────────
interface PrevTelemetry {
  has_job:          boolean
  from_city:        string | null
  to_city:          string | null
  cargo:            string | null
  income:           number | null
  job_max_distance: number | null
  fuel_liters:      number | null   // ← dodane do fuel delta
}

// ─── Rate limit ────────────────────────────────
const rlMap = new Map<string, { n: number; t: number }>()
function rateLimit(id: string): boolean {
  const now = Date.now()
  const e   = rlMap.get(id)
  if (!e || now > e.t) { rlMap.set(id, { n: 1, t: now + 60_000 }); return true }
  if (e.n >= 30) return false
  e.n++
  return true
}

// ─── Fuel tracker (in-memory) ──────────────────
// Zapamiętuje poziom paliwa przy starcie joba
const jobFuelStart = new Map<string, number>()

// ─── POST ──────────────────────────────────────
export async function POST(req: NextRequest) {

  // Auth
  const apiKey = req.headers.get('x-api-key')?.trim()
  if (!apiKey)
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const { data: member } = await admin
    .from('members')
    .select('id, username, is_banned')
    .eq('api_key', apiKey)
    .maybeSingle()

  if (!member)
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  if (member.is_banned)
    return NextResponse.json({ error: 'Account banned' }, { status: 403 })

  if (!rateLimit(member.id))
    return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

  // Parse body
  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // Test ping
  if (body?._test)
    return NextResponse.json({ ok: true, member: member.username })

  const { game, truck, trailer, job, navigation } = body ?? {}

  // ── _forceJobComplete ──────────────────────────
  if (body?._forceJobComplete === true) {
    console.log(`[submit] 🏁 forceComplete od ${member.username}`)

    const fromCity = job?.sourceCity      || null
    const toCity   = job?.destinationCity || null

    if (!fromCity || !toCity) {
      console.log('[submit] forceComplete: brak trasy')
      return NextResponse.json({ error: 'Missing route' }, { status: 400 })
    }

    const { data: prev } = await admin
      .from('member_telemetry')
      .select('cargo, income, job_max_distance, fuel_liters')
      .eq('member_id', member.id)
      .maybeSingle()

    const income      = (job?.income ?? 0) > 0 ? job.income : (prev?.income ?? 0)
    const cargo       = job?.cargo || prev?.cargo || 'Nieznany ładunek'
    const distanceKm  = Math.max(
      job?.totalDistance    ?? 0,
      prev?.job_max_distance ?? 0,
    )

    // Oblicz spalone paliwo (fuel przy starcie − fuel teraz)
    const fuelNow   = (truck?.fuel ?? 0) > 0 ? truck.fuel : null
    const fuelStart = jobFuelStart.get(member.id) ?? null
    const fuelUsed  = (fuelStart != null && fuelNow != null && fuelStart > fuelNow)
      ? Math.round(fuelStart - fuelNow)
      : null

    // Zapisz job
    const saved = await saveJob(member.id, {
      from_city:        fromCity,
      to_city:          toCity,
      cargo,
      income,
      job_max_distance: distanceKm,
      has_job:          true,
      fuel_liters:      null,
    }, distanceKm, fuelUsed)

    // Wyczyść fuel tracker
    jobFuelStart.delete(member.id)

    // Wyczyść telemetrię
    await admin.from('member_telemetry').update({
      has_job:               false,
      distance_remaining_km: null,
      eta_minutes:           null,
      updated_at:            new Date().toISOString(),
    }).eq('member_id', member.id)

    return NextResponse.json({
      ok: true, jobCompleted: saved, jobSaved: saved,
      route: `${fromCity} → ${toCity}`,
    })
  }

  // ── Normalny tick ──────────────────────────────
  if (!game || !truck)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const trailerAttached = trailer?.attached === true
  const hasJobData      = !!(
    job?.sourceCity      && job.sourceCity      !== '' &&
    job?.destinationCity && job.destinationCity !== ''
  )
  const hasJob = trailerAttached || hasJobData

  const speedKmh    = Math.max(0, Math.round(truck?.speed          ?? 0))
  const distRemKm   = Math.max(0,            navigation?.estimatedDistance ?? 0)
  const totalDistKm = Math.max(0,            job?.totalDistance            ?? 0)
  const etaMin      = (navigation?.estimatedTime ?? null) != null
    ? Math.max(0, navigation.estimatedTime) : null

  // Poprzedni stan
  const { data: prev } = await admin
    .from('member_telemetry')
    .select('has_job, from_city, to_city, cargo, income, job_max_distance, fuel_liters')
    .eq('member_id', member.id)
    .maybeSingle() as { data: PrevTelemetry | null }

  const isNewJob = hasJob && (
    !prev?.has_job ||
    prev?.from_city !== (job?.sourceCity      ?? '') ||
    prev?.to_city   !== (job?.destinationCity ?? '')
  )

  // Zapamiętaj paliwo przy starcie nowego joba
  if (isNewJob && (truck?.fuel ?? 0) > 0) {
    jobFuelStart.set(member.id, truck.fuel)
  }

  // Jeśli job zniknął — wyczyść fuel tracker
  if (!hasJob && prev?.has_job) {
    jobFuelStart.delete(member.id)
  }

  const prevMaxDist    = prev?.job_max_distance ?? 0
  const jobMaxDistance = isNewJob
    ? Math.max(totalDistKm, distRemKm)
    : Math.max(prevMaxDist, totalDistKm, distRemKm)

  // Upsert telemetrii
  const { error: upsertErr } = await admin
    .from('member_telemetry')
    .upsert({
      member_id:             member.id,
      has_job:               hasJob,
      from_city:             job?.sourceCity          || null,
      from_company:          job?.sourceCompany       || null,
      to_city:               job?.destinationCity     || null,
      to_company:            job?.destinationCompany  || null,
      cargo:                 job?.cargo || trailer?.name || null,
      cargo_weight_kg:       (trailer?.mass ?? 0) > 0 ? trailer.mass : null,
      income:                (job?.income   ?? 0) > 0 ? job.income : (prev?.income ?? null),
      job_max_distance:      jobMaxDistance || null,
      distance_remaining_km: distRemKm || null,
      eta_minutes:           etaMin,
      truck_brand:           truck?.make         || null,
      truck_model:           truck?.model        || null,
      speed_kmh:             speedKmh            || null,
      fuel_liters:           (truck?.fuel        ?? 0) > 0 ? truck.fuel        : null,
      fuel_capacity:         truck?.fuelCapacity          || null,
      odometer:              truck?.odometer              || null,
      rpm:                   truck?.rpm                   || null,
      gear:                  truck?.gear          ?? null,
      game_x:                truck?.worldX        ?? null,
      game_y:                truck?.worldY        ?? null,
      game_z:                truck?.worldZ        ?? null,
      game_time:             game?.time           || null,
      updated_at:            new Date().toISOString(),
    }, { onConflict: 'member_id' })

  if (upsertErr)
    console.error('[telemetry upsert]', upsertErr.message)

  return NextResponse.json({
    ok: true, hasJob, isNewJob,
    jobCompleted: false,
    route: hasJob
      ? `${job?.sourceCity} → ${job?.destinationCity}`
      : null,
  })
}

// ─── saveJob ───────────────────────────────────
async function saveJob(
  memberId:   string,
  prev:       PrevTelemetry,
  distanceKm: number,
  fuelUsed:   number | null = null,
): Promise<boolean> {
  console.log('═══ saveJob START ═══')
  console.log('member:',  memberId)
  console.log('route:',   `${prev.from_city} → ${prev.to_city}`)
  console.log('dist:',    distanceKm, '| income:', prev.income, '| fuel:', fuelUsed)

  try {
    const finalDist = Math.max(distanceKm, prev.job_max_distance ?? 0)

    if (finalDist < 5) {
      console.log('❌ Dystans < 5km — pomijam')
      return false
    }

    // Duplikat check
    const threeMinAgo = new Date(Date.now() - 3 * 60_000).toISOString()
    const { data: dup } = await admin
      .from('jobs')
      .select('id')
      .eq('member_id',        memberId)
      .eq('origin_city',      prev.from_city!)
      .eq('destination_city', prev.to_city!)
      .eq('source',           'bridge')
      .gte('completed_at',    threeMinAgo)
      .maybeSingle()

    if (dup) {
      console.log('❌ Duplikat — pomijam')
      return false
    }

    // ── VTC€ kalkulator ──────────────────────────
    const { data: fuelRow } = await admin
      .from('fuel_prices')
      .select('price')
      .lte('valid_from',  new Date().toISOString())
      .gte('valid_until', new Date().toISOString())
      .order('valid_from', { ascending: false })
      .limit(1)
      .maybeSingle()

    const fuelPrice = (fuelRow?.price as number) ?? 2.8

    const pay = calculateJobPay({
      distance_km:      finalDist,
      cargo_units:      1,
      fuel_used_liters: fuelUsed,
      damage_percent:   0,
      cargo_type:       null,
      had_fine:         false,
      fine_amount:      0,
      fuel_price:       fuelPrice,
    })

    // ── Punkty ───────────────────────────────────
    const gameIncome = prev.income ?? 0
    const points     = Math.max(1,
      Math.floor(finalDist / 50) + Math.floor(gameIncome / 5_000)
    )

    const now = new Date().toISOString()

    const insertPayload = {
      member_id:        memberId,
      created_by:       memberId,
      title:            `${prev.from_city} → ${prev.to_city}`,
      from_city:        prev.from_city,
      to_city:          prev.to_city,
      origin_city:      prev.from_city,
      destination_city: prev.to_city,
      cargo:            prev.cargo ?? 'Nieznany ładunek',
      cargo_weight:     0,
      trailer_type:     'unknown',
      distance_km:      finalDist,
      pay:              pay.driver_share,   // VTC€ — to co widzi kierowca
      income:           pay.driver_share,   // ← VTC€ (nie $ETS2)
      damage_percent:   0,
      fuel_used:        fuelUsed ?? 0,
      status:           'completed',
      source:           'bridge',
      completed_at:     now,
      created_at:       now,
    }

    console.log('INSERT:', JSON.stringify(insertPayload))

    const { data: inserted, error } = await admin
      .from('jobs')
      .insert(insertPayload)
      .select('id')
      .single()

    if (error) {
      console.error('❌ INSERT error:', error.message, '|', error.details, '|', error.hint)
      return false
    }

    console.log('✅ INSERT OK, id:', inserted?.id)

    // ── Portfel kierowcy (85%) ───────────────────
    const { error: walletErr } = await admin.rpc('credit_wallet', {
      p_member_id:   memberId,
      p_amount:      pay.driver_share,
      p_type:        'job_pay',
      p_job_id:      inserted.id,
      p_description: `${prev.from_city} → ${prev.to_city}`,
      p_metadata: {
        gross:        pay.gross,
        breakdown:    pay.breakdown,
        distance_km:  finalDist,
        fuel_used:    fuelUsed,
        game_income:  gameIncome,   // $ETS2 dla porównania
      },
    })
    if (walletErr) console.error('❌ credit_wallet:', walletErr.message)

    // ── Portfel firmowy (15%) ────────────────────
    const { error: compErr } = await admin.rpc('credit_company', {
      p_amount:      pay.company_share,
      p_type:        'company_tax',
      p_member_id:   memberId,
      p_description: `Podatek — ${prev.from_city} → ${prev.to_city}`,
    })
    if (compErr) console.error('❌ credit_company:', compErr.message)

    // ── Punkty rankingowe ────────────────────────
    const { error: rpcErr } = await admin.rpc('increment_member_points', {
      p_member_id: memberId,
      p_points:    points,
    })
    if (rpcErr) console.error('❌ increment_points:', rpcErr.message)

    console.log(`═══ saveJob END: VTC€ ${pay.driver_share} kierowca / ${pay.company_share} firma | +${points}pkt ═══`)
    return true

  } catch (e: any) {
    console.error('❌ saveJob exception:', e?.message ?? e)
    return false
  }
}
