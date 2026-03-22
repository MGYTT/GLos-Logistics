import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/hub'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Utwórz profil jeśli nie istnieje (OAuth)
      await supabase.from('members').upsert({
        id: data.user.id,
        username: data.user.user_metadata?.full_name ?? data.user.email?.split('@')[0] ?? 'Driver',
        avatar_url: data.user.user_metadata?.avatar_url ?? null,
        discord_id: data.user.user_metadata?.provider_id ?? null,
        rank: 'Recruit',
        points: 0,
      }, { onConflict: 'id', ignoreDuplicates: true })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
