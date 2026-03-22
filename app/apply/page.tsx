import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApplyForm } from './ApplyForm'
import { Truck } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Złóż podanie' }

export default async function ApplyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Sprawdź czy ma już aktywne podanie
  const { data: existing } = await supabase
    .from('applications')
    .select('status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const canApply = !existing || existing.status === 'rejected'

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10 group">
        <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center glow-amber group-hover:scale-110 transition-transform">
          <Truck className="w-5 h-5 text-black" />
        </div>
        <span className="font-black text-xl text-gradient">GLos Logistics</span>
      </Link>

      <div className="w-full max-w-xl">
        {/* Nagłówek */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">Dołącz do VTC</h1>
          <p className="text-zinc-500">
            Wypełnij podanie — zarząd odpowie w ciągu 48 godzin
          </p>
        </div>

        {/* Odrzucone podanie – info */}
        {existing?.status === 'rejected' && (
          <div className="glass border-red-500/20 bg-red-500/5 rounded-xl p-4 mb-6 text-sm text-red-400">
            ❌ Twoje poprzednie podanie zostało odrzucone. Możesz złożyć nowe.
          </div>
        )}

        <ApplyForm userId={user.id} canApply={canApply} />
      </div>
    </div>
  )
}
