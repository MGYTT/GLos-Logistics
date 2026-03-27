'use strict'

const http  = require('http')
const https = require('https')

const FUNBIT_URL      = 'http://localhost:25555/api/ets2/telemetry'
const SEND_INTERVAL   = 4_000
const DELIVERY_GRACE_MS = 12_000

class Bridge {
  constructor(config, emit) {
    this.config           = config
    this.emit             = emit
    this.interval         = null
    this.lastJobKey       = null
    this.funbitOk         = false
    this.failCount        = 0
    this.stats            = { sent: 0, delivered: 0, errors: 0 }
    this._pendingDelivery = null  // { jobKey, timestamp, lastRaw }
  }

  async start() {
    this.emit('status', { type: 'connecting' })
    await this._tick()
    this.interval = setInterval(() => this._tick(), SEND_INTERVAL)
  }

  stop() {
    if (this.interval) clearInterval(this.interval)
    this.interval = null
    this._sendOffline().catch(() => {})
    this.emit('status', { type: 'stopped' })
  }

  async _tick() {
    // 1. Pobierz telemetrię z Funbit
    let raw
    try {
      const res = await this._get(FUNBIT_URL)
      raw = res.body
      if (!this.funbitOk || this.failCount > 0) {
        this.funbitOk  = true
        this.failCount = 0
        this.emit('funbit', { ok: true })
      }
    } catch {
      this.failCount++
      if (this.failCount === 1 || this.failCount % 12 === 0) {
        this.funbitOk = false
        this.emit('funbit', { ok: false })
      }
      if (this.failCount === 3) await this._sendOffline()
      return
    }

    // 2. Gra niezaładowana
    if (!raw?.game?.connected) {
      this.emit('status', { type: 'waiting' })
      await this._sendOffline()
      return
    }

    if (!raw?.truck) return

    // 3. Wykryj stan joba
    const job    = raw.job
    const hasJob = !!(job?.sourceCity && job?.destinationCity)
    const jobKey = hasJob ? `${job.sourceCity}→${job.destinationCity}` : null
    const prevKey = this.lastJobKey

    // ── Obsługa pending delivery ──────────────────────────
    if (this._pendingDelivery) {
      const elapsed = Date.now() - this._pendingDelivery.timestamp

      if (hasJob && jobKey !== this._pendingDelivery.jobKey) {
        // Pojawił się NOWY job → poprzedni był delivered
        await this._fireDelivered(this._pendingDelivery, raw)
        this._pendingDelivery = null
        this.lastJobKey = jobKey
        const payload = this._buildPayload(raw, 'job_started', jobKey)
        await this._sendPayload(payload, raw, 'job_started', jobKey)
        return
      }

      if (hasJob && jobKey === this._pendingDelivery.jobKey) {
        // Ten sam job wrócił (błąd odczytu) → kontynuuj normalnie
        this._pendingDelivery = null
        this.lastJobKey = jobKey
        const payload = this._buildPayload(raw, 'none', null)
        await this._sendPayload(payload, raw, 'none', jobKey)
        return
      }

      if (elapsed < DELIVERY_GRACE_MS) {
        // W trakcie grace period — tick bez zdarzenia
        const payload = this._buildPayload(raw, 'none', null)
        await this._sendPayload(payload, raw, 'none', null)
        return
      }

      // Grace period minął — jeśli gra połączona to DELIVERED, inaczej cancelled
      if (raw?.game?.connected && raw?.truck) {
        await this._fireDelivered(this._pendingDelivery, raw)
      } else {
        this._fireCancelled(this._pendingDelivery.jobKey)
      }
      this._pendingDelivery = null
      this.lastJobKey = null
      return
    }

    // ── Normalna logika ────────────────────────────────────
    let event = 'none'

    if (hasJob && jobKey !== this.lastJobKey && this.lastJobKey !== null) {
      event = 'job_delivered'
    } else if (hasJob && jobKey !== this.lastJobKey) {
      event = 'job_started'
    } else if (!hasJob && this.lastJobKey !== null) {
      // Job zniknął → ustaw pending, NIE cancelled od razu
      this._pendingDelivery = {
        jobKey:    this.lastJobKey,
        timestamp: Date.now(),
        lastRaw:   raw,
      }
      this.lastJobKey = null
      const payload = this._buildPayload(raw, 'none', null)
      await this._sendPayload(payload, raw, 'none', null)
      return
    }

    const payload = this._buildPayload(raw, event, prevKey)
    await this._sendPayload(payload, raw, event, hasJob ? jobKey : prevKey)

    if (event !== 'job_cancelled') {
      this.lastJobKey = hasJob ? jobKey : null
    }
  }

