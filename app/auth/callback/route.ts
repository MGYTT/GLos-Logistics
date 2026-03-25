import { createClient }              from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/hub'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Pobierz status aplikacji użytkownika
      const { data: applications } = await supabase
        .from('applications')
        .select('status')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })

      const appStatus = (() => {
        if (!applications || applications.length === 0) return null
        if (applications.some(a => a.status === 'accepted')) return 'accepted'
        if (applications.some(a => a.status === 'pending'))  return 'pending'
        return 'rejected'
      })()

      // Utwórz/zaktualizuj profil tylko jeśli aplikacja zaakceptowana
      // lub to konto OAuth (np. Discord) bez aplikacji
      if (appStatus === 'accepted') {
        await supabase.from('members').upsert({
          id:         data.user.id,
          username:   data.user.user_metadata?.full_name
                        ?? data.user.email?.split('@')[0]
                        ?? 'Driver',
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          discord_id: data.user.user_metadata?.provider_id ?? null,
          rank:       'Recruit',
          points:     0,
        }, { onConflict: 'id', ignoreDuplicates: true })

        return NextResponse.redirect(`${origin}/hub`)
      }

      // Oczekuje → /pending
      if (appStatus === 'pending') {
        return NextResponse.redirect(`${origin}/pending`)
      }

      // Brak aplikacji lub odrzucony → /apply
      return NextResponse.redirect(`${origin}/apply`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
