import { createClient }     from '@/lib/supabase/server'
import { EventsClient }     from '@/components/events/EventsClient'
import { Calendar }         from 'lucide-react'
import { redirect }         from 'next/navigation'

export const metadata = { title: 'Wydarzenia' }
export const dynamic  = 'force-dynamic'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: events }, { data: member }] = await Promise.all([
    supabase
      .from('events')
      .select(`
        *,
        event_rsvp (
          member_id,
          members ( username, avatar_url )
        )
      `)
      .order('start_at', { ascending: true }),

    supabase
      .from('members')
      .select('id, username, rank, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-8">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border
                      border-amber-500/20 bg-amber-500/5 p-6 md:p-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64
                          bg-amber-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-amber-400
                          text-xs font-semibold mb-3">
            <Calendar className="w-3.5 h-3.5" />
            KALENDARZ WYDARZEŃ
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            Nadchodzące Events
          </h1>
          <p className="text-zinc-400">
            Konwoje, eventy punktowe i spotkania VTC
          </p>
        </div>
      </div>

      <EventsClient
        events={events ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}
