import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers }      from '@/components/shared/Providers'
import { SpeedInsights }  from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default:  'GLos Logistics | Virtual Trucking Company',
    template: '%s | GLos Logistics',
  },
  description: 'Profesjonalna wirtualna firma transportowa w Euro Truck Simulator 2.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className="dark">
      <body
        className={`${inter.variable} font-sans bg-zinc-950 text-white antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}