import { createClient }   from '@/lib/supabase/server'
import { redirect }       from 'next/navigation'
import { LeavesClient }   from './LeavesClient'

export const metadata = { title: 'Urlopy' }

export default async function LeavesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('id, username, rank')
    .eq('id', user.id)
    .single()

  if (!member) redirect('/apply')

  const { data: leaves } = await supabase
    .from('member_leaves')
    .select('*')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })

  return (
    <LeavesClient
      member={member}
      leaves={leaves ?? []}
    />
  )
}
