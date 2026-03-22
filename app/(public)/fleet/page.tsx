import { getFleet } from '@/lib/supabase/queries'
import { FleetGrid } from '@/components/fleet/FleetGrid'

export const metadata = { title: 'Flota' }
export const revalidate = 600

export default async function FleetPage() {
  const fleet = await getFleet()
  return (
    <div className="min-h-screen py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-2">Nasza Flota</h1>
        <p className="text-zinc-500">{fleet.length} pojazdów w barwach VTC</p>
      </div>
      <FleetGrid trucks={fleet} />
    </div>
  )
}
