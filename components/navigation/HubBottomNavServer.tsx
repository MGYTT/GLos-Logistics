import { createClient } from '@/lib/supabase/server'
import { HubBottomNav } from './HubBottomNav'

export async function HubBottomNavServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let walletAlert = false
  if (user) {
    const { data } = await supabase
      .from('loans')
      .select('id')
      .eq('member_id', user.id)
      .in('status', ['active', 'overdue'])
      .limit(1)
      .maybeSingle()

    walletAlert = !!data
  }

  return <HubBottomNav walletAlert={walletAlert} />
}
