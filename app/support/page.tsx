import { Navbar }          from '@/components/navigation/Navbar'
import { SupportPage }     from '@/components/landing/SupportPage'

export const metadata = {
  title:       'Wesprzyj nas — GLos Logistics',
  description: 'Pomóż nam rozwijać VTC. Wybierz plan wsparcia i odbierz ekskluzywne korzyści.',
}

export default function SupportRoute() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <SupportPage />
      </main>
    </>
  )
}