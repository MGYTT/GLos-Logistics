'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LeaveType, LeaveStats } from '@/types'
import { PAID_LEAVE_LIMIT, SICK_LEAVE_LIMIT } from '@/lib/vtc/payCalculator'

export async function requestLeave(input: {
  type:       LeaveType
  start_date: string
  end_date:   string
  reason?:    string
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Brak autoryzacji' }

  try {
    if (input.type === 'forced') return { ok: false, error: 'Niedozwolony typ wniosku' }

    const start = new Date(input.start_date)
    const end   = new Date(input.end_date)
    if (end < start) return { ok: false, error: 'Data końca przed datą początku' }

    const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1

    if (input.type === 'paid') {
      const { data: used } = await supabase
        .rpc('get_paid_leave_days_used', { p_member_id: user.id })
      const usedDays = (used as number) ?? 0
      if (usedDays + days > PAID_LEAVE_LIMIT) {
        return {
          ok: false,
          error: `Przekraczasz limit urlopu płatnego (${PAID_LEAVE_LIMIT} dni/rok). Wykorzystano: ${usedDays} dni`,
        }
      }
    }

    if (input.type === 'sick') {
      const yearStart = `${new Date().getFullYear()}-01-01`
      const { data: sickLeaves } = await supabase
        .from('member_leaves')
        .select('start_date, end_date')
        .eq('member_id', user.id)
        .eq('type', 'sick')
        .in('status', ['approved', 'active', 'ended'])
        .gte('start_date', yearStart)

      const sickUsed = (sickLeaves ?? []).reduce((sum, l) => {
        const s = new Date(l.start_date)
        const e = new Date(l.end_date)
        return sum + Math.floor((e.getTime() - s.getTime()) / 86400000) + 1
      }, 0)

      if (sickUsed + days > SICK_LEAVE_LIMIT) {
        return {
          ok: false,
          error: `Przekraczasz limit L4 (${SICK_LEAVE_LIMIT} dni/rok). Wykorzystano: ${sickUsed} dni`,
        }
      }
    }

    const { data: conflict } = await supabase
      .from('member_leaves')
      .select('id')
      .eq('member_id', user.id)
      .in('status', ['pending', 'approved', 'active'])
      .lte('start_date', input.end_date)
      .gte('end_date',   input.start_date)
      .limit(1)
      .maybeSingle()

    if (conflict) return { ok: false, error: 'Masz już urlop w tym terminie' }

    const { error } = await supabase.from('member_leaves').insert({
      member_id:  user.id,
      type:       input.type,
      status:     input.type === 'sick' ? 'approved' : 'pending',
      start_date: input.start_date,
      end_date:   input.end_date,
      reason:     input.reason ?? null,
    })

    if (error) return { ok: false, error: error.message }

    revalidatePath('/hub/profile')
    return { ok: true }

  } catch (e) {
    console.error('[requestLeave]', e)
    return { ok: false, error: 'Nieoczekiwany błąd' }
  }
}

export async function cancelLeave(
  leaveId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Brak autoryzacji' }

  try {
    const { data: leave } = await supabase
      .from('member_leaves')
      .select('member_id, status')
      .eq('id', leaveId)
      .single()

    if (!leave)                        return { ok: false, error: 'Nie znaleziono wniosku' }
    if (leave.member_id !== user.id)   return { ok: false, error: 'Brak uprawnień'          }
    if (leave.status !== 'pending')    return { ok: false, error: 'Możesz anulować tylko oczekujące wnioski' }

    const { error } = await supabase
      .from('member_leaves')
      .update({ status: 'rejected' })
      .eq('id', leaveId)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/hub/profile')
    return { ok: true }

  } catch (e) {
    console.error('[cancelLeave]', e)
    return { ok: false, error: 'Nieoczekiwany błąd' }
  }
}

export async function getMyLeaveStats(): Promise<LeaveStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const empty: LeaveStats = {
    paid_used: 0, paid_limit: PAID_LEAVE_LIMIT, paid_remaining: PAID_LEAVE_LIMIT,
    sick_used: 0, sick_limit: SICK_LEAVE_LIMIT, active_leave: null,
  }
  if (!user) return empty

  const yearStart = `${new Date().getFullYear()}-01-01`
  const today     = new Date().toISOString().split('T')[0]

  const [{ data: paidUsed }, { data: sickLeaves }, { data: active }] = await Promise.all([
    supabase.rpc('get_paid_leave_days_used', { p_member_id: user.id }),
    supabase.from('member_leaves').select('start_date, end_date')
      .eq('member_id', user.id).eq('type', 'sick')
      .in('status', ['approved', 'active', 'ended']).gte('start_date', yearStart),
    supabase.from('member_leaves').select('*')
      .eq('member_id', user.id).in('status', ['approved', 'active'])
      .lte('start_date', today).gte('end_date', today)
      .order('start_date', { ascending: false }).limit(1).maybeSingle(),
  ])

  const paid     = (paidUsed as number) ?? 0
  const sickUsed = (sickLeaves ?? []).reduce((sum, l) => {
    return sum + Math.floor(
      (new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000
    ) + 1
  }, 0)

  return {
    paid_used:      paid,
    paid_limit:     PAID_LEAVE_LIMIT,
    paid_remaining: Math.max(0, PAID_LEAVE_LIMIT - paid),
    sick_used:      sickUsed,
    sick_limit:     SICK_LEAVE_LIMIT,
    active_leave:   active ?? null,
  }
}
