'use strict'

const http  = require('http')
const https = require('https')

const FUNBIT_URL        = 'http://localhost:25555/api/ets2/telemetry'
const SEND_INTERVAL     = 4_000
const DELIVERY_GRACE_MS = 12_000

class Bridge {
  constructor(config, emit) {
    this.config                = config
    this.emit                  = emit
    this.interval              = null
    this.lastJobKey            = null
    this.funbitOk              = false
    this.failCount             = 0
    this.stats                 = { sent: 0, delivered: 0, errors: 0 }
    this._pendingDelivery      = null
    this._activeJobData        = null
    this._maxEstimatedDistance = 0
    // FIX #2: śledź czy gra była rozłączona podczas pending
    this._disconnectedDuring   = false
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

  _extractPlannedDistance() {
    if (this._maxEstimatedDistance > 500) {
      return Math.round(this._maxEstimatedDistance / 1000)
    }
    if (this._activeJobData?.plannedKm && this._activeJobData.plannedKm > 0) {
      return this._activeJobData.plannedKm
    }
    return null
  }

  _extractSpeed(truck) {
    return Math.round(Math.abs(truck?.speed ?? 0) * 10) / 10
  }

  _extractDamage(truck) {
    const vals = [
      truck?.wearEngine, truck?.wearTransmission,
      truck?.wearCabin,  truck?.wearChassis, truck?.wearWheels,
    ].filter(v => v != null)
    return vals.length
      ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 100)
      : 0
  }

  _resetJobState() {
    this._activeJobData        = null
    this._maxEstimatedDistance = 0
    this._disconnectedDuring   = false
  }

