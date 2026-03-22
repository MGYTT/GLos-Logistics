export interface JobPayInput {
  distance_km:      number
  cargo_units:      number        // domyślnie 1 jeśli Bridge nie daje
  fuel_used_liters: number | null
  damage_percent:   number        // 0–100
  cargo_type:       'normal' | 'adr' | 'oversize' | 'valuable' | null
  had_fine:         boolean
  fine_amount:      number        // 0 jeśli brak
  fuel_price:       number        // aktualna cena VTC€/litr (z DB)
}

export interface JobPayResult {
  base:           number
  bonus_eco:      number
  bonus_no_damage:number
  bonus_cargo:    number
  bonus_distance: number
  penalty_damage: number
  penalty_fuel:   number
  penalty_fine:   number
  gross:          number    // przed podziałem
  driver_share:   number    // 85%
  company_share:  number    // 15%
  breakdown:      PayBreakdownItem[]
}

export interface PayBreakdownItem {
  label:  string
  amount: number
  type:   'base' | 'bonus' | 'penalty'
}

const DRIVER_CUT  = 0.85
const COMPANY_CUT = 0.15

export function calculateJobPay(input: JobPayInput): JobPayResult {
  const {
    distance_km, cargo_units, fuel_used_liters,
    damage_percent, cargo_type, had_fine,
    fine_amount, fuel_price,
  } = input

  // ── Baza ──────────────────────────────────────
  const base = Math.round(
    distance_km * 1.35 + cargo_units * 4
  )

  // ── Bonusy ────────────────────────────────────
  const fuelPer100 = fuel_used_liters && distance_km > 0
    ? (fuel_used_liters / distance_km) * 100
    : null

  let bonus_eco = 0
  if (fuelPer100 !== null) {
    if (fuelPer100 < 7)  bonus_eco = Math.round(base * 0.28)
    else if (fuelPer100 < 9) bonus_eco = Math.round(base * 0.18)
  }

  const bonus_no_damage = damage_percent === 0
    ? Math.round(base * 0.12)
    : 0

  let cargo_pct = 0
  if (cargo_type === 'adr')      cargo_pct = 0.15
  if (cargo_type === 'oversize') cargo_pct = 0.12
  if (cargo_type === 'valuable') cargo_pct = 0.08
  const bonus_cargo = Math.round(base * cargo_pct)

  const bonus_distance = distance_km > 800
    ? Math.round(base * 0.10)
    : 0

  // ── Kary ─────────────────────────────────────
  const penalty_damage = Math.round(damage_percent * 45)

  const penalty_fuel = fuel_used_liters
    ? Math.round(fuel_used_liters * fuel_price)
    : 0

  const penalty_fine = had_fine
    ? Math.max(50, Math.min(150, fine_amount))
    : 0

  // ── Wynik ─────────────────────────────────────
  const gross = Math.max(
    0,
    base
    + bonus_eco + bonus_no_damage + bonus_cargo + bonus_distance
    - penalty_damage - penalty_fuel - penalty_fine
  )

  const driver_share  = Math.round(gross * DRIVER_CUT)
  const company_share = gross - driver_share

  // ── Breakdown ─────────────────────────────────
  const breakdown: PayBreakdownItem[] = [
    { label: 'Baza',                 amount: base,           type: 'base'    },
  ]
  if (bonus_eco > 0)
    breakdown.push({ label: fuelPer100! < 7
      ? 'Bonus eko (< 7 l/100km)'
      : 'Bonus eko (< 9 l/100km)',   amount: bonus_eco,      type: 'bonus'   })
  if (bonus_no_damage > 0)
    breakdown.push({ label: 'Bonus zero uszkodzeń',          amount: bonus_no_damage, type: 'bonus' })
  if (bonus_cargo > 0)
    breakdown.push({ label: `Bonus cargo (${cargo_type})`,   amount: bonus_cargo,    type: 'bonus'   })
  if (bonus_distance > 0)
    breakdown.push({ label: 'Bonus dystans > 800 km',        amount: bonus_distance, type: 'bonus'   })
  if (penalty_damage > 0)
    breakdown.push({ label: `Kara uszkodzenia (${damage_percent}%)`, amount: -penalty_damage, type: 'penalty' })
  if (penalty_fuel > 0)
    breakdown.push({ label: `Paliwo (${fuel_used_liters}L × ${fuel_price} VTC€)`, amount: -penalty_fuel, type: 'penalty' })
  if (penalty_fine > 0)
    breakdown.push({ label: 'Mandat',                        amount: -penalty_fine,  type: 'penalty' })

  return {
    base, bonus_eco, bonus_no_damage, bonus_cargo, bonus_distance,
    penalty_damage, penalty_fuel, penalty_fine,
    gross, driver_share, company_share,
    breakdown,
  }
}
