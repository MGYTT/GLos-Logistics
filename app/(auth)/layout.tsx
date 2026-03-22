import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: {
    template: '%s | GLos Logistics',
    default:  'GLos Logistics',
  },
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Jeśli użytkownik jest już zalogowany — przekieruj do huba
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/hub')

  return (
    <div className="min-h-screen bg-zinc-950 antialiased">
      {children}
    </div>
  )
}
