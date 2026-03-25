import { NextRequest, NextResponse } from 'next/server'
import { updateSession }             from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = [
  '/', '/login', '/register', '/news', '/fleet',
  '/members', '/rankings', '/recruitment', '/auth/callback',
  '/maintenance',
]
const APPLY_ROUTES = ['/apply', '/pending']
const ADMIN_ROUTES = ['/admin']

// Helper — kopiuje cookies Supabase do każdego redirect response
function redirectWithCookies(
  url: URL,
  supabaseResponse: NextResponse
): NextResponse {
  const res = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach(cookie => {
    res.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure:   cookie.secure,
      sameSite: cookie.sameSite as any,
      maxAge:   cookie.maxAge,
      path:     cookie.path,
    })
  })
  return res
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ── 1. Przepuść zasoby statyczne ────────────────────────
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api')   ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // ── 2. Bypass dla Server Actions ─────────────────────────
  if (
    request.method === 'POST' &&
    request.headers.get('next-action') !== null
  ) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // ── 3. Sesja Supabase ────────────────────────────────────
  const { supabaseResponse, user, supabase } = await updateSession(request)

  // ── 4. Tryb konserwacji ──────────────────────────────────
  const { data: settings } = await supabase
    .from('vtc_settings')
    .select('maintenance_mode')
    .single()

  if (settings?.maintenance_mode) {
    const isAllowedDuringMaintenance =
      path.startsWith('/maintenance') ||
      path.startsWith('/admin')       ||
      path === '/login'

    if (!isAllowedDuringMaintenance) {
      const isPrivileged = user
        ? await supabase
            .from('members')
            .select('rank')
            .eq('id', user.id)
            .single()
            .then(({ data }) => ['Owner', 'Manager'].includes(data?.rank ?? ''))
        : false

      if (!isPrivileged) {
        return redirectWithCookies(
          new URL('/maintenance', request.url),
          supabaseResponse
        )
      }
    }
  }

  // ── 5. Publiczne trasy ───────────────────────────────────
  const isPublic = PUBLIC_ROUTES.some(r =>
    path === r || path.startsWith('/news/')
  )
  if (isPublic) return supabaseResponse

  // ── 6. Niezalogowany → login ─────────────────────────────
  if (!user) {
    return redirectWithCookies(
      new URL(`/login?next=${encodeURIComponent(path)}`, request.url),
      supabaseResponse
    )
  }

  // ── 7. Pobierz profil + wszystkie podania ────────────────
  const [{ data: member }, { data: allApplications }] = await Promise.all([
    supabase
      .from('members')
      .select('rank, is_banned')
      .eq('id', user.id)
      .single(),
    supabase
      .from('applications')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // ── 8. Zbanowany ─────────────────────────────────────────
  if (member?.is_banned) {
    return redirectWithCookies(
      new URL('/login?error=banned', request.url),
      supabaseResponse
    )
  }

  // Priorytet: accepted > pending > rejected > null
  const appStatus: string | null = (() => {
    if (!allApplications || allApplications.length === 0) return null
    if (allApplications.some(a => a.status === 'accepted')) return 'accepted'
    if (allApplications.some(a => a.status === 'pending'))  return 'pending'
    return 'rejected'
  })()

  const isAdmin = ['Manager', 'Owner'].includes(member?.rank ?? '')

  // ── 9. /apply i /pending ─────────────────────────────────
  if (APPLY_ROUTES.some(r => path.startsWith(r))) {
    if (appStatus === 'accepted' && member) {
      return redirectWithCookies(
        new URL('/hub', request.url),
        supabaseResponse
      )
    }
    return supabaseResponse
  }

  // ── 10. Panel admina ─────────────────────────────────────
  if (ADMIN_ROUTES.some(r => path.startsWith(r))) {
    if (!isAdmin) {
      return redirectWithCookies(
        new URL('/hub', request.url),
        supabaseResponse
      )
    }
    return supabaseResponse
  }

  // ── 11. /hub i chronione trasy ───────────────────────────
  if (path.startsWith('/hub')) {
    // Admin zawsze wchodzi
    if (isAdmin) return supabaseResponse

    // Zaakceptowany ale brak rekordu members → utwórz i przepuść
    if (appStatus === 'accepted' && !member) {
      await supabase.from('members').upsert({
        id:        user.id,
        username:  user.email?.split('@')[0] ?? 'Driver',
        rank:      'Recruit',
        points:    0,
        is_banned: false,
      }, { onConflict: 'id', ignoreDuplicates: true })
      return supabaseResponse
    }

    // Zaakceptowany z rekordem → wchodzi
    if (appStatus === 'accepted' && member) {
      return supabaseResponse
    }

    // Oczekuje → /pending
    if (appStatus === 'pending') {
      return redirectWithCookies(
        new URL('/pending', request.url),
        supabaseResponse
      )
    }

    // Brak podania / odrzucony → /apply
    return redirectWithCookies(
      new URL('/apply', request.url),
      supabaseResponse
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
