'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adjustBalance(
  memberId: string,
  amount: number,
  description?: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: wallet, error: fetchErr } = await supabase
    .from('wallets')
    .select('balance, total_earned, total_spent')
    .eq('member_id', memberId)
    .single()

  if (fetchErr || !wallet) return { ok: false, error: 'Nie znaleziono portfela' }

  const newBalance   = wallet.balance + amount
  const newEarned    = amount > 0 ? wallet.total_earned + amount : wallet.total_earned
  const newSpent     = amount < 0 ? wallet.total_spent  + Math.abs(amount) : wallet.total_spent

  if (newBalance < 0) return { ok: false, error: 'Niewystarczające saldo' }

  const { error: updateErr } = await supabase
    .from('wallets')
    .update({ balance: newBalance, total_earned: newEarned, total_spent: newSpent })
    .eq('member_id', memberId)

  if (updateErr) return { ok: false, error: updateErr.message }

  await supabase.from('wallet_transactions').insert({
    member_id:     memberId,
    type:          amount >= 0 ? 'manual_credit' : 'manual_debit',
    amount,
    balance_after: newBalance,
    description:   description ?? null,
  })

  revalidatePath('/admin/wallet')
  return { ok: true }
}

export async function transferBalance(
  fromId: string,
  toId: string,
  amount: number,
  description?: string,
): Promise<{ ok: boolean; error?: string }> {
  const debit = await adjustBalance(fromId, -amount, description ?? `Transfer → ${toId}`)
  if (!debit.ok) return debit

  const credit = await adjustBalance(toId, amount, description ?? `Transfer ← ${fromId}`)
  if (!credit.ok) {
    // rollback — cofnij debet
    await adjustBalance(fromId, amount, 'Rollback transferu')
    return credit
  }

  revalidatePath('/admin/wallet')
  return { ok: true }
}

export async function resetWallet(
  memberId: string,
  description?: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('member_id', memberId)
    .single()

  const { error } = await supabase
    .from('wallets')
    .update({ balance: 0, total_earned: 0, total_spent: 0 })
    .eq('member_id', memberId)

  if (error) return { ok: false, error: error.message }

  if (wallet) {
    await supabase.from('wallet_transactions').insert({
      member_id:     memberId,
      type:          'manual_debit',
      amount:        -wallet.balance,
      balance_after: 0,
      description:   description ?? 'Reset portfela przez admina',
    })
  }

  revalidatePath('/admin/wallet')
  return { ok: true }
}

export async function setFuelPrice(
  price: number,
  validDays: number,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + validDays)

  const { error } = await supabase
    .from('fuel_prices')
    .insert({
      price_per_liter: price,
      valid_until:     validUntil.toISOString(),
    })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/wallet')
  return { ok: true }
}
