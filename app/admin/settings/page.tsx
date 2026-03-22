import { createClient }    from '@/lib/supabase/server'
import { SettingsClient }  from './SettingsClient'
import { Shield }          from 'lucide-react'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Ustawienia — Admin' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('vtc_settings')
    .select('*')
    .single()

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Nagłówek */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700
                        flex items-center justify-center">
          <Shield className="w-5 h-5 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Ustawienia</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Konfiguracja VTC, rekrutacji i systemu
          </p>
        </div>
      </div>

      <SettingsClient settings={settings} />
    </div>
  )
}
