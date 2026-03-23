import type { LeaveType } from '@/types'

// ─── Job Pay ───────────────────────────────────────────────
export interface JobPayInput {
  distance_km:      number
  cargo_units:      number
  fuel_used_liters: number | null
  damage_percent:   number
  cargo_type:       'normal' | 'adr' | 'oversize' | 'valuable' | null
  had_fine:         boolean
  fine_amount:      number
  fuel_price:       number
}

export interface JobPayResult {
  base:            number
  bonus_eco:       number
  bonus_no_damage: number
  bonus_cargo:     number
  bonus_distance:  number
  penalty_damage:  number
  penalty_fuel:    number
  penalty_fine:    number
  gross:           number
  driver_share:    number
  company_share:   number
  breakdown:       PayBreakdownItem[]
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

  const base = Math.round(distance_km * 1.35 + cargo_units * 4)

  const fuelPer100 = fuel_used_liters && distance_km > 0
    ? (fuel_used_liters / distance_km) * 100
    : null

  let bonus_eco = 0
  if (fuelPer100 !== null) {
    if (fuelPer100 < 7)       bonus_eco = Math.round(base * 0.28)
    else if (fuelPer100 < 9)  bonus_eco = Math.round(base * 0.18)
  }

  const bonus_no_damage = damage_percent === 0
    ? Math.round(base * 0.12) : 0

  let cargo_pct = 0
  if (cargo_type === 'adr')      cargo_pct = 0.15
  if (cargo_type === 'oversize') cargo_pct = 0.12
  if (cargo_type === 'valuable') cargo_pct = 0.08
  const bonus_cargo = Math.round(base * cargo_pct)

  const bonus_distance = distance_km > 800
    ? Math.round(base * 0.10) : 0

  const penalty_damage = Math.round(damage_percent * 45)
  const penalty_fuel   = fuel_used_liters
    ? Math.round(fuel_used_liters * fuel_price) : 0
  const penalty_fine   = had_fine
    ? Math.max(50, Math.min(150, fine_amount)) : 0

  const gross = Math.max(
    0,
    base
    + bonus_eco + bonus_no_damage + bonus_cargo + bonus_distance
    - penalty_damage - penalty_fuel - penalty_fine,
  )

  const driver_share  = Math.round(gross * DRIVER_CUT)
  const company_share = gross - driver_share

  const breakdown: PayBreakdownItem[] = [
    { label: 'Baza', amount: base, type: 'base' },
  ]
  if (bonus_eco > 0)
    breakdown.push({
      label:  fuelPer100! < 7 ? 'Bonus eko (< 7 l/100km)' : 'Bonus eko (< 9 l/100km)',
      amount: bonus_eco,
      type:   'bonus',
    })
  if (bonus_no_damage > 0)
    breakdown.push({ label: 'Bonus zero uszkodzeń',        amount: bonus_no_damage, type: 'bonus'   })
  if (bonus_cargo > 0)
    breakdown.push({ label: `Bonus cargo (${cargo_type})`, amount: bonus_cargo,     type: 'bonus'   })
  if (bonus_distance > 0)
    breakdown.push({ label: 'Bonus dystans > 800 km',      amount: bonus_distance,  type: 'bonus'   })
  if (penalty_damage > 0)
    breakdown.push({ label: `Kara uszkodzenia (${damage_percent}%)`, amount: -penalty_damage, type: 'penalty' })
  if (penalty_fuel > 0)
    breakdown.push({ label: `Paliwo (${fuel_used_liters}L × ${fuel_price} VTC€)`, amount: -penalty_fuel, type: 'penalty' })
  if (penalty_fine > 0)
    breakdown.push({ label: 'Mandat', amount: -penalty_fine, type: 'penalty' })

  return {
    base, bonus_eco, bonus_no_damage, bonus_cargo, bonus_distance,
    penalty_damage, penalty_fuel, penalty_fine,
    gross, driver_share, company_share, breakdown,
  }
}

// ─── Weekly Leave Pay ──────────────────────────────────────
export const PAID_LEAVE_LIMIT = 21
export const SICK_LEAVE_LIMIT = 30
export const BASE_LEAVE_PAY   = 2000   // VTC€ tygodniowo

export interface WeeklyPayInput {
  base_weekly_pay: number
  leave_type:      LeaveType | null
  leave_days:      number
}

export interface WeeklyPayResult {
  gross:      number
  multiplier: number
  leave_type: LeaveType | null
  leave_days: number
  note:       string
}

export const LEAVE_PAY_MULTIPLIER: Record<LeaveType, number> = {
  paid:   1.00,
  sick:   0.80,
  unpaid: 0.00,
  forced: 0.00,
}

export const LEAVE_LABELS: Record<LeaveType, string> = {
  paid:   'Urlop płatny',
  sick:   'Zwolnienie L4',
  unpaid: 'Urlop bezpłatny',
  forced: 'Przymusowe wolne',
}

export const LEAVE_COLORS: Record<LeaveType, { color: string; bg: string; border: string }> = {
  paid:   { color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20'  },
  sick:   { color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  unpaid: { color: 'text-zinc-400',   bg: 'bg-zinc-400/10',   border: 'border-zinc-400/20'   },
  forced: { color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20'    },
}

export function calculateWeeklyLeavePay(input: WeeklyPayInput): WeeklyPayResult {
  const { base_weekly_pay, leave_type, leave_days } = input

  if (!leave_type || leave_days === 0) {
    return {
      gross: base_weekly_pay, multiplier: 1,
      leave_type: null, leave_days: 0, note: 'Brak urlopu',
    }
  }

  const workDays   = 7
  const activeDays = Math.min(leave_days, workDays)
  const multiplier = LEAVE_PAY_MULTIPLIER[leave_type]
  const workRatio  = (workDays - activeDays) / workDays
  const leaveRatio = activeDays / workDays
  const gross      = Math.round(
    base_weekly_pay * workRatio +
    base_weekly_pay * leaveRatio * multiplier,
  )

  return {
    gross,
    multiplier,
    leave_type,
    leave_days: activeDays,
    note: `${LEAVE_LABELS[leave_type]} — ${activeDays} ${activeDays === 1 ? 'dzień' : 'dni'} w tygodniu`,
  }
}
