'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nie jesteś zalogowany')

  const { data: member } = await supabase
    .from('members')
    .select('rank')
    .eq('id', user.id)
    .single()

  if (member?.rank !== 'Owner') throw new Error('Brak uprawnień')
  return { supabase, userId: user.id }
}

export async function saveVtcInfo(formData: FormData) {
  const { supabase, userId } = await requireOwner()

  const { error } = await supabase
    .from('vtc_settings')
    .update({
      vtc_name:        (formData.get('vtc_name')        as string).trim(),
      vtc_tag:         (formData.get('vtc_tag')         as string).trim(),
      vtc_description: (formData.get('vtc_description') as string).trim(),
      vtc_founded:     (formData.get('vtc_founded')     as string) || null,
      vtc_website:     (formData.get('vtc_website')     as string).trim() || null,
      vtc_discord:     (formData.get('vtc_discord')     as string).trim() || null,
      vtc_truckersmp:  (formData.get('vtc_truckersmp')  as string).trim() || null,
      updated_at:      new Date().toISOString(),
      updated_by:      userId,
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')  // update all rows

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
  revalidatePath('/')
}

export async function saveRecruitment(formData: FormData) {
  const { supabase, userId } = await requireOwner()

  const { error } = await supabase
    .from('vtc_settings')
    .update({
      recruitment_open:      formData.get('recruitment_open') === 'true',
      recruitment_min_hours: Number(formData.get('recruitment_min_hours')) || 100,
      recruitment_message:   (formData.get('recruitment_message') as string).trim(),
      updated_at:            new Date().toISOString(),
      updated_by:            userId,
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
  revalidatePath('/recruitment')
}

export async function saveFinance(formData: FormData) {
  const { supabase, userId } = await requireOwner()

  const { error } = await supabase
    .from('vtc_settings')
    .update({
      starting_balance:   Number(formData.get('starting_balance'))   || 1000,
      max_loan:           Number(formData.get('max_loan'))           || 10000,
      loan_interest_rate: Number(formData.get('loan_interest_rate')) / 100 || 0.08,
      updated_at:         new Date().toISOString(),
      updated_by:         userId,
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}

export async function saveSystem(formData: FormData) {
  const { supabase, userId } = await requireOwner()

  const { error } = await supabase
    .from('vtc_settings')
    .update({
      maintenance_mode:    formData.get('maintenance_mode') === 'true',
      maintenance_message: (formData.get('maintenance_message') as string).trim(),
      updated_at:          new Date().toISOString(),
      updated_by:          userId,
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}
