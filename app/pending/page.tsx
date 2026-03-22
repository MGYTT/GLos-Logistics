import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock, Truck } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Oczekiwanie na akceptację' }

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: application } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!application) redirect('/apply')
  if (application.status === 'accepted') redirect('/hub')
  if (application.status === 'rejected') redirect('/apply')

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center glow-amber">
          <Truck className="w-5 h-5 text-black" />
        </div>
        <span className="font-black text-xl text-gradient">GLos Logistics</span>
      </Link>

      <div className="w-full max-w-md glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black mb-2">Podanie wysłane!</h1>
        <p className="text-zinc-400 mb-6 leading-relaxed">
          Twoje podanie oczekuje na rozpatrzenie przez zarząd.
          Zazwyczaj odpowiadamy w ciągu{' '}
          <strong className="text-amber-400">48 godzin</strong>.
        </p>

        {/* Szczegóły podania */}
        <div className="bg-zinc-800/60 rounded-xl p-4 mb-6 text-left space-y-2.5">
          {[
            { label: 'Nick',          value: application.username     },
            { label: 'Discord',       value: application.discord_tag  },
            { label: 'Godziny ETS2',  value: `${application.ets2_hours}h`, color: 'text-amber-400' },
            { label: 'Data złożenia', value: new Date(application.created_at).toLocaleDateString('pl-PL') },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-zinc-500">{label}</span>
              <span className={`font-medium ${color ?? ''}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Pasek postępu */}
        <div className="flex items-center gap-1 mb-6">
          {[
            { label: 'Wysłane',      state: 'done'   },
            { label: 'Rozpatrywane', state: 'active' },
            { label: 'Decyzja',      state: 'wait'   },
          ].map(({ label, state }, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                state === 'done'   ? 'bg-green-400 border-green-400' :
                state === 'active' ? 'bg-amber-400 border-amber-400 animate-pulse' :
                'bg-transparent border-zinc-700'
              }`} />
              <span className="text-[10px] text-zinc-600">{label}</span>
              {i < 2 && (
                <div className={`absolute mt-1.5 h-px w-full ${
                  state === 'done' ? 'bg-green-400/40' : 'bg-zinc-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Info Discord */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-300">
          <p className="font-semibold mb-1">💬 Śledź status na Discordzie</p>
          <p className="text-indigo-400/70 text-xs">
            Po akceptacji otrzymasz rolę i dostęp do kanałów VTC.
          </p>
        </div>

        {/* Wyloguj */}
        <form action="/auth/signout" method="POST" className="mt-6">
          <button
            type="submit"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2"
          >
            Wyloguj się
          </button>
        </form>
      </div>
    </div>
  )
}
