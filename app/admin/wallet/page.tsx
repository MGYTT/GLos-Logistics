import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { AdminWalletClient } from './AdminWalletClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Portfele VTC | Admin',
}

// ─── Typy surowe z Supabase (member jako tablica) ──────────
interface RawWalletRow {
  member_id:    string
  balance:      number
  total_earned: number
  total_spent:  number
  updated_at:   string
  member: {
    id:         string
    username:   string
    avatar_url: string | null
    rank:       string
    is_banned:  boolean
  }[] | null
}

interface RawTransaction {
  id:            string
  member_id:     string
  type:          string
  amount:        number
  balance_after: number | null
  description:   string | null
  created_at:    string
  member: {
    username:   string
    avatar_url: string | null
    rank:       string
  }[] | null
}

// ─── Typy znormalizowane (member jako obiekt | null) ───────
interface WalletRow {
  member_id:    string
  balance:      number
  total_earned: number
  total_spent:  number
  updated_at:   string
  member: {
    id:         string
    username:   string
    avatar_url: string | null
    rank:       string
    is_banned:  boolean
  } | null
}

interface Transaction {
  id:            string
  member_id:     string
  type:          string
  amount:        number
  balance_after: number | null
  description:   string | null
  created_at:    string
  member: {
    username:   string
    avatar_url: string | null
    rank:       string
  } | null
}

// ─── Normalizatory ─────────────────────────────────────────
function normalizeWallet(raw: RawWalletRow): WalletRow {
  return {
    ...raw,
    member: Array.isArray(raw.member)
      ? (raw.member[0] ?? null)
      : raw.member,
  }
}

function normalizeTransaction(raw: RawTransaction): Transaction {
  return {
    ...raw,
    member: Array.isArray(raw.member)
      ? (raw.member[0] ?? null)
      : raw.member,
  }
}

export default async function AdminWalletPage() {
  const supabase = await createClient()

  // ── Auth guard ─────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: self } = await supabase
    .from('members')
    .select('rank')
    .eq('id', user.id)
    .single()

  if (!self || !['Owner', 'Manager'].includes(self.rank)) {
    redirect('/hub')
  }

  // ── Portfele ───────────────────────────────────────────
  const { data: rawWallets, error: walletsError } = await supabase
    .from('wallets')
    .select(`
      member_id,
      balance,
      total_earned,
      total_spent,
      updated_at,
      member:members (
        id,
        username,
        avatar_url,
        rank,
        is_banned
      )
    `)
    .order('balance', { ascending: false })
    .returns<RawWalletRow[]>()

  if (walletsError) {
    console.error('[AdminWallet] wallets fetch error:', walletsError.message)
  }

  // ── Transakcje ─────────────────────────────────────────
  const { data: rawTransactions, error: txError } = await supabase
    .from('wallet_transactions')
    .select(`
      id,
      member_id,
      type,
      amount,
      balance_after,
      description,
      created_at,
      member:members (
        username,
        avatar_url,
        rank
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<RawTransaction[]>()

  if (txError) {
    console.error('[AdminWallet] transactions fetch error:', txError.message)
  }

  // ── Cena paliwa ────────────────────────────────────────
  const { data: fuelRow } = await supabase
    .from('fuel_prices')
    .select('price_per_liter, valid_until')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Normalizacja ───────────────────────────────────────
  const wallets      = (rawWallets      ?? []).map(normalizeWallet)
  const transactions = (rawTransactions ?? []).map(normalizeTransaction)

  // ── Statystyki ─────────────────────────────────────────
  const totalBalance = wallets.reduce((s, w) => s + (w.balance      ?? 0), 0)
  const totalEarned  = wallets.reduce((s, w) => s + (w.total_earned ?? 0), 0)
  const totalSpent   = wallets.reduce((s, w) => s + (w.total_spent  ?? 0), 0)

  return (
    <AdminWalletClient
      wallets={wallets}
      recentTransactions={transactions}
      stats={{ totalBalance, totalEarned, totalSpent }}
      currentFuel={fuelRow ?? null}
      adminId={user.id}
    />
  )
}
