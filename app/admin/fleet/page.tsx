import { createClient } from '@/lib/supabase/server'
import { FleetAdminPanel } from './FleetAdminPanel'

export const metadata = { title: 'Admin – Flota' }

export default async function AdminFleetPage() {
  const supabase = await createClient()
  const { data: fleet }   = await supabase.from('fleet').select('*, members(username, avatar_url)').order('name')
  const { data: members } = await supabase.from('members').select('id, username').eq('is_banned', false).order('username')

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black mb-6">Zarządzanie Flotą</h1>
      <FleetAdminPanel fleet={fleet ?? []} members={members ?? []} />
    </div>
  )
}
