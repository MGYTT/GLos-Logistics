import { NextRequest, NextResponse } from 'next/server'
import { updateSession }             from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = [
  '/', '/login', '/register', '/news', '/fleet',
  '/members', '/rankings', '/recruitment', '/auth/callback',
  '/maintenance',
]
const APPLY_ROUTES  = ['/apply', '/pending']
const ADMIN_ROUTES  = ['/admin']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const path = request.nextUrl.pathname

  // ── Zawsze przepuść zasoby ──────────────────
  const isAsset = path.startsWith('/_next')
    || path.startsWith('/api')
    || path.includes('.')
  if (isAsset) return supabaseResponse

  // ── Sprawdź tryb konserwacji ────────────────
  const { data: settings } = await supabase
    .from('vtc_settings')
    .select('maintenance_mode')
    .single()

  if (settings?.maintenance_mode) {
    // Ownerzy i Managerzy mają dostęp
    const isOwner = user
      ? await supabase
          .from('members')
          .select('rank')
          .eq('id', user.id)
          .single()
          .then(({ data }) => ['Owner', 'Manager'].includes(data?.rank ?? ''))
      : false

    const isAllowedDuringMaintenance =
      path.startsWith('/maintenance') ||
      path.startsWith('/admin') ||
      path === '/login' ||
      path.startsWith('/_next') ||
      path.includes('.')

    if (!isOwner && !isAllowedDuringMaintenance) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // ── Publiczne trasy ─────────────────────────
  const isPublic = PUBLIC_ROUTES.some(r =>
    path === r || path.startsWith('/news/')
  )
  if (isPublic) return supabaseResponse

  // ── Niezalogowany → login ───────────────────
  if (!user) {
    return NextResponse.redirect(
      new URL(`/login?next=${path}`, request.url)
    )
  }

  // ── Pobierz profil + podanie ────────────────
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
      .single(),
  ])

  // ── Zbanowany → wyloguj ─────────────────────
  if (member?.is_banned) {
    return NextResponse.redirect(
      new URL('/login?error=banned', request.url)
    )
  }

  const appStatus = application?.status ?? null
  const isAdmin   = ['Manager', 'Owner'].includes(member?.rank ?? '')

  // ── /apply i /pending ───────────────────────
  if (APPLY_ROUTES.some(r => path.startsWith(r))) {
    if (appStatus === 'accepted') {
      return NextResponse.redirect(new URL('/hub', request.url))
    }
    return supabaseResponse
  }

  // ── Panel admina ────────────────────────────
  if (ADMIN_ROUTES.some(r => path.startsWith(r))) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/hub', request.url))
    }
    return supabaseResponse
  }

  // ── /hub i chronione trasy ──────────────────
  if (path.startsWith('/hub')) {
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
