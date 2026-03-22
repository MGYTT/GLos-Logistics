import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import { Wrench, X }    from 'lucide-react'

export async function MaintenanceBanner() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await supabase
    .from('members')
    .select('rank')
    .eq('id', user.id)
    .single()

  if (member?.rank !== 'Owner') return null

  const { data: settings } = await supabase
    .from('vtc_settings')
    .select('maintenance_mode')
    .single()

  if (!settings?.maintenance_mode) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]
                    bg-amber-500 text-black px-4 py-2.5
                    flex items-center justify-center gap-3 text-sm font-bold">
      <Wrench className="w-4 h-4 shrink-0" />
      <span>
        Tryb konserwacji jest aktywny — użytkownicy widzą stronę przerwy technicznej
      </span>
      <Link
        href="/admin/settings"
        className="underline hover:no-underline ml-2 font-black"
      >
        Wyłącz →
      </Link>
    </div>
  )
}
