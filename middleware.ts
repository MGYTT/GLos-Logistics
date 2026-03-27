import { NextRequest, NextResponse } from 'next/server'
import { updateSession }             from '@/lib/supabase/middleware'


const PUBLIC_ROUTES = [
  '/', '/login', '/register', '/news', '/fleet',
  '/members', '/rankings', '/recruitment', '/auth/callback',
  '/maintenance',
]
const APPLY_ROUTES = ['/apply', '/pending']
const ADMIN_ROUTES = ['/admin']

function redirectWithCookies(url: URL, supabaseResponse: NextResponse): NextResponse {
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

  // ── 1. Przepuść zasoby statyczne ──────────────────────
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api')   ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // ── 2. Bypass dla Server Actions ──────────────────────
  if (
    request.method === 'POST' &&
    request.headers.get('next-action') !== null
  ) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // ── 3. Publiczne trasy — ZERO zapytań do bazy ─────────
  const isPublic = PUBLIC_ROUTES.some(r =>
    path === r || path.startsWith('/news/')
  )
  if (isPublic) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // ── 4. Sesja Supabase ─────────────────────────────────
  const { supabaseResponse, user, supabase } = await updateSession(request)

  // ── 5. Niezalogowany → login ──────────────────────────
  if (!user) {
    return redirectWithCookies(
      new URL(`/login?next=${encodeURIComponent(path)}`, request.url),
      supabaseResponse
    )
  }

  // ── 6. /hub — sprawdź tylko cookie cache ──────────────
  // Jeśli user jest zalogowany i idzie w głąb /hub (nie root)
  // to już był zweryfikowany wcześniej — nie sprawdzaj ponownie
  if (path.startsWith('/hub') && path !== '/hub') {
    const verified = request.cookies.get('vtc_verified')?.value
    if (verified === user.id) return supabaseResponse
  }

  // ── 7. Pobierz profil + podania (tylko gdy potrzeba) ──
  const [{ data: member }, { data: allApplications }, { data: settings }] =
    await Promise.all([
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
      // Maintenance tylko dla chronionych tras
      supabase
        .from('vtc_settings')
        .select('maintenance_mode')
        .single(),
    ])

  // ── 8. Tryb konserwacji ────────────────────────────────
  if (settings?.maintenance_mode) {
    const isAllowedDuringMaintenance =
      path.startsWith('/maintenance') ||
      path.startsWith('/admin')       ||
      path === '/login'

    const isPrivileged = ['Owner', 'Manager'].includes(member?.rank ?? '')

    if (!isAllowedDuringMaintenance && !isPrivileged) {
      return redirectWithCookies(
        new URL('/maintenance', request.url),
        supabaseResponse
      )
    }
  }

  // ── 9. Zbanowany ──────────────────────────────────────
  if (member?.is_banned) {
    return redirectWithCookies(
      new URL('/login?error=banned', request.url),
      supabaseResponse
    )
  }

  const appStatus: string | null = (() => {
    if (!allApplications || allApplications.length === 0) return null
    if (allApplications.some(a => a.status === 'accepted')) return 'accepted'
    if (allApplications.some(a => a.status === 'pending'))  return 'pending'
    return 'rejected'
  })()

  const isAdmin = ['Manager', 'Owner'].includes(member?.rank ?? '')

  // ── 10. /apply i /pending ─────────────────────────────
  if (APPLY_ROUTES.some(r => path.startsWith(r))) {
    if (appStatus === 'accepted' && member) {
      return redirectWithCookies(new URL('/hub', request.url), supabaseResponse)
    }
    return supabaseResponse
  }

  // ── 11. Panel admina ──────────────────────────────────
  if (ADMIN_ROUTES.some(r => path.startsWith(r))) {
    if (!isAdmin) {
      return redirectWithCookies(new URL('/hub', request.url), supabaseResponse)
    }
    return supabaseResponse
  }

  // ── 12. /hub ──────────────────────────────────────────
  if (path.startsWith('/hub')) {
    if (isAdmin) {
      // Ustaw cookie cache dla admina
      const res = NextResponse.next({ request })
      supabaseResponse.cookies.getAll().forEach(c => res.cookies.set(c.name, c.value))
      res.cookies.set('vtc_verified', user.id, {
        httpOnly: true,
        maxAge:   60 * 30, // 30 minut
        path:     '/hub',
      })
      return res
    }

    if (appStatus === 'accepted' && !member) {
      await supabase.from('members').upsert({
        id:        user.id,
        username:  user.email?.split('@')[0] ?? 'Driver',
        rank:      'Recruit',
        points:    0,
        is_banned: false,
      }, { onConflict: 'id', ignoreDuplicates: true })
    }

    if (appStatus === 'accepted') {
      // Cache — kolejne wejścia w /hub nie będą sprawdzać bazy
      const res = NextResponse.next({ request })
      supabaseResponse.cookies.getAll().forEach(c => res.cookies.set(c.name, c.value))
      res.cookies.set('vtc_verified', user.id, {
        httpOnly: true,
        maxAge:   60 * 30,
        path:     '/hub',
      })
      return res
    }

    if (appStatus === 'pending') {
      return redirectWithCookies(new URL('/pending', request.url), supabaseResponse)
    }

    return redirectWithCookies(new URL('/apply', request.url), supabaseResponse)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}