'use client'

import { useState, useEffect }      from 'react'
import Link                         from 'next/link'
import { usePathname }              from 'next/navigation'
import { motion, AnimatePresence }   from 'framer-motion'
import {
  LayoutDashboard, Map, Briefcase, Wallet,
  CalendarDays, MessageSquare, User,
  Trophy, Settings, MoreHorizontal, X,
  ChevronRight, Truck,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Typy ──────────────────────────────────────
interface NavItem {
  href:    string
  icon:    React.ElementType
  label:   string
  badge?:  boolean
  color?:  string            // kolor akcentu w sheet
}

// ─── Konfiguracja ──────────────────────────────
// Główny pasek — max 5 pozycji
const MAIN_NAV: NavItem[] = [
  { href: '/hub',          icon: LayoutDashboard, label: 'Hub',     color: 'amber'  },
  { href: '/hub/jobs',     icon: Briefcase,       label: 'Joby',    color: 'green'  },
  { href: '/hub/wallet',   icon: Wallet,          label: 'Portfel', color: 'amber'  },
  { href: '/hub/livemap',  icon: Map,             label: 'Mapa',    color: 'blue'   },
  { href: '/hub/profile',  icon: User,            label: 'Profil',  color: 'purple' },
]

// Sheet — pozostałe zakładki
const MORE_NAV: NavItem[] = [
  { href: '/hub/events',   icon: CalendarDays,   label: 'Eventy',   color: 'pink'   },
  { href: '/hub/chat',     icon: MessageSquare,  label: 'Chat',     color: 'teal'   },
  { href: '/rankings',  icon: Trophy,         label: 'Ranking',  color: 'amber'  },
  { href: '/fleet',   icon: Truck,          label: 'Ciężarówki', color: 'blue' },
  { href: '/hub/settings', icon: Settings,       label: 'Ustawienia', color: 'zinc' },
]

// Kolory akcentów dla sheet items
const ACCENT: Record<string, { text: string; bg: string; border: string }> = {
  amber:  { text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
  green:  { text: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20'  },
  blue:   { text: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  purple: { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  pink:   { text: 'text-pink-400',   bg: 'bg-pink-400/10',   border: 'border-pink-400/20'   },
  teal:   { text: 'text-teal-400',   bg: 'bg-teal-400/10',   border: 'border-teal-400/20'   },
  zinc:   { text: 'text-zinc-400',   bg: 'bg-zinc-400/10',   border: 'border-zinc-400/20'   },
}

// ─── Props ─────────────────────────────────────
interface Props {
  walletAlert?: boolean   // czerwony badge — aktywna pożyczka
}

// ─── Komponent ─────────────────────────────────
export function HubBottomNav({ walletAlert = false }: Props) {
  const pathname  = usePathname()
  const [open, setOpen] = useState(false)

  // Zamknij sheet przy zmianie strony
  useEffect(() => { setOpen(false) }, [pathname])

  // Zablokuj scroll body gdy sheet otwarty
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function isActive(href: string) {
    return href === '/hub' ? pathname === '/hub' : pathname.startsWith(href)
  }

  // Czy jakakolwiek pozycja z MORE_NAV jest aktywna
  const moreActive = MORE_NAV.some(item => isActive(item.href))

  return (
    <>
      {/* ── Pasek nawigacji ─────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50
                      bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/80">
        <div className="flex items-center justify-around px-1 py-2
                        pb-[calc(0.5rem+env(safe-area-inset-bottom))]
                        max-w-lg mx-auto">

          {/* Główne pozycje */}
          {MAIN_NAV.map(({ href, icon: Icon, label, badge, color = 'amber' }) => {
            const active     = isActive(href)
            const showBadge  = badge && walletAlert
            const { text, bg } = ACCENT[color]

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-1 rounded-xl',
                  'transition-all duration-200 min-w-0 flex-1',
                  active ? text : 'text-zinc-600 active:text-zinc-400',
                )}
              >
                <div className={cn(
                  'relative p-1.5 rounded-xl transition-colors duration-200',
                  active ? bg : '',
                )}>
                  <Icon className="w-[22px] h-[22px] shrink-0" strokeWidth={active ? 2.2 : 1.8} />

                  {/* Portfel — badge pożyczki */}
                  {href === '/hub/wallet' && walletAlert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5
                                     bg-red-500 rounded-full border-2 border-zinc-900" />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-semibold truncate leading-none transition-all',
                  active ? 'opacity-100' : 'opacity-60',
                )}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* Przycisk Więcej */}
          <button
            onClick={() => setOpen(true)}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-1 rounded-xl',
              'transition-all duration-200 min-w-0 flex-1',
              open || moreActive ? 'text-amber-400' : 'text-zinc-600 active:text-zinc-400',
            )}
          >
            <div className={cn(
              'relative p-1.5 rounded-xl transition-colors duration-200',
              open || moreActive ? 'bg-amber-400/10' : '',
            )}>
              <MoreHorizontal className="w-[22px] h-[22px] shrink-0" strokeWidth={1.8} />

              {/* Badge jeśli aktywna zakładka jest w MORE */}
              {moreActive && !open && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2
                                 bg-amber-400 rounded-full border-2 border-zinc-900" />
              )}
            </div>
            <span className={cn(
              'text-[10px] font-semibold truncate leading-none transition-all',
              open || moreActive ? 'opacity-100' : 'opacity-60',
            )}>
              Więcej
            </span>
          </button>
        </div>
      </nav>

      {/* ── Bottom Sheet ────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0      }}
              exit={{   y: '100%'  }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 z-50
                         bg-zinc-900 border-t border-zinc-800
                         rounded-t-[28px] shadow-2xl
                         pb-[env(safe-area-inset-bottom)]"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-zinc-700 rounded-full" />
              </div>

              {/* Nagłówek */}
              <div className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-black text-white">Więcej opcji</p>
                  <p className="text-xs text-zinc-600 mt-0.5">Wszystkie sekcje panelu</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700
                             flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Siatka zakładek */}
              <div className="px-4 pb-6">
                <div className="grid grid-cols-1 gap-2">
                  {MORE_NAV.map(({ href, icon: Icon, label, color = 'zinc' }, i) => {
                    const active = isActive(href)
                    const { text, bg, border } = ACCENT[color]

                    return (
                      <motion.div
                        key={href}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0   }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                      >
                        <Link
                          href={href}
                          className={cn(
                            'flex items-center gap-4 px-4 py-3.5 rounded-2xl',
                            'border transition-all duration-150',
                            active
                              ? `${bg} ${border}`
                              : 'bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800',
                          )}
                        >
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                            active ? bg : 'bg-zinc-700/60',
                          )}>
                            <Icon className={cn(
                              'w-5 h-5',
                              active ? text : 'text-zinc-400',
                            )} strokeWidth={active ? 2.2 : 1.8} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm font-bold leading-none',
                              active ? text : 'text-zinc-200',
                            )}>
                              {label}
                            </p>
                            <p className="text-xs text-zinc-600 mt-1 leading-none">
                              {href}
                            </p>
                          </div>

                          <ChevronRight className={cn(
                            'w-4 h-4 shrink-0 transition-transform',
                            active ? text : 'text-zinc-700',
                            active && 'translate-x-0.5',
                          )} />
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
