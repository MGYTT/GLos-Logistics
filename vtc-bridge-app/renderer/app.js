'use strict'

const SITE_URL = 'https://glos-logistics.vercel.app'

let isRunning = false
let config    = null

// ─── Elementy DOM ─────────────────────────────
const $ = id => document.getElementById(id)

const screens  = { setup: $('screen-setup'), dash: $('screen-dashboard') }
const verifyBtn  = $('btn-verify')
const verifyText = $('verify-text')
const verifySpinner = $('verify-spinner')
const verifyResult  = $('verify-result')
const toggleBtn = $('btn-toggle')

// ─── Helpers ──────────────────────────────────
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add('hidden'))
  screens[name]?.classList.remove('hidden')
}

function ts() {
  return new Date().toLocaleTimeString('pl-PL', { hour12: false })
}

function addLog(msg, type = '') {
  const list = $('log-list')
  const entry = document.createElement('div')
  entry.className = 'log-entry'
  entry.innerHTML = `<span class="log-time">${ts()}</span><span class="log-msg ${type}">${msg}</span>`
  list.prepend(entry)
  // Max 50 wpisów
  while (list.children.length > 50) list.removeChild(list.lastChild)
}

function setStatus(type, label, sub) {
  const dot = $('status-dot')
  dot.className = 'status-indicator'
  if (type === 'green')  dot.classList.add('green')
  if (type === 'amber')  dot.classList.add('amber')
  if (type === 'red')    dot.classList.add('red')
  $('status-label').textContent = label
  $('status-sub').textContent   = sub
}

// ─── Init ─────────────────────────────────────
async function init() {
  config = await window.vtc.loadConfig()

  if (config) {
    showDashboard()
  } else {
    showScreen('setup')
  }

  // Tray toggle
  window.vtc.onTrayToggle(() => toggleBridge())
}

function showDashboard() {
  $('profile-name').textContent = config.username ?? '—'
  $('profile-rank').textContent = config.rank     ?? '—'
  showScreen('dash')
  setStatus('', 'Zatrzymany', 'Kliknij Start aby uruchomić')
}

// ─── Setup — weryfikacja ──────────────────────
$('btn-toggle-key').addEventListener('click', () => {
  const input = $('input-apikey')
  input.type  = input.type === 'password' ? 'text' : 'password'
})

$('link-panel').addEventListener('click', (e) => {
  e.preventDefault()
  window.vtc.openUrl(`${SITE_URL}/hub/profile`)
})

verifyBtn.addEventListener('click', async () => {
  const server = $('input-server').value.trim().replace(/\/$/, '')
  const apiKey = $('input-apikey').value.trim()

  if (!server) { showResult('error', '❌ Wpisz adres serwera');   return }
  if (!apiKey) { showResult('error', '❌ Wpisz klucz API Bridge'); return }

  verifyBtn.disabled = true
  verifyText.classList.add('hidden')
  verifySpinner.classList.remove('hidden')
  verifyResult.classList.add('hidden')

  const res = await window.vtc.verifyKey(server, apiKey)

  verifyBtn.disabled = false
  verifyText.classList.remove('hidden')
  verifySpinner.classList.add('hidden')

  if (!res.ok) {
    showResult('error', `❌ ${res.error}`)
    return
  }

  // Zapisz config
  const cfg = {
    api_key:     apiKey,
    server_url:  server,
    username:    res.username,
    rank:        res.rank,
    verified_at: new Date().toISOString(),
  }
  await window.vtc.saveConfig(cfg)
  config = cfg

  showResult('success', `✅ Witaj, ${res.username} [${res.rank}]!`)
  setTimeout(() => showDashboard(), 1200)
})

function showResult(type, msg) {
  verifyResult.className = `result ${type}`
  verifyResult.textContent = msg
  verifyResult.classList.remove('hidden')
}

// ─── Dashboard — toggle bridge ────────────────
toggleBtn.addEventListener('click', () => toggleBridge())

async function toggleBridge() {
  if (isRunning) {
    await window.vtc.stopBridge()
    isRunning = false
    toggleBtn.textContent = '▶ Start'
    toggleBtn.classList.remove('running')
    setStatus('red', 'Zatrzymany', 'Kliknij Start aby uruchomić')
    addLog('Bridge zatrzymany', 'warn')
  } else {
    setStatus('amber', 'Łączenie...', 'Czekam na odpowiedź serwera')
    const res = await window.vtc.startBridge()
    if (!res.ok) {
      setStatus('red', 'Błąd startu', res.error ?? 'Nieznany błąd')
      addLog(`Błąd: ${res.error}`, 'error')
      return
    }
    isRunning = true
    toggleBtn.textContent = '■ Stop'
    toggleBtn.classList.add('running')
    setStatus('amber', 'Uruchomiony', 'Czekam na grę...')
    addLog('Bridge uruchomiony', 'ok')
  }
}

