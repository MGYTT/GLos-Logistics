import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BridgeDownload } from '@/components/bridge/BridgeDownload'

export const metadata = { title: 'ETS2 Bridge' }

export default async function BridgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('id, username, api_key')
    .eq('id', user.id)
    .single()

  if (!member) redirect('/apply')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-10">
      <BridgeDownload member={member} />
    </div>
  )
}
