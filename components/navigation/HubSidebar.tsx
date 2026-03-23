'use client'

import Link                       from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState }    from 'react'
import {
  LayoutDashboard, Map, Package, Calendar,
  MessageSquare, User, Truck, LogOut,
  Shield, Radio, Wallet, ShoppingBag,
  Umbrella, ChevronRight,
} from 'lucide-react'
import { cn }           from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { motion }       from 'framer-motion'

// ─── Typy ──────────────────────────────────────────────────
interface NavItem {
  href:   string
  icon:   React.ElementType
  label:  string
  dot?:   boolean
  badge?: number
}

interface AdminItem {
  href:  string
  label: string
}

// ─── Dane nawigacji ────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { href: '/hub',         icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/hub/live',    icon: Radio,           label: 'Na żywo',   dot: true },
  { href: '/hub/livemap', icon: Map,             label: 'Live Mapa'  },
  { href: '/hub/jobs',    icon: Package,         label: 'Moje Joby'  },
  { href: '/hub/events',  icon: Calendar,        label: 'Wydarzenia' },
  { href: '/hub/wallet',  icon: Wallet,          label: 'Portfel'    },
  { href: '/hub/shop',    icon: ShoppingBag,     label: 'Sklep'      },
  { href: '/hub/chat',    icon: MessageSquare,   label: 'Chat'       },
  { href: '/hub/profile', icon: User,            label: 'Profil'     },
  { href: '/hub/leaves',  icon: Umbrella,        label: 'Urlopy'     },
]

const ADMIN_ITEMS: AdminItem[] = [
  { href: '/admin',           label: 'Dashboard'  },
  { href: '/admin/members',   label: 'Członkowie' },
  { href: '/admin/leaves',    label: 'Urlopy'     },
  { href: '/admin/events',    label: 'Wydarzenia' },
  { href: '/admin/fleet',     label: 'Flota'      },
]

const ADMIN_RANKS = ['Owner', 'Manager'] as const

// ─── NavLink ───────────────────────────────────────────────
function NavLink({ href, icon: Icon, label, active, dot, badge }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl',
        'text-sm font-medium transition-all duration-150 border',
        active
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/20 shadow-sm'
          : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent',
      )}
    >
      {/* Ikona */}
      <div className="relative shrink-0">
        <Icon className={cn(
          'w-4 h-4 transition-transform duration-150',
          !active && 'group-hover:scale-110',
        )} />
        {dot === true && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full
                             rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        )}
      </div>

      {/* Label */}
      <span className="flex-1 truncate">{label}</span>

      {/* Badge */}
      {typeof badge === 'number' && badge > 0 && (
        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5
                         rounded-full bg-amber-500/20 text-amber-400
                         min-w-[18px] text-center">
          {badge}
        </span>
      )}

      {/* Strzałka aktywna */}
      {active && (
        <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
      )}
    </Link>
  )
}

// ─── AdminLink ─────────────────────────────────────────────
function AdminLink({ href, label, active }: AdminItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl border',
        'text-xs font-semibold transition-all duration-150',
        active
          ? 'bg-red-500/10 text-red-400 border-red-500/20'
          : 'text-red-400/40 hover:text-red-400 hover:bg-red-400/5 border-transparent',
      )}
    >
      <Shield className="w-3.5 h-3.5 shrink-0" />
      {label}
    </Link>
  )
}

// ─── Główny komponent ──────────────────────────────────────
export function HubSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const [rank,     setRank]     = useState<string | null>(null)
  const [username, setUsername] = useState<string>('')
  const [avatar,   setAvatar]   = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) { setLoading(false); return }

      const { data } = await supabase
        .from('members')
        .select('rank, username, avatar_url')
        .eq('id', user.id)
        .single()

      if (cancelled) return
      setRank(data?.rank       ?? null)
      setUsername(data?.username    ?? '')
      setAvatar(data?.avatar_url    ?? null)
      setLoading(false)
    }

    fetchUser()
    return () => { cancelled = true }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isAdmin = rank !== null &&
    (ADMIN_RANKS as readonly string[]).includes(rank)

  function isActive(href: string): boolean {
    if (href === '/hub')   return pathname === '/hub'
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-60
                 bg-zinc-950/95 backdrop-blur-xl
                 border-r border-white/[0.07]
                 flex flex-col z-40"
    >
      {/* ── Logo ───────────────────────────────────────── */}
      <div className="h-16 flex items-center px-5 shrink-0
                      border-b border-white/[0.07]">
        <Link href="/" className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 bg-amber-500 rounded-lg shrink-0
                       flex items-center justify-center
                       shadow-md shadow-amber-500/30"
          >
            <Truck className="w-4 h-4 text-black" />
          </motion.div>
          <span className="font-black text-gradient text-base truncate">
            GLos Logistics
          </span>
        </Link>
      </div>

      {/* ── Nawigacja ──────────────────────────────────── */}
      <nav
        className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto
                   scrollbar-thin scrollbar-track-transparent
                   scrollbar-thumb-zinc-800"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
          />
        ))}

        {/* ── Sekcja admina ──────────────────────────── */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-[10px] font-bold text-zinc-600
                                 uppercase tracking-widest px-1">
                  Admin
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            </div>

            {ADMIN_ITEMS.map((item) => (
              <AdminLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── Użytkownik + wyloguj ───────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.07]">

        {/* Karta użytkownika */}
        {!loading && username && (
          <div className="px-4 py-3 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full shrink-0 overflow-hidden
                         bg-zinc-800 border border-zinc-700
                         flex items-center justify-center
                         text-amber-400 text-sm font-bold"
            >
              {avatar
                ? <img src={avatar} alt={username} className="w-full h-full object-cover" />
                : (username[0]?.toUpperCase() ?? '?')
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">
                {username}
              </p>
              {rank && (
                <p className="text-[11px] text-zinc-500 truncate leading-tight">
                  {rank}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Wyloguj */}
        <div className="px-3 pb-3">
          <motion.button
            onClick={handleSignOut}
            whileTap={{ scale: 0.97 }}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl
                       text-sm text-zinc-500 hover:text-red-400
                       hover:bg-red-400/5 border border-transparent
                       hover:border-red-400/10 transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Wyloguj się
          </motion.button>
        </div>
      </div>
    </aside>
  )
}
