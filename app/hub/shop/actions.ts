'use server'

import { createClient as adminClient } from '@supabase/supabase-js'
import { createClient }                from '@/lib/supabase/server'
import { revalidatePath }              from 'next/cache'

const supabase = adminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function buyItem(itemId: string) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { ok: false, error: 'Nie jesteś zalogowany' }

  // ✅ pobierz member.id zamiast używać user.id
  const { data: member } = await authClient
    .from('members')
    .select('id')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!member) return { ok: false, error: 'Nie znaleziono profilu kierowcy' }

  const { data, error } = await supabase.rpc('purchase_shop_item', {
    p_member_id: member.id,  // ✅ poprawione
    p_item_id:   itemId,
  })

  if (error) return { ok: false, error: error.message }

  const result = data as { ok: boolean; error?: string; new_balance?: number; item_name?: string }

  if (!result.ok) {
    const msg: Record<string, string> = {
      item_not_found:     'Przedmiot nie istnieje',
      out_of_stock:       'Brak w magazynie',
      insufficient_funds: 'Niewystarczające saldo VTC€',
    }
    return { ok: false, error: msg[result.error!] ?? result.error }
  }

  revalidatePath('/hub/shop')
  revalidatePath('/hub/wallet')
  return { ok: true, newBalance: result.new_balance, itemName: result.item_name }
}