  async _tick() {
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

    if (!raw?.game?.connected) {
      this.emit('status', { type: 'waiting' })
      // FIX #2: zaznacz że gra była rozłączona podczas pending delivery
      if (this._pendingDelivery) {
        this._disconnectedDuring = true
      }
      await this._sendOffline()
      return
    }

    if (!raw?.truck) return

    const job    = raw.job
    const hasJob = !!(job?.sourceCity && job?.destinationCity)
    const jobKey = hasJob ? `${job.sourceCity}→${job.destinationCity}` : null

    // Zbieraj max estimatedDistance
    if (hasJob && (raw.navigation?.estimatedDistance ?? 0) > 0) {
      const estM = raw.navigation.estimatedDistance
      if (this._activeJobData && jobKey !== this._activeJobData.jobKey) {
        this._maxEstimatedDistance = estM
      } else if (estM > this._maxEstimatedDistance) {
        this._maxEstimatedDistance = estM
      }
    }

    // Aktualizuj _activeJobData
    if (hasJob && job) {
      const currentIncome = (job.income ?? 0) > 0 ? job.income : null
      if (!this._activeJobData || jobKey !== this._activeJobData.jobKey) {
        this._activeJobData = {
          jobKey,
          plannedKm: this._extractPlannedDistance(),
          income:    currentIncome,
          cargo:     raw.trailer?.name ?? raw.trailer?.id ?? null,
        }
      } else {
        const current = this._extractPlannedDistance()
        if (current && current > (this._activeJobData.plannedKm ?? 0)) {
          this._activeJobData.plannedKm = current
        }
        if (currentIncome)      this._activeJobData.income = currentIncome
        if (raw.trailer?.name)  this._activeJobData.cargo  = raw.trailer.name
      }
    }

    // ── Obsługa pending delivery ───────────────────────────
    if (this._pendingDelivery) {
      const elapsed = Date.now() - this._pendingDelivery.timestamp

      // FIX #2: jeśli gra była rozłączona → to NIE jest delivery, to restart
      // Anuluj pending, przywróć lastJobKey żeby nie tworzyć fałszywego completed
      if (this._disconnectedDuring) {
        if (hasJob && jobKey === this._pendingDelivery.jobKey) {
          // Kierowca wrócił z tym samym joben → przywróć stan, nic nie zapisuj
          this._pendingDelivery    = null
          this._disconnectedDuring = false
          this.lastJobKey          = jobKey
          const payload = this._buildPayload(raw, 'none', null)
          await this._sendPayload(payload, raw, 'none', jobKey)
          return
        }
        // Inny job lub brak joba po reconnect → anuluj pending bez zapisu
        this._pendingDelivery    = null
        this._disconnectedDuring = false
        this.lastJobKey          = hasJob ? jobKey : null
        return
      }

      // Nowy job po dostarczeniu — FIX #1: wyślij delivered TYLKO tutaj
      if (hasJob && jobKey !== this._pendingDelivery.jobKey) {
        await this._fireDelivered(this._pendingDelivery, raw)
        this._pendingDelivery = null
        this.lastJobKey       = jobKey
        const payload = this._buildPayload(raw, 'job_started', jobKey)
        await this._sendPayload(payload, raw, 'job_started', jobKey)
        return
      }

      // Ten sam job wrócił w oknie grace — fałszywy trigger
      if (hasJob && jobKey === this._pendingDelivery.jobKey) {
        this._pendingDelivery = null
        this.lastJobKey       = jobKey
        const payload = this._buildPayload(raw, 'none', null)
        await this._sendPayload(payload, raw, 'none', jobKey)
        return
      }

      // Czekaj w oknie grace
      if (elapsed < DELIVERY_GRACE_MS) {
        const payload = this._buildPayload(raw, 'none', null)
        await this._sendPayload(payload, raw, 'none', null)
        return
      }

      // Grace minął, gra połączona → prawdziwe dostarczenie
      if (raw?.game?.connected && raw?.truck) {
        await this._fireDelivered(this._pendingDelivery, raw)
      } else {
        this._fireCancelled(this._pendingDelivery.jobKey)
      }
      this._pendingDelivery    = null
      this._disconnectedDuring = false
      this.lastJobKey          = null
      return
    }

    // ── Normalna logika ────────────────────────────────────
    const prevKey = this.lastJobKey
    let event     = 'none'

    if (hasJob && jobKey !== this.lastJobKey && this.lastJobKey !== null) {
      // FIX #1: NIE wysyłaj job_delivered tutaj — użyj _pendingDelivery flow
      // Bezpośrednia zmiana jobKey bez pending = edge case (TruckersMP teleport)
      // Traktuj jako: stary job cancelled + nowy started
      this._fireCancelled(this.lastJobKey)
      event = 'job_started'
    } else if (hasJob && jobKey !== this.lastJobKey) {
      event = 'job_started'
    } else if (!hasJob && this.lastJobKey !== null) {
      // Job zniknął → czekaj w pending
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
        this._resetJobState()
        this.emit('job_event', { event: 'job_delivered', jobKey })
        this.emit('telemetry', {
          connected: true, hasJob: false, event: 'job_delivered',
          speed: 0, fuelPct: 0, damage: 0, jobKey,
          from: originCity, to: destinationCity,
          cargo: null, truckModel: '', income: null,
          stats: { ...this.stats },
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
    this._resetJobState()
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

        const speed   = this._extractSpeed(truck)
        const fuel    = truck?.fuel         ?? 0
        const fuelCap = truck?.fuelCapacity ?? 1
        const fuelPct = Math.round((fuel / fuelCap) * 100)
        const damage  = this._extractDamage(truck)

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
        this.emit('error', { type: 'banned', message: 'Konto zablokowane' })
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

  _buildPayloadDelivered(lastRaw, currentRaw, deliveredJob) {
    const { game, truck: cTruck }                          = currentRaw ?? {}
    const { job: lJob, trailer: lTrailer, truck: lTruck }  = lastRaw    ?? {}

    const placement = cTruck?.placement ?? {}
    const speedKmh  = this._extractSpeed(cTruck)
    const damage    = this._extractDamage(lTruck)

    const fuelUsed = (cTruck?.fuelCapacity && cTruck?.fuel != null)
      ? Math.max(0, Math.round(cTruck.fuelCapacity - cTruck.fuel))
      : null

    const distKm =
      this._extractPlannedDistance() ??
      this._activeJobData?.plannedKm ??
      null

    const income =
      ((lJob?.income ?? 0) > 0 ? lJob.income : null) ??
      this._activeJobData?.income ??
      null

    const cargo =
      lTrailer?.name ??
      lTrailer?.id   ??
      this._activeJobData?.cargo ??
      null

    return {
      api_key:  this.config.api_key,
      position: {
        x: placement.x ?? 0, y: placement.y ?? 0, z: placement.z ?? 0,
        speed: speedKmh, game_time: game?.time ?? null, online: true,
      },
      active_job:    null,
      event:         'job_delivered',
      delivered_job: {
        origin_city:      deliveredJob.origin_city,
        destination_city: deliveredJob.destination_city,
        cargo,
        distance_km:      distKm,
        income,
        fuel_used:        fuelUsed,
        damage_percent:   damage,
      },
      telemetry: {
        has_job:        false,
        fuel_liters:    cTruck?.fuel         ?? null,
        fuel_capacity:  cTruck?.fuelCapacity ?? null,
        truck_brand:    cTruck?.make         ?? null,
        truck_model:    cTruck?.model        ?? null,
        speed_kmh:      speedKmh,
        damage_percent: damage,
      },
    }
  }

  _buildPayload(raw, event, prevKey) {
    const { game, truck, job, trailer, navigation } = raw ?? {}
    const hasJob    = !!(job?.sourceCity && job?.destinationCity)
    const speedKmh  = this._extractSpeed(truck)
    const placement = truck?.placement ?? {}
    const damage    = this._extractDamage(truck)

    const fuelUsed = (truck?.fuelCapacity && truck?.fuel != null)
      ? Math.max(0, Math.round(truck.fuelCapacity - truck.fuel))
      : null

    const plannedKm = this._extractPlannedDistance()
    const remainKm  = navigation?.estimatedDistance
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
        distance_km:      plannedKm,
        income:           job.income ?? null,
        fuel_used:        null,
        damage_percent:   damage,
      } : null,
      // FIX #1: nigdy nie wysyłaj job_delivered przez _buildPayload
      // delivery zawsze przez _fireDelivered() → brak duplikatów
      event: event === 'job_delivered' ? 'none' : event,
      delivered_job: undefined,
      telemetry: {
        has_job:               hasJob,
        from_city:             job?.sourceCity         ?? null,
        to_city:               job?.destinationCity    ?? null,
        from_company:          job?.sourceCompany      ?? null,
        to_company:            job?.destinationCompany ?? null,
        cargo:                 trailer?.name           ?? null,
        cargo_weight_kg:       trailer?.mass           ?? null,
        income:                job?.income             ?? null,
        job_max_distance:      plannedKm,
        distance_remaining_km: remainKm,
        truck_brand:           truck?.make             ?? null,
        truck_model:           truck?.model            ?? null,
        fuel_liters:           truck?.fuel             ?? null,
        fuel_capacity:         truck?.fuelCapacity     ?? null,
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