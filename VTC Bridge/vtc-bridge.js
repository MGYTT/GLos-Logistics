'use strict'

const fs       = require('fs')
const path     = require('path')
const http     = require('http')
const https    = require('https')
const readline = require('readline')

// ─── Stałe ────────────────────────────────────────────────
const CONFIG_PATH    = path.join(__dirname, 'vtc-config.json')
const FUNBIT_URL     = 'http://localhost:25555/api/ets2/telemetry'
const SEND_INTERVAL  = 5_000
const FUNBIT_TIMEOUT = 4_000
const SERVER_TIMEOUT = 8_000

// ─── Kolory ───────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  amber:  '\x1b[33m',
}

const ts   = () => new Date().toLocaleTimeString('pl-PL')
const info = m  => console.log(`${C.dim}[${ts()}]${C.reset} ${C.cyan} INFO ${C.reset} ${m}`)
const ok   = m  => console.log(`${C.dim}[${ts()}]${C.reset} ${C.green}  OK  ${C.reset} ${m}`)
const warn = m  => console.log(`${C.dim}[${ts()}]${C.reset} ${C.yellow} WARN ${C.reset} ${m}`)
const err  = m  => console.log(`${C.dim}[${ts()}]${C.reset} ${C.red}  ERR ${C.reset} ${m}`)

// ─── Config ───────────────────────────────────────────────
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    if (!cfg.api_key || !cfg.server_url) return null
    return cfg
  } catch {
    return null
  }
}

// ─── HTTP ─────────────────────────────────────────────────
function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const parsed  = new URL(url)
    const lib     = parsed.protocol === 'https:' ? https : http

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path:     parsed.pathname,
        method:   'POST',
        headers:  {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: SERVER_TIMEOUT,
      },
      res => {
        let d = ''
        res.on('data', c => (d += c))
        res.on('end',  () => {
          try   { resolve({ status: res.statusCode, body: JSON.parse(d) }) }
          catch { resolve({ status: res.statusCode, body: d            }) }
        })
      },
    )

    req.on('error',   e  => reject(e))
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(payload)
    req.end()
  })
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, { timeout: FUNBIT_TIMEOUT }, res => {
      let d = ''
      res.on('data', c => (d += c))
      res.on('end',  () => {
        try   { resolve({ status: res.statusCode, body: JSON.parse(d) }) }
        catch { resolve({ status: res.statusCode, body: d            }) }
      })
    })
    req.on('error',   e  => reject(e))
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

// ─── Mapowanie Funbit → payload ───────────────────────────
function buildPayload(config, rawTelemetry, event, lastJobKey) {
  const { game, truck, job, trailer, navigation } = rawTelemetry ?? {}

  const placement  = truck?.placement ?? {}
  const speedKmh   = Math.round(Math.abs(truck?.speed ?? 0) * 3.6 * 10) / 10
  const gameTime   = game?.time ?? null
  const hasJob     = !!(job?.sourceCity && job?.destinationCity)
  const jobKey     = hasJob ? `${job.sourceCity}→${job.destinationCity}` : null
  const cargo      = trailer?.name ?? trailer?.id ?? null

  const distanceKm = navigation?.estimatedDistance
    ? Math.round(navigation.estimatedDistance / 100) / 10
    : null

  const etaMinutes = navigation?.estimatedTime
    ? Math.round(navigation.estimatedTime / 60)
    : null

  const jobMaxDistance = job?.plannedDistance
    ? Math.round(job.plannedDistance / 100) / 10
    : distanceKm

  const income = job?.income ?? null

  const wearValues = [
    truck?.wearEngine, truck?.wearTransmission,
    truck?.wearCabin,  truck?.wearChassis, truck?.wearWheels,
  ].filter(v => v != null)

  const damagePercent = wearValues.length > 0
    ? Math.round(wearValues.reduce((s, v) => s + v, 0) / wearValues.length * 100)
    : 0

  const fuelUsed = (truck?.fuelCapacity && truck?.fuel != null)
    ? Math.max(0, Math.round(truck.fuelCapacity - truck.fuel))
    : null

  // ── Telemetria dla dashboardu ────────────────────────────
  const telemetryData = {
    has_job:               hasJob,
    from_city:             job?.sourceCity         ?? null,
    from_company:          job?.sourceCompany      ?? null,
    to_city:               job?.destinationCity    ?? null,
    to_company:            job?.destinationCompany ?? null,
    cargo,
    cargo_weight_kg:       trailer?.mass           ?? null,
    income,
    job_max_distance:      jobMaxDistance,
    distance_remaining_km: distanceKm,
    eta_minutes:           etaMinutes,
    truck_brand:           truck?.make             ?? null,
    truck_model:           truck?.model            ?? null,
    fuel_liters:           truck?.fuel             ?? null,
    fuel_capacity:         truck?.fuelCapacity     ?? null,
    odometer:              truck?.odometer
      ? Math.round(truck.odometer / 1000)
      : null,
    rpm:  truck?.engineRpm ?? null,
    gear: truck?.gear      ?? null,
  }

  return {
    jobKey,
    hasJob,
    result: {                          // ← zmieniono z 'payload' na 'result'
      api_key: config.api_key,

      position: {
        x:         placement.x ?? 0,
        y:         placement.y ?? 0,
        z:         placement.z ?? 0,
        speed:     speedKmh,
        game_time: gameTime,
        online:    true,
      },

      active_job: hasJob ? {
        cargo,
        origin_city:      job.sourceCity      ?? null,
        destination_city: job.destinationCity ?? null,
        distance_km:      distanceKm,
        income,
        fuel_used:        null,
        damage_percent:   damagePercent,
      } : null,

      event,

      delivered_job: event === 'job_delivered' ? {
        origin_city:      lastJobKey?.split('→')[0] ?? job?.sourceCity      ?? null,
        destination_city: lastJobKey?.split('→')[1] ?? job?.destinationCity ?? null,
        cargo,
        distance_km:      distanceKm,
        income,
        fuel_used:        fuelUsed,
        damage_percent:   damagePercent,
      } : undefined,

      telemetry: telemetryData,
    },
  }
}

