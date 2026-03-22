import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('rank, username, avatar_url')
    .eq('id', user.id)
    .single()

  // Tylko Owner i Manager mają dostęp
  if (!member || !['Owner', 'Manager'].includes(member.rank)) {
    redirect('/hub')
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminSidebar member={member} />
      <main className="flex-1 md:ml-64 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
