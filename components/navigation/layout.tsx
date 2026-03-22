import { HubBottomNavServer } from '@/components/navigation/HubBottomNavServer'

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-[72px]">
      {children}
      <HubBottomNavServer />
    </div>
  )
}
