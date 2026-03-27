import { createClient } from '@/lib/supabase/server'
import { JobsBoard }    from '@/components/jobs/JobsBoard'
import { redirect }     from 'next/navigation'

export const metadata = { title: 'Zlecenia' }
export const dynamic  = 'force-dynamic'

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: jobs }, { data: member }] = await Promise.all([
    supabase
      .from('jobs')
      .select(`
        *,
        creator:created_by (
          id, username, avatar_url, rank
        ),
        taker:taken_by (
          id, username, avatar_url
        )
      `)
      // FIX: nie filtruj po statusie — pokaż wszystkie (open, taken, completed, cancelled)
      .order('created_at', { ascending: false })
      .limit(200),

    supabase
      .from('members')
      .select('id, username, rank')
      .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
      .maybeSingle(),
  ])

  if (!member) redirect('/apply')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Tablica zleceń</h1>
          <p className="text-zinc-500 mt-1">Dostępne trasy dla kierowców VTC</p>
        </div>
      </div>
      <JobsBoard jobs={jobs ?? []} currentUser={member} />
    </div>
  )
}