  // ── _fireDelivered ─────────────────────────────────────
  // pending.lastRaw = dane gdy job jeszcze istniał (dystans, cargo, income)
  // currentRaw      = dane teraz (pozycja, paliwo po dostawie)
  async _fireDelivered(pending, currentRaw) {
    const { jobKey, lastRaw } = pending
    const [originCity, destinationCity] = jobKey.split('→')

    const payload = this._buildPayloadDelivered(lastRaw, currentRaw, {
      origin_city:      originCity,
      destination_city: destinationCity,
    })

    try {
      const res = await this._post(`${this.config.server_url}/api/bridge`, payload)
      if (res.status === 200 && res.body?.ok) {
        this.stats.sent++
        this.stats.delivered++
        this.emit('job_event', { event: 'job_delivered', jobKey })
        this.emit('telemetry', {
          connected:  true,
          hasJob:     false,
          event:      'job_delivered',
          speed:      0,
          fuelPct:    0,
          damage:     0,
          jobKey,
          from:       originCity,
          to:         destinationCity,
          cargo:      null,
          truckModel: '',
          income:     null,
          stats:      { ...this.stats },
        })
      } else if (res.status === 401) {
        this.emit('error', { type: 'auth', message: 'Nieprawidłowy klucz API' })
        this.stop()
      } else {
        this.stats.errors++
        this.emit('error', { type: 'server', message: res.body?.error ?? `HTTP ${res.status}` })
      }
    } catch (e) {
      this.stats.errors++
      this.emit('error', { type: 'network', message: e.message })
    }
  }

  _fireCancelled(jobKey) {
    this.emit('job_event', { event: 'job_cancelled', jobKey })
  }

  async _sendPayload(payload, raw, event, jobKeyForGui) {
    try {
      const res = await this._post(`${this.config.server_url}/api/bridge`, payload)

      if (res.status === 200 && res.body?.ok) {
        const job    = raw?.job
        const hasJob = !!(job?.sourceCity && job?.destinationCity)
        const truck  = raw?.truck

        if (event !== 'none' && event !== 'job_delivered') {
          this.lastJobKey = hasJob ? jobKeyForGui : null
        }

        this.stats.sent++
        if (event === 'job_delivered') this.stats.delivered++

        // FIX: Funbit zwraca m/s → przelicz na km/h (* 3.6)
        const speed   = Math.round(Math.abs(truck?.speed ?? 0) * 10) / 10
        const fuel    = truck?.fuel         ?? 0
        const fuelCap = truck?.fuelCapacity ?? 1
        const fuelPct = Math.round((fuel / fuelCap) * 100)

        const wearValues = [
          truck?.wearEngine, truck?.wearTransmission,
          truck?.wearCabin,  truck?.wearChassis, truck?.wearWheels,
        ].filter(v => v != null)
        const damage = wearValues.length
          ? Math.round(wearValues.reduce((s, v) => s + v, 0) / wearValues.length * 100)
          : 0

        this.emit('telemetry', {
          connected:  true,
          hasJob,
          event,
          speed,
          fuelPct,
          damage,
          jobKey:     jobKeyForGui ?? null,
          from:       job?.sourceCity      ?? null,
          to:         job?.destinationCity ?? null,
          cargo:      raw?.trailer?.name   ?? null,
          truckModel: `${truck?.make ?? ''} ${truck?.model ?? ''}`.trim(),
          income:     job?.income          ?? null,
          stats:      { ...this.stats },
        })

        if (event !== 'none') {
          this.emit('job_event', { event, jobKey: jobKeyForGui })
        }

      } else if (res.status === 401) {
        this.emit('error', { type: 'auth', message: 'Nieprawidłowy klucz API' })
        this.stop()
      } else if (res.status === 403) {
        this.emit('error', { type: 'banned', message: 'Konto zbanowane' })
        this.stop()
      } else {
        this.stats.errors++
        this.emit('error', { type: 'server', message: res.body?.error ?? `HTTP ${res.status}` })
      }
    } catch (e) {
      this.stats.errors++
      this.emit('error', { type: 'network', message: e.message })
    }
  }

  // lastRaw = dane z momentu gdy job jeszcze istniał (dystans, cargo, income)
  // currentRaw = dane teraz po dostawie (pozycja, paliwo)
  _buildPayloadDelivered(lastRaw, currentRaw, deliveredJob) {
    const { game, truck: cTruck }                          = currentRaw ?? {}
    const { job: lJob, trailer: lTrailer, navigation: lNav, truck: lTruck } = lastRaw  ?? {}

    const placement = cTruck?.placement ?? {}

    // FIX: Funbit m/s → km/h
    const speedKmh = Math.round(Math.abs(cTruck?.speed ?? 0) * 10) / 10

    const wearValues = [
      lTruck?.wearEngine, lTruck?.wearTransmission,
      lTruck?.wearCabin,  lTruck?.wearChassis, lTruck?.wearWheels,
    ].filter(v => v != null)
    const damage = wearValues.length
      ? Math.round(wearValues.reduce((s, v) => s + v, 0) / wearValues.length * 100)
      : 0

    // Paliwo zużyte = capacity - obecny poziom paliwa (po dostawie)
    const fuelUsed = (cTruck?.fuelCapacity && cTruck?.fuel != null)
      ? Math.max(0, Math.round(cTruck.fuelCapacity - cTruck.fuel))
      : null

    // Dystans z lastRaw (gdy job jeszcze aktywny) — Funbit w metrach → km
    const distKm = lNav?.estimatedDistance
      ? Math.round(lNav.estimatedDistance / 1000)
      : null

    // Income z ostatniego stanu aktywnego joba
    const income = (lJob?.income ?? 0) > 0 ? lJob.income : null

    return {
      api_key:  this.config.api_key,
      position: {
        x: placement.x ?? 0, y: placement.y ?? 0, z: placement.z ?? 0,
        speed: speedKmh, game_time: game?.time ?? null, online: true,
      },
      active_job: null,
      event: 'job_delivered',
      delivered_job: {
        origin_city:      deliveredJob.origin_city,
        destination_city: deliveredJob.destination_city,
        cargo:            lTrailer?.name ?? lTrailer?.id ?? null,
        distance_km:      distKm,
        income:           income,
        fuel_used:        fuelUsed,
        damage_percent:   damage,
      },
      telemetry: {
        has_job:       false,
        fuel_liters:   cTruck?.fuel          ?? null,
        fuel_capacity: cTruck?.fuelCapacity  ?? null,
        truck_brand:   cTruck?.make          ?? null,
        truck_model:   cTruck?.model         ?? null,
        speed_kmh:     speedKmh,
        damage_percent: damage,
      },
    }
  }