// ─── Wyślij offline ───────────────────────────────────────
async function sendOffline(config) {
  try {
    await httpPost(`${config.server_url}/api/bridge`, {
      api_key:  config.api_key,
      position: { x: 0, y: 0, z: 0, speed: 0, game_time: null, online: false },
      active_job:    null,
      event:         'none',
      delivered_job: undefined,
      // ← DODAJ to — bez tego upsertTelemetry nie wykona się
      telemetry: {
        has_job:    false,
        from_city:  null, to_city:      null,
        from_company: null, to_company: null,
        cargo:      null,  speed_kmh:   0,
      },
    })
  } catch { /* ignoruj */ }
}

// ─── Bridge loop ──────────────────────────────────────────
async function startBridge(config) {
  console.clear()
  console.log(`
${C.bold}${C.amber}  ╔══════════════════════════════════════════╗
  ║         VTC Bridge v6.0 — AKTYWNY        ║
  ╚══════════════════════════════════════════╝${C.reset}

  ${C.dim}Konto:${C.reset}   ${C.bold}${config.username}${C.reset} [${config.rank ?? '—'}]
  ${C.dim}Serwer:${C.reset}  ${C.dim}${config.server_url}${C.reset}

  ${C.dim}CTRL+C — zatrzymaj${C.reset}
  ${C.dim}Wpisz "reset" + Enter — zmień konto${C.reset}
`)

  // ── Stdin — KLUCZOWE: resume() żeby Node nie zamknął się ─
  // BAT przekazuje stdin który może być w stanie paused/closed
  // bez resume() proces kończy się natychmiast po starcie
  try {
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
  } catch { /* w niektórych środowiskach stdin może być null */ }

  // ── readline do obsługi komendy "reset" ───────────────────
  let rl = null
  try {
    rl = readline.createInterface({
      input:    process.stdin,
      output:   process.stdout,
      terminal: false,
    })

    rl.on('line', line => {
      if (line.trim().toLowerCase() !== 'reset') return
      console.log()
      warn('Resetuję konfigurację...')
      try { fs.unlinkSync(CONFIG_PATH) } catch {}
      console.log()
      ok('Plik vtc-config.json usunięty.')
      warn('Zamknij to okno i uruchom START_VTC.bat ponownie.')
      console.log()
      clearInterval(tickInterval)
      if (rl) rl.close()
      setTimeout(() => process.exit(0), 3_000)
    })

    // KLUCZOWE: gdy readline zamknie stdin (EOF z BAT) — NIE wychodź
    rl.on('close', () => {
      // stdin zamknięty (np. BAT nie ma TTY) — kontynuuj bridge normalnie
      // tylko loguj w trybie debug
    })
  } catch (e) {
    warn(`Readline niedostępny: ${e.message} — bridge działa bez komendy reset`)
  }

  // ── Stan ─────────────────────────────────────────────────
  let lastJobKey      = null
  let failCount       = 0
  let funbitOk        = false
  let consecutiveFail = 0
  let tickInterval    = null

  // ── Tick ─────────────────────────────────────────────────
async function tick() {

  // 1. Funbit
  let rawTelemetry
  try {
    const res = await httpGet(FUNBIT_URL)
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
    rawTelemetry = res.body

    if (!funbitOk || consecutiveFail > 0) {
      console.log()
      ok('Połączono z Funbit!')
      funbitOk        = true
      failCount       = 0
      consecutiveFail = 0
    }
  } catch (e) {
    failCount++
    consecutiveFail++
    if (consecutiveFail === 1 || consecutiveFail % 12 === 0) {
      console.log()
      warn(`Funbit niedostępny — czekam na grę... (${e.message})`)
    }
    if (consecutiveFail === 3) {
      process.stdout.write(
        `\r  ${C.dim}[${ts()}] 🔴  Gra zamknięta lub w menu${C.reset}   `,
      )
      await sendOffline(config)
    }
    return
  }

  // 2. Sprawdź czy plugin połączony
  const { game, truck, job } = rawTelemetry ?? {}

  if (!game?.connected) {
    consecutiveFail = 0
    process.stdout.write(
      `\r  ${C.dim}[${ts()}] ⏳  Oczekuję na załadowanie mapy...${C.reset}   `,
    )
    await sendOffline(config)
    return
  }

  consecutiveFail = 0
  if (!truck) return

  // 3. Zdarzenia joba
  const hasJob = !!(job?.sourceCity && job?.destinationCity)
  const jobKey = hasJob ? `${job.sourceCity}→${job.destinationCity}` : null

  let event = 'none'
  if      (hasJob && jobKey !== lastJobKey && lastJobKey !== null) event = 'job_delivered'
  else if (hasJob && jobKey !== lastJobKey)                        event = 'job_started'
  else if (!hasJob && lastJobKey !== null)                         event = 'job_cancelled'

  const prevKey = lastJobKey

  // 4. Zbuduj payload
  const { result } = buildPayload(config, rawTelemetry, event, prevKey)

  // 5. Wyślij
  try {
    const res = await httpPost(`${config.server_url}/api/bridge`, result)

    if (res.status === 200 && res.body?.ok) {
      lastJobKey = hasJob ? jobKey : null

      if (event !== 'none') {
        const icons = { job_started: '🚛', job_delivered: '✅', job_cancelled: '❌' }
        console.log()
        ok(`${icons[event]} ${event.toUpperCase().replace(/_/g, ' ')} — ${jobKey ?? prevKey}`)
      } else {
        process.stdout.write(
          `\r  ${C.dim}[${ts()}] ⟳  ${
            hasJob
              ? `🚛 ${jobKey}  ${result.position.speed} km/h`
              : '🅿  Brak zlecenia'
          }${C.reset}   `,
        )
      }

    } else if (res.status === 401) {
      console.log()
      err('Klucz API jest nieprawidłowy lub wygasł!')
      warn('Wpisz "reset" + Enter aby zmienić konto.')

    } else if (res.status === 403) {
      console.log()
      err('Konto jest zbanowane. Skontaktuj się z administracją.')
      clearInterval(tickInterval)
      setTimeout(() => process.exit(1), 3_000)

    } else {
      const msg    = res.body?.error  ?? `HTTP ${res.status}`
      const issues = res.body?.issues ?? []
      console.log()
      warn(`Serwer: ${msg}`)
      issues.forEach(i => warn(`  ↳ [${i.path || '—'}] ${i.message}`))
    }

  } catch (e) {
    console.log()
    warn(`Błąd sieci: ${e.message}`)
  }
}

  // ── Start pętli ───────────────────────────────────────────
  await tick()
  tickInterval = setInterval(tick, SEND_INTERVAL)

  // KLUCZOWE: utrzymaj proces przy życiu niezależnie od stdin
  // setInterval sam w sobie utrzymuje event loop,
  // ale dodajemy też unref-owany keepalive na wszelki wypadek
  const keepAlive = setInterval(() => {}, 1_000 * 60 * 60)
  keepAlive.unref()
}

// ─── MAIN ─────────────────────────────────────────────────
async function main() {
  const config = loadConfig()

  if (!config) {
    console.log()
    err('Brak pliku konfiguracyjnego: vtc-config.json')
    warn('Zamknij to okno i uruchom START_VTC.bat ponownie.')
    console.log()
    await new Promise(r => setTimeout(r, 10_000))
    process.exit(1)
  }

  ok(`Konfiguracja wczytana: ${C.bold}${config.username}${C.reset} [${config.rank ?? '—'}]`)
  info(`Serwer: ${C.dim}${config.server_url}${C.reset}`)
  console.log()

  await startBridge(config)
}

// ─── Obsługa błędów globalnych ────────────────────────────
process.on('uncaughtException',  e => err(`Nieoczekiwany błąd: ${e.message}`))
process.on('unhandledRejection', e => warn(`Nieobsłużone odrzucenie: ${e?.message ?? e}`))

// KLUCZOWE: ignoruj SIGTERM z BAT — nie zamykaj się przy pipe close
process.on('SIGTERM', () => warn('SIGTERM zignorowany — bridge działa dalej'))

main()
