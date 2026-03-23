import { createClient }                from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect }                    from 'next/navigation'
import { LeavesAdminClient }           from './LeavesAdminClient'
import type {
  MemberLeave, LeaveType, LeaveStatus, MemberRank,
} from '@/types'

export const metadata = { title: 'Urlopy | Admin' }
export const dynamic  = 'force-dynamic'

// ─── Klient service_role — omija RLS ──────────────────────
function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// ─── Typ surowy z Supabase ─────────────────────────────────
interface RawLeave {
  id:          string
  member_id:   string
  type:        string
  status:      string
  start_date:  string
  end_date:    string
  reason:      string | null
  admin_note:  string | null
  approved_by: string | null
  created_at:  string
  updated_at:  string
  member:
    | { username: string; avatar_url: string | null; rank: string }[]
    | { username: string; avatar_url: string | null; rank: string }
    | null
}

// ─── Normalizator ──────────────────────────────────────────
function normalizeLeave(raw: RawLeave): MemberLeave {
  const rawMember = Array.isArray(raw.member)
    ? (raw.member[0] ?? null)
    : raw.member

  return {
    id:          raw.id,
    member_id:   raw.member_id,
    type:        raw.type    as LeaveType,
    status:      raw.status  as LeaveStatus,
    start_date:  raw.start_date,
    end_date:    raw.end_date,
    reason:      raw.reason,
    admin_note:  raw.admin_note,
    approved_by: raw.approved_by,
    created_at:  raw.created_at,
    updated_at:  raw.updated_at,
    member:      rawMember
      ? {
          username:   rawMember.username,
          avatar_url: rawMember.avatar_url,
          rank:       rawMember.rank as MemberRank,   // ← kluczowe rzutowanie
        }
      : null,
  }
}

export default async function AdminLeavesPage() {
  // ── Auth ─────────────────────────────────────────────────
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: self } = await supabase
    .from('members')
    .select('rank')
    .eq('id', user.id)
    .single()

  if (!self || !['Owner', 'Manager'].includes(self.rank)) {
    redirect('/hub')
  }

  // ── Dane przez service_role ───────────────────────────────
  const admin = getAdminClient()

  const { data: rawLeaves, error: leavesError } = await admin
    .from('member_leaves')
    .select(`
      id,
      member_id,
      type,
      status,
      start_date,
      end_date,
      reason,
      admin_note,
      approved_by,
      created_at,
      updated_at,
      member:members (
        username,
        avatar_url,
        rank
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (leavesError) {
    console.error('[AdminLeaves] fetch error:', leavesError.message)
  }

  const leaves: MemberLeave[] = (rawLeaves as RawLeave[] ?? []).map(normalizeLeave)

  // ── Członkowie do formularza forced ──────────────────────
  const { data: members } = await admin
    .from('members')
    .select('id, username, avatar_url, rank')
    .eq('is_banned', false)
    .order('username')

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
      members={members ?? []}
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
