import { createClient } from '@/lib/supabase/server'
import { ShopClient }   from './ShopClient'
import { redirect }     from 'next/navigation'

export const metadata = { title: 'Sklep VTC' }
export const dynamic  = 'force-dynamic'

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [items, wallet, purchases] = await Promise.all([
    supabase
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })
      .then(r => r.data ?? []),

    supabase
      .from('wallets')
      .select('balance')
      .eq('member_id', user.id)
      .single()
      .then(r => r.data),

    supabase
      .from('shop_purchases')
      .select('item_id')
      .eq('member_id', user.id)
      .then(r => new Set((r.data ?? []).map(p => p.item_id))),
  ])

  return (
    <ShopClient
      items={items}
      balance={wallet?.balance ?? 0}
      memberId={user.id}
      ownedItemIds={[...purchases]}
    />
  )
}
