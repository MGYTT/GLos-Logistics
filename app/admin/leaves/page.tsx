import { createClient }                from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect }                    from 'next/navigation'
import { LeavesAdminClient }           from './LeavesAdminClient'
import type { LeaveType, LeaveStatus, MemberRank, MemberLeave } from '@/types'

export const metadata = { title: 'Urlopy | Admin' }
export const dynamic  = 'force-dynamic'

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export default async function AdminLeavesPage() {
  // ── Auth ─────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: self } = await supabase
    .from('members')
    .select('rank')
    .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
    .single()

  if (!self || !['Owner', 'Manager'].includes(self.rank)) {
    redirect('/hub')
  }

  // ── Dane przez service_role ───────────────────────────────
  const admin = getAdminClient()

  // Pobierz leaves i members osobno — unikamy problemów z JOIN
  const [{ data: rawLeaves, error: leavesError }, { data: membersData }] =
    await Promise.all([
      admin
        .from('member_leaves')
        .select('id, member_id, type, status, start_date, end_date, reason, admin_note, approved_by, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(200),
      admin
        .from('members')
        .select('id, username, avatar_url, rank')
        .eq('is_banned', false)
        .order('username'),
    ])

  if (leavesError) {
    console.error('[AdminLeaves] fetch error:', leavesError.message)
  }

  // Mapa members po id — O(1) lookup
  const membersMap = Object.fromEntries(
    (membersData ?? []).map(m => [m.id, m])
  )

  // Mapuj leaves — dołącz member ręcznie
  const leaves: MemberLeave[] = (rawLeaves ?? []).map(raw => ({
    id:          raw.id,
    member_id:   raw.member_id,
    type:        raw.type        as LeaveType,
    status:      raw.status      as LeaveStatus,
    start_date:  raw.start_date,
    end_date:    raw.end_date,
    reason:      raw.reason      ?? null,
    admin_note:  raw.admin_note  ?? null,
    approved_by: raw.approved_by ?? null,
    created_at:  raw.created_at,
    updated_at:  raw.updated_at,
    member: membersMap[raw.member_id]
      ? {
          username:   membersMap[raw.member_id].username,
          avatar_url: membersMap[raw.member_id].avatar_url ?? null,
          rank:       membersMap[raw.member_id].rank as MemberRank,
        }
      : null,
  }))

  // ── Statystyki ────────────────────────────────────────────
  const today           = new Date().toISOString().split('T')[0]
  const thisMonthPrefix = new Date().toISOString().slice(0, 7)

  const activeNow = leaves.filter(l =>
    ['approved', 'active'].includes(l.status) &&
    l.start_date <= today &&
    l.end_date   >= today,
  )

  const pending   = leaves.filter(l => l.status === 'pending')
  const thisMonth = leaves.filter(l => l.start_date.startsWith(thisMonthPrefix))

  const byType = {
    paid:   leaves.filter(l => l.type === 'paid'   && l.status !== 'rejected').length,
    sick:   leaves.filter(l => l.type === 'sick'   && l.status !== 'rejected').length,
    unpaid: leaves.filter(l => l.type === 'unpaid' && l.status !== 'rejected').length,
    forced: leaves.filter(l => l.type === 'forced').length,
  }

  return (
    <LeavesAdminClient
      leaves={leaves}
      members={membersData ?? []}
      adminId={user.id}
      stats={{
        activeNow:  activeNow.length,
        pending:    pending.length,
        thisMonth:  thisMonth.length,
        total:      leaves.length,
        byType,
      }}
    />
  )
}
