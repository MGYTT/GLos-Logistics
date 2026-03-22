'use server'

import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient }                from '@/lib/supabase/server'
import { revalidatePath }              from 'next/cache'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: member } = await supabase
    .from('members')
    .select('rank')
    .eq('id', user.id)
    .single()

  if (!['Owner', 'Manager'].includes(member?.rank ?? ''))
    throw new Error('Forbidden')

  return user
}

// ── Usuń job ──────────────────────────────────
export async function deleteJob(jobId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin()
    const { error } = await admin.from('jobs').delete().eq('id', jobId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/jobs')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// ── Usuń wiele jobów ──────────────────────────
export async function deleteJobs(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin()
    const { error } = await admin.from('jobs').delete().in('id', ids)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/jobs')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// ── Edytuj job ────────────────────────────────
export async function updateJob(
  jobId: string,
  patch: {
    cargo?:          string
    origin_city?:    string
    destination_city?: string
    distance_km?:    number
    income?:         number
    damage_percent?: number
    status?:         string
    notes?:          string
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin()
    const { error } = await admin
      .from('jobs')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', jobId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/jobs')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}