// ─── Reset konta ──────────────────────────────
$('btn-reset').addEventListener('click', async () => {
  if (isRunning) {
    await window.vtc.stopBridge()
    isRunning = false
  }
  await window.vtc.deleteConfig()
  config = null
  $('input-apikey').value = ''
  showScreen('setup')
  addLog('Konfiguracja zresetowana', 'warn')
})

// ─── Bridge events ────────────────────────────
window.vtc.onBridgeEvent((event, data) => {
  switch (event) {

    case 'funbit':
      if (data.ok) {
        setStatus('green', 'Aktywny', 'Telemetria odebrana')
        addLog('Funbit połączony ✓', 'ok')
      } else {
        setStatus('amber', 'Czeka na grę', 'Uruchom ETS2 + Funbit')
        addLog('Funbit niedostępny — czekam...', 'warn')
      }
      break

    case 'status':
      if (data.type === 'waiting') {
        setStatus('amber', 'Czeka na grę', 'Oczekuję na załadowanie mapy...')
      }
      if (data.type === 'stopped') {
        setStatus('', 'Zatrzymany', '')
      }
      break

    case 'telemetry':
      // Karty telemetrii
      $('t-speed').textContent  = `${data.speed}`
      $('t-fuel').textContent   = `${data.fuelPct}%`
      $('t-damage').textContent = data.damage > 0 ? `${data.damage}%` : '✓'
      $('t-jobs').textContent   = data.stats?.sent ?? 0

      // Stats sesji
      $('s-sent').textContent      = data.stats?.sent      ?? 0
      $('s-delivered').textContent = data.stats?.delivered ?? 0
      $('s-errors').textContent    = data.stats?.errors    ?? 0

      // Zlecenie
      if (data.hasJob) {
        $('job-none').classList.add('hidden')
        $('job-info').classList.remove('hidden')
        $('job-from').textContent   = data.from   ?? '—'
        $('job-to').textContent     = data.to     ?? '—'
        $('job-cargo').textContent  = data.cargo  ?? '—'
        $('job-income').textContent = data.income
          ? `💰 ${data.income.toLocaleString('pl-PL')} VTC€`
          : ''
      } else {
        $('job-none').classList.remove('hidden')
        $('job-info').classList.add('hidden')
      }

      // Status
      if (isRunning) {
        setStatus('green', 'Aktywny', data.hasJob
          ? `🚛 ${data.from} → ${data.to}`
          : '🅿 Brak zlecenia'
        )
      }
      break

    case 'job_event': {
      const icons = { job_started: '🚛', job_delivered: '✅', job_cancelled: '❌' }
      const labels = { job_started: 'Nowe zlecenie', job_delivered: 'Dostarczone!', job_cancelled: 'Anulowane' }
      addLog(`${icons[data.event]} ${labels[data.event]}: ${data.jobKey ?? ''}`, 'event')
      break
    }

    case 'error':
      addLog(`❌ ${data.message}`, 'error')
      if (data.type === 'auth' || data.type === 'banned') {
        setStatus('red', 'Błąd autoryzacji', data.message)
        isRunning = false
        toggleBtn.textContent = '▶ Start'
        toggleBtn.classList.remove('running')
      }
      break
  }
})

// ─── Titlebar ─────────────────────────────────
$('btn-minimize').addEventListener('click', () => window.vtc.minimize())
$('btn-hide').addEventListener('click',     () => window.vtc.hide())
$('btn-close').addEventListener('click',    () => window.vtc.close())

// ─── Auto-updater UI ──────────────────────────
window.vtc.onUpdateEvent((event, data) => {
  if (event !== 'update:status') return

  const banner  = $('update-banner')
  const bannerText = $('update-banner-text')
  const bannerBtn  = $('update-banner-btn')
  if (!banner) return

  if (data.type === 'available') {
    bannerText.textContent   = `⬇️  Pobieranie v${data.version}...`
    bannerBtn.style.display  = 'none'
    banner.style.display     = 'flex'
    addLog(`🔄 Aktualizacja v${data.version} — pobieranie w tle...`, 'ok')
  }

  if (data.type === 'downloaded') {
    bannerText.textContent   = `✅  v${data.version} gotowa do instalacji`
    bannerBtn.style.display  = 'inline-block'
    banner.style.display     = 'flex'
    bannerBtn.onclick        = () => window.vtc.installUpdate()
    addLog(`✅ Aktualizacja v${data.version} pobrana — kliknij "Zainstaluj"`, 'ok')
  }
})

window.vtc.onUpdateEvent((event, data) => {
  if (event !== 'update:progress') return
  addLog(`⬇️  Pobieranie: ${data.percent}% (${data.speedKBs} KB/s)`, '')
})

// ─── Start ────────────────────────────────────
init()
