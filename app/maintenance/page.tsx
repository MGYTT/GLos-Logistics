import { createClient } from '@/lib/supabase/server'
import { MaintenancePage } from '@/components/MaintenancePage'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Przerwa techniczna' }

export default async function Maintenance() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('vtc_settings')
    .select('vtc_name, vtc_discord, maintenance_message')
    .single()

  // Jeśli konserwacja wyłączona — przekieruj na główną
  const { data: mode } = await supabase
    .from('vtc_settings')
    .select('maintenance_mode')
    .single()

  if (!mode?.maintenance_mode) {
    const { redirect } = await import('next/navigation')
    redirect('/')
  }

  return (
    <MaintenancePage
      vtcName={settings?.vtc_name        ?? 'VTC'}
      discord={settings?.vtc_discord     ?? null}
      message={settings?.maintenance_message ?? 'Trwają prace techniczne. Wróć za chwilę.'}
    />
  )
}
