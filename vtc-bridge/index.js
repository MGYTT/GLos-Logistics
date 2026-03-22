/**
 * VTC Bridge — synchronizacja ETS2/ATS z panelem VTC
 *
 * Wymagania:
 *   npm install node-fetch@2 scs-telemetry-data
 *
 * Uruchomienie:
 *   VTC_API_KEY=twój-klucz-uuid node index.js
 */

const fetch      = require('node-fetch')
const Telemetry  = require('scs-telemetry-data')

// ─── Konfiguracja ──────────────────────────────
const CONFIG = {
  apiKey:   process.env.VTC_API_KEY || 'WKLEJ_SWÓJ_KLUCZ_API',
  endpoint: process.env.VTC_ENDPOINT || 'https://twoja-domena.vercel.app/api/bridge',
  interval: 4000,  // ms — co ile wysyłać pozycję
  debug:    process.env.DEBUG === 'true',
}

if (!CONFIG.apiKey || CONFIG.apiKey === 'WKLEJ_SWÓJ_KLUCZ_API') {
  console.error('❌ Brak VTC_API_KEY! Ustaw zmienną środowiskową lub wklej klucz.')
  process.exit(1)
}

// ─── Stan ──────────────────────────────────────
let lastJobId     = null
let lastJobStatus = null  // 'none' | 'active' | 'delivered'
let errCount      = 0

// ─── Formatowanie czasu gry ────────────────────
function formatGameTime(minutes) {
  if (!minutes && minutes !== 0) return null
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ─── Główna pętla ──────────────────────────────
async function tick() {
  let telemetry

  try {
    telemetry = Telemetry.getData()
  } catch (e) {
    if (CONFIG.debug) console.warn('[Bridge] Brak danych telemetrycznych (gra wyłączona?)')
    // Wyślij offline jeśli gra nie działa
    await sendOffline()
    return
  }

  const truck = telemetry.truck   || {}
  const job   = telemetry.job     || {}
  const game  = telemetry.game    || {}

  // Przelicz prędkość m/s → km/h
  const speedKmh = Math.abs((truck.speed ?? 0) * 3.6)

  const position = {
    x:         truck.position?.x    ?? 0,
    y:         truck.position?.y    ?? 0,
    z:         truck.position?.z    ?? 0,
    speed:     Math.round(speedKmh * 10) / 10,
    game_time: formatGameTime(game.time),
    online:    true,
  }

  // ── Wykrywanie eventów jobów ─────────────────
  let event        = 'none'
  let active_job   = null
  let delivered_job= null

  const currentJobId     = job.id      || null
  const currentJobStatus = job.status  || 'none'

  // Job started
  if (currentJobId && currentJobId !== lastJobId) {
    event      = 'job_started'
    active_job = buildJobPayload(job)
    console.log(`🚛 Job rozpoczęty: ${job.origin} → ${job.destination}`)
  }

  // Job delivered
  if (lastJobStatus === 'active' && currentJobStatus === 'delivered') {
    event         = 'job_delivered'
    delivered_job = buildJobPayload(job)
    console.log(`✅ Job dostarczony! Zarobki: €${job.income ?? 0}`)
  }

  // Job cancelled
  if (lastJobId && !currentJobId && lastJobStatus === 'active') {
    event = 'job_cancelled'
    console.log('❌ Job anulowany')
  }

  // Aktualizuj stan
  lastJobId     = currentJobId
  lastJobStatus = currentJobId ? 'active' : (currentJobStatus === 'delivered' ? 'delivered' : 'none')

  // ── Wyślij do API ────────────────────────────
  await sendToBridge({
    api_key:       CONFIG.apiKey,
    position,
    event,
    active_job:    active_job   ?? (currentJobId ? buildJobPayload(job) : null),
    delivered_job: delivered_job ?? undefined,
  })
}

function buildJobPayload(job) {
  return {
    cargo:              job.cargo?.name       ?? job.cargo       ?? null,
    origin_city:        job.source?.city      ?? job.origin      ?? null,
    destination_city:   job.destination?.city ?? job.destination ?? null,
    distance_km:        job.plannedDistance   ?? job.distance    ?? null,
    income:             job.income            ?? null,
    fuel_used:          null,  // dostępne po dostarczeniu
    damage_percent:     (job.cargo?.damage ?? 0) * 100,
    truckershub_job_id: job.truckersmpId      ?? null,
  }
}

async function sendToBridge(payload) {
  try {
    const res = await fetch(CONFIG.endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error(`[Bridge] HTTP ${res.status}:`, err.error ?? 'Unknown error')
      errCount++
    } else {
      if (CONFIG.debug) {
        const data = await res.json()
        console.log(`[Bridge] ✓ ${data.username} @ ${payload.position.speed} km/h`)
      }
      errCount = 0
    }
  } catch (e) {
    errCount++
    if (errCount <= 3 || CONFIG.debug) {
      console.error('[Bridge] Błąd połączenia:', e.message)
    }
    if (errCount === 5) {
      console.warn('[Bridge] ⚠️  5 błędów z rzędu — sprawdź połączenie z internetem')
    }
  }
}

async function sendOffline() {
  // Oznacz kierowcę jako offline gdy gra nie działa
  await sendToBridge({
    api_key:  CONFIG.apiKey,
    position: { x: 0, y: 0, z: 0, speed: 0, online: false },
    event:    'none',
  }).catch(() => {})
}

// ─── Start ─────────────────────────────────────
console.log('🚚 VTC Bridge uruchomiony')
console.log(`📡 Endpoint: ${CONFIG.endpoint}`)
console.log(`⏱️  Interval: ${CONFIG.interval}ms`)
console.log('─'.repeat(40))

tick() // pierwsze wywołanie od razu
setInterval(tick, CONFIG.interval)

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Bridge] Zamykanie — oznaczam jako offline...')
  await sendOffline()
  process.exit(0)
})
