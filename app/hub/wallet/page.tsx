import { createClient } from '@/lib/supabase/server'
import { WalletClient } from './WalletClient'
import { redirect }     from 'next/navigation'

export const metadata = { title: 'Portfel — VTC' }
export const dynamic  = 'force-dynamic'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ✅ Szukaj member tak samo jak w /hub/page.tsx
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!member) redirect('/apply')

  const memberId = member.id  // ← używamy member.id, nie user.id

  const [wallet, transactions, fuelPrice, loans, deposits] = await Promise.all([
    supabase
      .from('wallets')
      .select('*')
      .eq('member_id', memberId)   // ✅ poprawione
      .single()
      .then(r => r.data),

    supabase
      .from('transactions')
      .select('*')
      .eq('member_id', memberId)   // ✅ poprawione
      .order('created_at', { ascending: false })
      .limit(50)
      .then(r => r.data ?? []),

    supabase
      .from('fuel_prices')
      .select('price, valid_until')
      .lte('valid_from', new Date().toISOString())
      .gte('valid_until', new Date().toISOString())
      .order('valid_from', { ascending: false })
      .limit(1)
      .single()
      .then(r => r.data),

    supabase
      .from('loans')
      .select('*')
      .eq('member_id', memberId)   // ✅ poprawione
      .eq('status', 'active')
      .then(r => r.data ?? []),

    supabase
      .from('deposits')
      .select('*')
      .eq('member_id', memberId)   // ✅ poprawione
      .eq('status', 'active')
      .then(r => r.data ?? []),
  ])

  return (
    <WalletClient
      wallet={wallet}
      transactions={transactions}
      fuelPrice={fuelPrice}
      loans={loans}
      deposits={deposits}
    />
  )
}