  _buildPayload(raw, event, prevKey) {
    const { game, truck, job, trailer, navigation } = raw ?? {}
    const hasJob    = !!(job?.sourceCity && job?.destinationCity)
    // FIX: Funbit m/s → km/h
    const speedKmh  = Math.round(Math.abs(truck?.speed ?? 0) * 10) / 10
    const placement = truck?.placement ?? {}

    const wearValues = [
      truck?.wearEngine, truck?.wearTransmission,
      truck?.wearCabin,  truck?.wearChassis, truck?.wearWheels,
    ].filter(v => v != null)
    const damage = wearValues.length
      ? Math.round(wearValues.reduce((s, v) => s + v, 0) / wearValues.length * 100)
      : 0

    const fuelUsed = (truck?.fuelCapacity && truck?.fuel != null)
      ? Math.max(0, Math.round(truck.fuelCapacity - truck.fuel))
      : null

    // Funbit estimatedDistance w metrach → km
    const distKm = navigation?.estimatedDistance
      ? Math.round(navigation.estimatedDistance / 1000)
      : null

    return {
      api_key:  this.config.api_key,
      position: {
        x: placement.x ?? 0, y: placement.y ?? 0, z: placement.z ?? 0,
        speed: speedKmh, game_time: game?.time ?? null, online: true,
      },
      active_job: hasJob ? {
        cargo:            trailer?.name ?? trailer?.id ?? null,
        origin_city:      job.sourceCity,
        destination_city: job.destinationCity,
        distance_km:      distKm,
        income:           job.income ?? null,
        fuel_used:        null,
        damage_percent:   damage,
      } : null,
      event,
      delivered_job: event === 'job_delivered' ? {
        origin_city:      prevKey?.split('→')[0] ?? job?.sourceCity      ?? null,
        destination_city: prevKey?.split('→')[1] ?? job?.destinationCity ?? null,
        cargo:            trailer?.name ?? trailer?.id ?? null,
        distance_km:      distKm,
        income:           job?.income ?? null,
        fuel_used:        fuelUsed,
        damage_percent:   damage,
      } : undefined,
      telemetry: {
        has_job:               hasJob,
        from_city:             job?.sourceCity          ?? null,
        to_city:               job?.destinationCity     ?? null,
        from_company:          job?.sourceCompany       ?? null,
        to_company:            job?.destinationCompany  ?? null,
        cargo:                 trailer?.name            ?? null,
        cargo_weight_kg:       trailer?.mass            ?? null,
        income:                job?.income              ?? null,
        distance_remaining_km: distKm,
        truck_brand:           truck?.make              ?? null,
        truck_model:           truck?.model             ?? null,
        fuel_liters:           truck?.fuel              ?? null,
        fuel_capacity:         truck?.fuelCapacity      ?? null,
        damage_percent:        damage,
      },
    }
  }

  async _sendOffline() {
    try {
      await this._post(`${this.config.server_url}/api/bridge`, {
        api_key:    this.config.api_key,
        position:   { x: 0, y: 0, z: 0, speed: 0, game_time: null, online: false },
        active_job: null,
        event:      'none',
        telemetry:  { has_job: false },
      })
    } catch {}
  }

  _get(url) {
    return new Promise((resolve, reject) => {
      const req = http.get(url, { timeout: 4000 }, res => {
        let d = ''
        res.on('data', c => (d += c))
        res.on('end',  () => {
          try   { resolve({ body: JSON.parse(d) }) }
          catch { reject(new Error('Parse error')) }
        })
      })
      req.on('error',   reject)
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
    })
  }

  _post(url, body) {
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
          timeout: 8000,
        },
        res => {
          let d = ''
          res.on('data', c => (d += c))
          res.on('end',  () => {
            try   { resolve({ status: res.statusCode, body: JSON.parse(d) }) }
            catch { resolve({ status: res.statusCode, body: d }) }
          })
        }
      )
      req.on('error',   reject)
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
      req.write(payload)
      req.end()
    })
  }
}

module.exports = Bridge
