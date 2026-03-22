import { createClient }  from '@/lib/supabase/server'
import { MembersTable }  from '@/components/admin/MembersTable'
import { Users }         from 'lucide-react'

export const metadata = { title: 'Admin — Członkowie' }
export const dynamic  = 'force-dynamic'

export default async function AdminMembersPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('joined_at', { ascending: false })

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-400/10 border
                        border-blue-400/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Zarządzanie członkami</h1>
          <p className="text-zinc-500 text-sm">
            {members?.length ?? 0} kierowców w bazie
          </p>
        </div>
      </div>
      <MembersTable members={members ?? []} />
    </div>
  )
}
