import { LiveMap } from '@/components/map/LiveMap'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Live Mapa' }

export default async function MapPage() {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('members')
    .select('id, username, avatar_url, rank, truckershub_id')
    .eq('is_banned', false)

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <LiveMap members={members ?? []} />
    </div>
  )
}
