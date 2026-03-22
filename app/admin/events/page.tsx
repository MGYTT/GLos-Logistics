import { createClient }      from '@/lib/supabase/server'
import { EventsAdminPanel }  from './EventsAdminPanel'
import { Calendar }          from 'lucide-react'

export const metadata = { title: 'Admin — Wydarzenia' }
export const dynamic  = 'force-dynamic'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*, event_rsvp(member_id, members(username, avatar_url))')
    .order('start_at', { ascending: false })

  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border
                        border-amber-500/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Zarządzanie Wydarzeniami</h1>
          <p className="text-zinc-500 text-sm">
            {events?.length ?? 0} wydarzeń w bazie
          </p>
        </div>
      </div>
      <EventsAdminPanel events={events ?? []} />
    </div>
  )
}
