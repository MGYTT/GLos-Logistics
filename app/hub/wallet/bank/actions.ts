'use server'

import { createClient as adminClient } from '@supabase/supabase-js'
import { createClient }                from '@/lib/supabase/server'
import { revalidatePath }              from 'next/cache'

const admin = adminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// ✅ Zwraca member.id z tabeli members (nie user.id z auth)
async function getMemberId() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null

  const { data: member } = await sb
    .from('members')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .maybeSingle()

  return member?.id ?? null
}

// ─── Pożyczki ──────────────────────────────────
export async function takeLoan(amount: number) {
  const memberId = await getMemberId()
  if (!memberId) return { ok: false, error: 'Nie jesteś zalogowany' }

  const { data, error } = await admin.rpc('take_loan', {
    p_member_id: memberId,
    p_amount:    amount,
  })
  if (error) return { ok: false, error: error.message }

  const r = data as any
  if (!r.ok) {
    const msgs: Record<string, string> = {
      amount_out_of_range: 'Kwota musi być między 500 a 10 000 VTC€',
      loan_already_active: 'Masz już aktywną pożyczkę — spłać ją najpierw',
    }
    return { ok: false, error: msgs[r.error] ?? r.error }
  }

  revalidatePath('/hub/wallet')
  return { ok: true, data: r }
}

export async function repayLoan(loanId: string) {
  const memberId = await getMemberId()
  if (!memberId) return { ok: false, error: 'Nie jesteś zalogowany' }

  const { data, error } = await admin.rpc('repay_loan', {
    p_member_id: memberId,
    p_loan_id:   loanId,
  })
  if (error) return { ok: false, error: error.message }

  const r = data as any
  if (!r.ok) {
    const msgs: Record<string, string> = {
      loan_not_found:     'Pożyczka nie istnieje',
      insufficient_funds: 'Niewystarczające saldo VTC€',
    }
    return { ok: false, error: msgs[r.error] ?? r.error }
  }

  revalidatePath('/hub/wallet')
  return { ok: true, data: r }
}

// ─── Lokaty ────────────────────────────────────
export async function openDeposit(amount: number, days: 7 | 14 | 30) {
  const memberId = await getMemberId()
  if (!memberId) return { ok: false, error: 'Nie jesteś zalogowany' }

  const { data, error } = await admin.rpc('open_deposit', {
    p_member_id: memberId,
    p_amount:    amount,
    p_days:      days,
  })
  if (error) return { ok: false, error: error.message }

  const r = data as any
  if (!r.ok) {
    const msgs: Record<string, string> = {
      amount_out_of_range: 'Kwota musi być między 100 a 50 000 VTC€',
      invalid_period:      'Nieprawidłowy okres lokaty',
      insufficient_funds:  'Niewystarczające saldo VTC€',
    }
    return { ok: false, error: msgs[r.error] ?? r.error }
  }

  revalidatePath('/hub/wallet')
  return { ok: true, data: r }
}

export async function withdrawDeposit(depositId: string) {
  const memberId = await getMemberId()
  if (!memberId) return { ok: false, error: 'Nie jesteś zalogowany' }

  const { data, error } = await admin.rpc('withdraw_deposit', {
    p_member_id:  memberId,
    p_deposit_id: depositId,
  })
  if (error) return { ok: false, error: error.message }

  const r = data as any
  if (!r.ok) {
    return { ok: false, error: r.error === 'deposit_not_found'
      ? 'Lokata nie istnieje' : r.error }
  }

  revalidatePath('/hub/wallet')
  return { ok: true, data: r }
}