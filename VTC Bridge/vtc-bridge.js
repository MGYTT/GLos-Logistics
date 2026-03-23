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
const FUNBIT_TIMEOUT = 4_000   // ← było 5000, zmniejsz poniżej SEND_INTERVAL
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
        timeout: 8_000,
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
//
//  Funbit API — rzeczywiste pola:
//  • Pozycja:   truck.placement.x / .y / .z  (NIE worldX/Y/Z)
//  • Prędkość:  truck.speed  [m/s]  → mnożymy × 3.6 → km/h
//  • Czas gry:  game.time  [ISO string, np. "2026-03-23T21:41:05.000Z"]
//  • Cargo:     trailer.name ?? trailer.id  (NIE job.cargo)
//  • Dystans:   navigation.estimatedDistance [metry] → dzielimy / 1000 → km
//  • Paliwo:    truck.fuelCapacity - truck.fuel
//  • Zużycie:   truck.wearEngine (0–1) → × 100 → %
//
function buildPayload(config, telemetry, event, lastJobKey) {
  const { game, truck, job, trailer, navigation } = telemetry ?? {}

  // ── Pozycja ──────────────────────────────────────────────
  const placement = truck?.placement ?? {}
  const x         = placement.x ?? 0
  const y         = placement.y ?? 0
  const z         = placement.z ?? 0

  // Funbit zwraca m/s (może być ujemna przy jeździe wstecz)
  const speedKmh  = Math.round(Math.abs(truck?.speed ?? 0) * 3.6 * 10) / 10

  // game.time to pełny ISO string — nie skracamy
  const gameTime  = game?.time ?? null

  // ── Job ──────────────────────────────────────────────────
  const hasJob = !!(job?.sourceCity && job?.destinationCity)
  const jobKey = hasJob ? `${job.sourceCity}→${job.destinationCity}` : null

  // Cargo z trailera (Funbit nie daje job.cargo)
  const cargo = trailer?.name ?? trailer?.id ?? null

  // Dystans z nawigacji: metry → km
  const distanceKm = navigation?.estimatedDistance
    ? Math.round(navigation.estimatedDistance / 100) / 10
    : null

  // Income z job (waluta gry)
  const income = job?.income ?? null

  // ── Damage ───────────────────────────────────────────────
  const wearValues = [
    truck?.wearEngine,
    truck?.wearTransmission,
    truck?.wearCabin,
    truck?.wearChassis,
    truck?.wearWheels,
  ].filter(v => v != null)

  const damagePercent = wearValues.length > 0
    ? Math.round(wearValues.reduce((s, v) => s + v, 0) / wearValues.length * 100)
    : 0

  // ── Zużycie paliwa (do delivered_job) ────────────────────
  const fuelUsed = (truck?.fuelCapacity && truck?.fuel != null)
    ? Math.max(0, Math.round(truck.fuelCapacity - truck.fuel))
    : null

  // ── Payload ──────────────────────────────────────────────
  return {
    jobKey,
    hasJob,
    payload: {
      api_key: config.api_key,

      position: {
        x,
        y,
        z,
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

      // delivered_job wysyłamy tylko gdy event === 'job_delivered'
      // używamy lastJobKey żeby mieć poprawne miasto (przed resetem)
      delivered_job: event === 'job_delivered' ? {
        origin_city:      lastJobKey?.split('→')[0] ?? job?.sourceCity      ?? null,
        destination_city: lastJobKey?.split('→')[1] ?? job?.destinationCity ?? null,
        cargo,
        distance_km:      distanceKm,
        income,
        fuel_used:        fuelUsed,
        damage_percent:   damagePercent,
      } : undefined,
    },
  }
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

  const rl = readline.createInterface({
    input: process.stdin, output: process.stdout, terminal: false,
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
    rl.close()
    setTimeout(() => process.exit(0), 3_000)
  })

  let lastJobKey      = null
  let failCount       = 0
  let funbitOk        = false
  let tickInterval    = null
  // Ile razy z rzędu Funbit nie odpowiedział
  let consecutiveFail = 0

  async function sendOffline() {
    // Powiadom serwer że kierowca jest offline (gra zamknięta / menu)
    try {
      await httpPost(`${config.server_url}/api/bridge`, {
        api_key:  config.api_key,
        position: { x: 0, y: 0, z: 0, speed: 0, game_time: null, online: false },
        active_job:    null,
        event:         'none',
        delivered_job: undefined,
      })
    } catch {
      // Ignoruj błędy wysyłania offline — nie ważne
    }
  }

  async function tick() {

    // 1. Pobierz telemetrię z Funbit
    let telemetry
    try {
      const res = await httpGet(FUNBIT_URL)
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
      telemetry = res.body

      // Powróciło po przerwie
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

      // Loguj przy pierwszym błędzie i co 12 ticki (~1 min)
      if (consecutiveFail === 1 || consecutiveFail % 12 === 0) {
        console.log()
        warn(`Funbit niedostępny — czekam na grę... (${e.message})`)
      }

      // Po 3 nieudanych próbach z rzędu (15s) → wyślij online: false
      if (consecutiveFail === 3) {
        process.stdout.write(`\r  ${C.dim}[${ts()}] 🔴  Bridge offline — gra zamknięta lub w menu${C.reset}   `)
        await sendOffline()
      }

      return
    }

    // Funbit odpowiedział — sprawdź czy gra faktycznie połączona z pluginem
    const { game, truck, job, trailer, navigation } = telemetry ?? {}

    // game.connected === false = gra otwarta ale plugin nie załadowany (menu główne)
    if (!game?.connected) {
      consecutiveFail = 0
      process.stdout.write(`\r  ${C.dim}[${ts()}] ⏳  Oczekuję na załadowanie mapy...${C.reset}   `)

      // Wyślij online: false żeby strona nie pokazywała starej pozycji
      await sendOffline()
      return
    }

    // Reset — gra działa poprawnie
    consecutiveFail = 0

    if (!truck) return

    // 2. Wykryj zdarzenie joba
    const hasJob = !!(job?.sourceCity && job?.destinationCity)
    const jobKey = hasJob ? `${job.sourceCity}→${job.destinationCity}` : null

    let event = 'none'
    if      (hasJob && jobKey !== lastJobKey && lastJobKey !== null) event = 'job_delivered'
    else if (hasJob && jobKey !== lastJobKey)                        event = 'job_started'
    else if (!hasJob && lastJobKey !== null)                         event = 'job_cancelled'

    const prevKey = lastJobKey

    // 3. Zbuduj payload
    const { payload } = buildPayload(config, telemetry, event, prevKey)

    // 4. Wyślij do serwera
    try {
      const res = await httpPost(`${config.server_url}/api/bridge`, payload)

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
                ? `🚛 ${jobKey}  ${payload.position.speed} km/h`
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

  await tick()
  tickInterval = setInterval(tick, SEND_INTERVAL)
}
