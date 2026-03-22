import { FleetTruck } from '@/types'
import { TruckCard } from './TruckCard'

export function FleetGrid({ trucks }: { trucks: FleetTruck[] }) {
  if (trucks.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-600">
        <p className="text-lg">Flota jest pusta.</p>
        <p className="text-sm mt-1">Administrator może dodać pojazdy w panelu.</p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {trucks.map(truck => <TruckCard key={truck.id} truck={truck} />)}
    </div>
  )
}
