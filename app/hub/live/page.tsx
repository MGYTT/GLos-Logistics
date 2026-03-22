import { createClient } from '@/lib/supabase/server'
import { LiveTrackerClient } from './LiveTrackerClient'
import { Radio } from 'lucide-react'

export const metadata = { title: 'Na żywo — VTC' }
export const dynamic  = 'force-dynamic'

export default async function LivePage() {
  const supabase = await createClient()

  const { data: positions } = await supabase
    .from('driver_positions')
    .select(`
      *,
      member:member_id (
        id, username, avatar_url, rank
      )
    `)
    .order('updated_at', { ascending: false })

  const { data: activeJobs } = await supabase
    .from('jobs')
    .select(`
      *,
      member:member_id (
        id, username, avatar_url, rank
      )
    `)
    .eq('status', 'taken')

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center
                          justify-center">
            <Radio className="w-5 h-5 text-green-400" />
          </div>
          {/* Pulsujący dot */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full
                             rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Na żywo</h1>
          <p className="text-sm text-zinc-500">
            Aktualna aktywność kierowców VTC
          </p>
        </div>
      </div>

      <LiveTrackerClient
        initialPositions={positions ?? []}
        initialJobs={activeJobs ?? []}
      />
    </div>
  )
}
