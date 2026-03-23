import { createClient }   from '@/lib/supabase/server'
import { redirect }       from 'next/navigation'
import { LeavesAdminClient } from './LeavesAdminClient'

export const metadata = { title: 'Urlopy | Admin' }
export const dynamic  = 'force-dynamic'

export default async function AdminLeavesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: self } = await supabase
    .from('members')
    .select('rank')
    .eq('id', user.id)
    .single()

  if (!self || !['Owner', 'Manager'].includes(self.rank)) redirect('/hub')

  // Wszystkie urlopy z danymi członków
  const { data: rawLeaves } = await supabase
    .from('member_leaves')
    .select(`
      id, member_id, type, status,
      start_date, end_date, reason,
      admin_note, approved_by, created_at, updated_at,
      member:members (
        username, avatar_url, rank
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  // Normalizacja member[] → member | null
  const leaves = (rawLeaves ?? []).map(l => ({
    ...l,
    member: Array.isArray(l.member) ? (l.member[0] ?? null) : l.member,
  }))

  // Wszyscy aktywni członkowie (do formularza forced)
  const { data: members } = await supabase
    .from('members')
    .select('id, username, avatar_url, rank')
    .eq('is_banned', false)
    .order('username')

  // Statystyki do dashboardu
  const today      = new Date().toISOString().split('T')[0]
  const activeNow  = leaves.filter(l =>
    ['approved', 'active'].includes(l.status) &&
    l.start_date <= today && l.end_date >= today
  )
  const pending    = leaves.filter(l => l.status === 'pending')
  const thisMonth  = leaves.filter(l => {
    const m = new Date().toISOString().slice(0, 7)
    return l.start_date.startsWith(m)
  })

  return (
    <LeavesAdminClient
      leaves={leaves}
      members={members ?? []}
      adminId={user.id}
      stats={{
        activeNow:  activeNow.length,
        pending:    pending.length,
        thisMonth:  thisMonth.length,
        total:      leaves.length,
      }}
    />
  )
}
