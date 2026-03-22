import { Navbar }            from '@/components/navigation/Navbar'
import { MaintenanceBanner } from '@/components/MaintenanceBanner'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Baner konserwacji — widoczny tylko dla Ownera/Managera */}
      <MaintenanceBanner />

      <Navbar />
      <main className="pt-16">{children}</main>
    </>
  )
}
