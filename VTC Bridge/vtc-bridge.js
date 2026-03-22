'use strict'

const fs       = require('fs')
const path     = require('path')
const http     = require('http')
const https    = require('https')
const readline = require('readline')

// ─── Stałe ──────────────────────────────────────
const CONFIG_PATH   = path.join(__dirname, 'vtc-config.json')
const FUNBIT_URL    = 'http://localhost:25555/api/ets2/telemetry'
const SEND_INTERVAL = 5_000

// ─── Kolory ─────────────────────────────────────
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

const ts    = () => new Date().toLocaleTimeString('pl-PL')
const info  = m  => console.log(`${C.dim}[${ts()}]${C.reset} ${C.cyan} INFO ${C.reset} ${m}`)
const ok    = m  => console.log(`${C.dim}[${ts()}]${C.reset} ${C.green}  OK  ${C.reset} ${m}`)
const warn  = m  => console.log(`${C.dim}[${ts()}]${C.reset} ${C.yellow} WARN ${C.reset} ${m}`)
const err   = m  => console.log(`${C.dim}[${ts()}]${C.reset} ${C.red}  ERR ${C.reset} ${m}`)

// ─── Config ─────────────────────────────────────
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

// ─── HTTP ────────────────────────────────────────
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
      }
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
    const req = lib.get(url, { timeout: 5_000 }, res => {
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

// ─── Bridge loop ────────────────────────────────
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

  // ── Obsługa komendy "reset" ──────────────────
  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
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

    // Zatrzymaj ticki i wyjdź po 3s
    clearInterval(tickInterval)
    rl.close()
    setTimeout(() => process.exit(0), 3_000)
  })

  // ── Stan joba ───────────────────────────────
  let lastJobKey   = null   // "Miasto→Miasto" lub null
  let failCount    = 0
  let tickInterval = null

  // ── Tick ────────────────────────────────────
  async function tick() {
    // 1. Pobierz telemetrię z Funbit
    let telemetry
    try {
      const res = await httpGet(FUNBIT_URL)
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
      telemetry = res.body

      if (failCount > 0) {
        console.log()
        ok('Połączono z Funbit!')
        failCount = 0
      }
    } catch (e) {
      failCount++
      // Loguj tylko przy pierwszym błędzie i co 24 ticki (~2 min)
      if (failCount === 1 || failCount % 24 === 0) {
        warn(`Funbit niedostępny — czekam na grę... (${e.message})`)
      }
      return
    }

    const { game, truck, job } = telemetry ?? {}
    if (!truck) return

    // 2. Wykryj zdarzenie joba
    const hasJob = !!(job?.sourceCity && job?.destinationCity)
    const jobKey = hasJob
      ? `${job.sourceCity}→${job.destinationCity}`
      : null

    let event = 'none'

    if (hasJob && jobKey !== lastJobKey) {
      // Nowy job — jeśli poprzedni był aktywny to najpierw dostarczony
      event = lastJobKey !== null ? 'job_delivered' : 'job_started'
    } else if (!hasJob && lastJobKey !== null) {
      event = 'job_cancelled'
    }

    // 3. Zbuduj payload
    const prevKey = lastJobKey  // zachowaj przed nadpisaniem

    const payload = {
      api_key: config.api_key,

      position: {
        x:         truck.worldX  ?? 0,
        y:         truck.worldY  ?? 0,
        z:         truck.worldZ  ?? 0,
        speed:     Math.max(0, truck.speed ?? 0),
        game_time: game?.time    ?? null,
        online:    true,
      },

      active_job: hasJob
        ? {
            cargo:            job.cargo           ?? null,
            origin_city:      job.sourceCity      ?? null,
            destination_city: job.destinationCity ?? null,
            distance_km:      job.totalDistance   ?? null,
            income:           job.income          ?? null,
            fuel_used:        null,
            damage_percent:   truck.wearEngine != null
              ? Math.round(truck.wearEngine * 100)
              : null,
          }
        : null,

      event,

      delivered_job: event === 'job_delivered'
        ? {
            origin_city:      prevKey?.split('→')[0] ?? null,
            destination_city: prevKey?.split('→')[1] ?? null,
            cargo:            job?.cargo             ?? null,
            distance_km:      job?.totalDistance     ?? null,
            income:           job?.income            ?? null,
            fuel_used:        (truck.fuelCapacity && truck.fuel)
              ? Math.max(0, Math.round(truck.fuelCapacity - truck.fuel))
              : null,
            damage_percent:   truck.wearEngine != null
              ? Math.round(truck.wearEngine * 100)
              : null,
          }
        : undefined,
    }

    // 4. Wyślij do serwera
    try {
      const res = await httpPost(`${config.server_url}/api/bridge`, payload)

      if (res.status === 200 && res.body?.ok) {
        // Aktualizuj stan dopiero po sukcesie
        lastJobKey = hasJob ? jobKey : null

        if (event !== 'none') {
          const icon = { job_started: '🚛', job_delivered: '✅', job_cancelled: '❌' }
          console.log()
          ok(`${icon[event]} ${event.toUpperCase().replace(/_/g, ' ')} — ${jobKey ?? prevKey}`)
        } else {
          process.stdout.write(
            `\r  ${C.dim}[${ts()}] ⟳  ${
              hasJob
                ? `🚛 ${jobKey}`
                : '🅿  Brak zlecenia'
            }${C.reset}   `
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
        const msg = res.body?.error ?? `HTTP ${res.status}`
        warn(`Serwer: ${msg}`)
      }

    } catch (e) {
      warn(`Błąd sieci: ${e.message}`)
    }
  }

  // ── Uruchom pętlę ───────────────────────────
  tickInterval = setInterval(tick, SEND_INTERVAL)
  tick()  // pierwszy tick natychmiast
}

// ─── MAIN ────────────────────────────────────────
async function main() {
  const config = loadConfig()

  if (!config) {
    // Config powinien być już zapisany przez START_VTC.bat
    console.log()
    err('Brak pliku konfiguracyjnego: vtc-config.json')
    warn('Zamknij to okno i uruchom START_VTC.bat ponownie.')
    console.log()
    // Czekaj na zamknięcie — nie exit od razu
    await new Promise(resolve => setTimeout(resolve, 10_000))
    process.exit(1)
  }

  ok(`Konfiguracja wczytana: ${C.bold}${config.username}${C.reset} [${config.rank ?? '—'}]`)
  info(`Serwer: ${C.dim}${config.server_url}${C.reset}`)
  console.log()

  await startBridge(config)
}

// ─── Obsługa nieoczekiwanych błędów ─────────────
process.on('uncaughtException', e => {
  err(`Nieoczekiwany błąd: ${e.message}`)
  // Nie zamykaj procesu — bridge ma działać dalej
})

process.on('unhandledRejection', e => {
  warn(`Nieobsłużone odrzucenie: ${e?.message ?? e}`)
})

main()
