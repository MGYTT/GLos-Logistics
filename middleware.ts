import { NextRequest, NextResponse } from 'next/server'
import { updateSession }             from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = [
  '/', '/login', '/register', '/news', '/fleet',
  '/members', '/rankings', '/recruitment', '/auth/callback',
  '/maintenance',
]
const APPLY_ROUTES = ['/apply', '/pending']
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ── 1. Zawsze przepuść zasoby statyczne ─────────────────
  const isAsset =
    path.startsWith('/_next') ||
    path.startsWith('/api')   ||
    path.includes('.')
  if (isAsset) {
    return NextResponse.next()
  }

  // ── 2. Bypass dla Server Actions ─────────────────────────
  // Server Actions to POST z headerem 'next-action'
  // Middleware NIE może ich redirectować — dostałyby HTML zamiast RSC payload
  const isServerAction =
    request.method === 'POST' &&
    request.headers.get('next-action') !== null
  if (isServerAction) {
    // Tylko odśwież sesję Supabase, bez żadnej logiki routingu
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // ── 3. Standardowa logika sesji ──────────────────────────
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
      // Sprawdź rangę tylko jeśli zalogowany
      const isPrivileged = user
        ? await supabase
            .from('members')
            .select('rank')
            .eq('id', user.id)
            .single()
            .then(({ data }) => ['Owner', 'Manager'].includes(data?.rank ?? ''))
        : false

      if (!isPrivileged) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
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
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(path)}`, request.url)
    )
  }

  // ── 7. Pobierz profil + podanie ──────────────────────────
  const [{ data: member }, { data: application }] = await Promise.all([
    supabase
      .from('members')
      .select('rank, is_banned')
      .eq('id', user.id)
      .single(),
    supabase
      .from('applications')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),               // ← maybeSingle zamiast single (nie rzuca błędu gdy brak)
  ])

  // ── 8. Zbanowany ─────────────────────────────────────────
  if (member?.is_banned) {
    return NextResponse.redirect(
      new URL('/login?error=banned', request.url)
    )
  }

  const appStatus = application?.status ?? null
  const isAdmin   = ['Manager', 'Owner'].includes(member?.rank ?? '')

  // ── 9. /apply i /pending ─────────────────────────────────
  if (APPLY_ROUTES.some(r => path.startsWith(r))) {
    if (appStatus === 'accepted') {
      return NextResponse.redirect(new URL('/hub', request.url))
    }
    return supabaseResponse
  }

  // ── 10. Panel admina ─────────────────────────────────────
  if (ADMIN_ROUTES.some(r => path.startsWith(r))) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/hub', request.url))
    }
    return supabaseResponse
  }

  // ── 11. /hub i chronione trasy ───────────────────────────
  if (path.startsWith('/hub')) {
    if (isAdmin) return supabaseResponse
    if (!appStatus || appStatus === 'rejected') {
      return NextResponse.redirect(new URL('/apply', request.url))
    }
    if (appStatus === 'pending') {
      return NextResponse.redirect(new URL('/pending', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
