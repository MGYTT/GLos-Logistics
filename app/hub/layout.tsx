import { HubSidebar }         from '@/components/navigation/HubSidebar'
import { HubBottomNav }       from '@/components/navigation/HubBottomNav'
import { MaintenanceBanner }  from '@/components/MaintenanceBanner'
import { createClient }       from '@/lib/supabase/server'
import { redirect }           from 'next/navigation'

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      {/* Baner konserwacji — widoczny tylko dla Ownera/Managera */}
      <MaintenanceBanner />

      <div className="flex min-h-screen bg-zinc-950">
        {/* Sidebar — tylko desktop */}
        <div className="hidden md:block shrink-0">
          <HubSidebar />
        </div>

        {/* Główna treść — odsunięta gdy baner aktywny */}
        <main className="flex-1 md:ml-60 min-h-screen
                         pb-24 md:pb-0 overflow-x-hidden">
          {children}
        </main>

        {/* Bottom nav — tylko mobile */}
        <div className="md:hidden">
          <HubBottomNav />
        </div>
      </div>
    </>
  )
}
