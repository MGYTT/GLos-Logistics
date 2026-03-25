'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LeaveType } from '@/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: admin } = await supabase
    .from('members')
    .select('rank, username, id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)  // ← naprawione
    .single()

  if (!admin || !['Owner', 'Manager'].includes(admin.rank)) return null
  return { supabase, admin }
}

export async function reviewLeave(
  leaveId: string,
  action:  'approved' | 'rejected',
  note?:   string,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAdmin()
  if (!ctx) return { ok: false, error: 'Brak uprawnień' }
  const { supabase, admin } = ctx

  try {
    const { data: leave } = await supabase
      .from('member_leaves')
      .select('status, type')
      .eq('id', leaveId)
      .single()

    if (!leave) return { ok: false, error: 'Nie znaleziono wniosku' }
    if (leave.status !== 'pending') return { ok: false, error: 'Wniosek nie jest w statusie oczekującym' }

    const { error } = await supabase
      .from('member_leaves')
      .update({
        status:      action,
        admin_note:  note ?? null,
        approved_by: admin.id,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', leaveId)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/admin/leaves')
    revalidatePath('/admin')
    revalidatePath('/hub/profile')
    revalidatePath('/hub')
    return { ok: true }

  } catch (e) {
    console.error('[reviewLeave]', e)
    return { ok: false, error: 'Nieoczekiwany błąd' }
  }
}

export async function forceLeave(
  memberId:   string,
  start_date: string,
  end_date:   string,
  note?:      string,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAdmin()
  if (!ctx) return { ok: false, error: 'Brak uprawnień' }
  const { supabase, admin } = ctx

  try {
    const start = new Date(start_date)
    const end   = new Date(end_date)
    if (end < start) return { ok: false, error: 'Data końca przed datą początku' }

    const { data: conflict } = await supabase
      .from('member_leaves')
      .select('id')
      .eq('member_id', memberId)
      .in('status', ['pending', 'approved', 'active'])
      .lte('start_date', end_date)
      .gte('end_date',   start_date)
      .limit(1)
      .maybeSingle()

    if (conflict) return { ok: false, error: 'Kierowca ma już urlop w tym terminie' }

    const { error } = await supabase.from('member_leaves').insert({
      member_id:   memberId,
      type:        'forced' as LeaveType,
      status:      'approved',
      start_date,
      end_date,
      reason:      note ?? 'Przymusowe wolne nałożone przez administrację',
      approved_by: admin.id,
    })

    if (error) return { ok: false, error: error.message }

    revalidatePath('/admin/leaves')
    revalidatePath('/admin/members')
    revalidatePath('/hub/profile')
    revalidatePath('/hub')
    return { ok: true }

  } catch (e) {
    console.error('[forceLeave]', e)
    return { ok: false, error: 'Nieoczekiwany błąd' }
  }
}
