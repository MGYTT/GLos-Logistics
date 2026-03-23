'use client'

import { useState, useEffect }    from 'react'
import Link                       from 'next/link'
import { usePathname }            from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Briefcase, Wallet,
  CalendarDays, MessageSquare, User,
  Trophy, Truck, MoreHorizontal, X,
  ChevronRight, Radio, ShoppingBag, Umbrella,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Typy ──────────────────────────────────────────────────
interface NavItem {
  href:        string
  icon:        React.ElementType
  label:       string
  color:       AccentKey
  dot?:        boolean
  walletBadge?: boolean   // specjalny badge dla portfela
}

type AccentKey = 'amber' | 'green' | 'blue' | 'purple' | 'pink' | 'teal' | 'zinc' | 'red'

interface AccentConfig {
  text:   string
  bg:     string
  border: string
}

// ─── Akcenty ───────────────────────────────────────────────
const ACCENT: Record<AccentKey, AccentConfig> = {
  amber:  { text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
  green:  { text: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20'  },
  blue:   { text: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  purple: { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  pink:   { text: 'text-pink-400',   bg: 'bg-pink-400/10',   border: 'border-pink-400/20'   },
  teal:   { text: 'text-teal-400',   bg: 'bg-teal-400/10',   border: 'border-teal-400/20'   },
  zinc:   { text: 'text-zinc-400',   bg: 'bg-zinc-400/10',   border: 'border-zinc-400/20'   },
  red:    { text: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20'    },
}

// ─── Konfiguracja nawigacji ────────────────────────────────
// Główny pasek — max 5 pozycji
const MAIN_NAV: NavItem[] = [
  { href: '/hub',         icon: LayoutDashboard, label: 'Hub',     color: 'amber'  },
  { href: '/hub/jobs',    icon: Briefcase,       label: 'Joby',    color: 'green'  },
  { href: '/hub/wallet',  icon: Wallet,          label: 'Portfel', color: 'amber', walletBadge: true },
  { href: '/hub/livemap', icon: Map,             label: 'Mapa',    color: 'blue'   },
  { href: '/hub/profile', icon: User,            label: 'Profil',  color: 'purple' },
]

// Sheet — pozostałe zakładki
const MORE_NAV: NavItem[] = [
  { href: '/hub/live',    icon: Radio,         label: 'Na żywo',    color: 'green', dot: true },
  { href: '/hub/events',  icon: CalendarDays,  label: 'Eventy',     color: 'pink'   },
  { href: '/hub/chat',    icon: MessageSquare, label: 'Chat',        color: 'teal'   },
  { href: '/hub/shop',    icon: ShoppingBag,   label: 'Sklep',       color: 'amber'  },
  { href: '/hub/leaves',  icon: Umbrella,      label: 'Urlopy',      color: 'blue'   },
  { href: '/rankings',    icon: Trophy,        label: 'Ranking',     color: 'amber'  },
  { href: '/fleet',       icon: Truck,         label: 'Ciężarówki',  color: 'blue'   },
]

// Opisy podstron wyświetlane w sheet
const DESCRIPTIONS: Record<string, string> = {
  '/hub/live':   'Aktualne pozycje kierowców',
  '/hub/events': 'Nadchodzące i trwające eventy',
  '/hub/chat':   'Czat firmowy VTC',
  '/hub/shop':   'Sklep z nagrodami za punkty',
  '/hub/leaves': 'Wnioski urlopowe',
  '/rankings':   'Tygodniowe i miesięczne rankingi',
  '/fleet':      'Zarządzanie flotą ciężarówek',
}

// ─── Props ─────────────────────────────────────────────────
interface Props {
  walletAlert?: boolean
}

// ─── Pomocniczy hook ───────────────────────────────────────
function useIsActive() {
  const pathname = usePathname()
  return (href: string) =>
    href === '/hub' ? pathname === '/hub' : pathname.startsWith(href)
}

// ─── Pojedynczy przycisk na pasku ──────────────────────────
function BottomNavButton({
  item,
  active,
  walletAlert,
}: {
  item:        NavItem
  active:      boolean
  walletAlert: boolean
}) {
  const { text, bg } = ACCENT[item.color]
  const { icon: Icon, href, label, walletBadge } = item
  const showWalletBadge = walletBadge && walletAlert

  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-1 px-2 py-1 rounded-xl',
        'transition-all duration-200 min-w-0 flex-1 select-none',
        active ? text : 'text-zinc-600 active:scale-95',
      )}
    >
      <div className={cn(
        'relative p-1.5 rounded-xl transition-colors duration-200',
        active ? bg : '',
      )}>
        <Icon
          className="w-[22px] h-[22px] shrink-0"
          strokeWidth={active ? 2.2 : 1.8}
        />

        {/* Pulsujący dot (Na żywo) */}
        {item.dot === true && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full
                             rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        )}

        {/* Portfel — badge aktywnej pożyczki */}
        {showWalletBadge && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5
                           bg-red-500 rounded-full border-2 border-zinc-900" />
        )}
      </div>

      <span className={cn(
        'text-[10px] font-semibold truncate leading-none transition-opacity',
        active ? 'opacity-100' : 'opacity-50',
      )}>
        {label}
      </span>
    </Link>
  )
}

// ─── Przycisk Więcej ───────────────────────────────────────
function MoreButton({
  open,
  moreActive,
  onClick,
}: {
  open:       boolean
  moreActive: boolean
  onClick:    () => void
}) {
  const highlighted = open || moreActive

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 px-2 py-1 rounded-xl',
        'transition-all duration-200 min-w-0 flex-1 select-none',
        highlighted ? 'text-amber-400' : 'text-zinc-600 active:scale-95',
      )}
    >
      <div className={cn(
        'relative p-1.5 rounded-xl transition-colors duration-200',
        highlighted ? 'bg-amber-400/10' : '',
      )}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'x' : 'dots'}
            initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{   rotate:  90,  opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
            className="block"
          >
            {open
              ? <X              className="w-[22px] h-[22px]" strokeWidth={2.2} />
              : <MoreHorizontal className="w-[22px] h-[22px]" strokeWidth={1.8} />
            }
          </motion.span>
        </AnimatePresence>

        {/* Dot gdy aktywna strona jest w MORE */}
        {moreActive && !open && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2
                           bg-amber-400 rounded-full border-2 border-zinc-900" />
        )}
      </div>

      <span className={cn(
        'text-[10px] font-semibold truncate leading-none transition-opacity',
        highlighted ? 'opacity-100' : 'opacity-50',
      )}>
        Więcej
      </span>
    </button>
  )
}

// ─── Sheet item ────────────────────────────────────────────
function SheetItem({
  item,
  active,
  index,
}: {
  item:   NavItem
  active: boolean
  index:  number
}) {
  const { text, bg, border } = ACCENT[item.color]
  const { href, icon: Icon, label, dot } = item

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0   }}
      transition={{ delay: index * 0.035, duration: 0.18 }}
    >
      <Link
        href={href}
        className={cn(
          'flex items-center gap-4 px-4 py-3.5 rounded-2xl border',
          'transition-all duration-150',
          active
            ? `${bg} ${border}`
            : 'bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800 active:scale-[0.98]',
        )}
      >
        {/* Ikona */}
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative',
          active ? bg : 'bg-zinc-700/50',
        )}>
          <Icon
            className={cn('w-5 h-5', active ? text : 'text-zinc-400')}
            strokeWidth={active ? 2.2 : 1.8}
          />
          {dot === true && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full
                               rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
        </div>

        {/* Tekst */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-bold leading-tight',
            active ? text : 'text-zinc-200',
          )}>
            {label}
          </p>
          {DESCRIPTIONS[href] && (
            <p className="text-xs text-zinc-600 mt-0.5 leading-tight truncate">
              {DESCRIPTIONS[href]}
            </p>
          )}
        </div>

        {/* Strzałka */}
        <ChevronRight className={cn(
          'w-4 h-4 shrink-0 transition-transform duration-150',
          active ? `${text} translate-x-0.5` : 'text-zinc-700',
        )} />
      </Link>
    </motion.div>
  )
}

// ─── Główny komponent ──────────────────────────────────────
export function HubBottomNav({ walletAlert = false }: Props) {
  const pathname  = usePathname()
  const [open, setOpen] = useState(false)
  const isActive  = useIsActive()

  // Zamknij przy zmianie strony
  useEffect(() => { setOpen(false) }, [pathname])

  // Zablokuj scroll gdy sheet otwarty
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const moreActive = MORE_NAV.some(item => isActive(item.href))

  return (
    <>
      {/* ── Pasek nawigacji ───────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50
                   bg-zinc-900/95 backdrop-blur-xl
                   border-t border-zinc-800/80
                   supports-[backdrop-filter]:bg-zinc-900/80"
      >
        <div
          className="flex items-center justify-around px-1 pt-2
                     pb-[calc(0.5rem+env(safe-area-inset-bottom))]
                     max-w-lg mx-auto"
        >
          {MAIN_NAV.map(item => (
            <BottomNavButton
              key={item.href}
              item={item}
              active={isActive(item.href)}
              walletAlert={walletAlert}
            />
          ))}

          <MoreButton
            open={open}
            moreActive={moreActive}
            onClick={() => setOpen(v => !v)}
          />
        </div>
      </nav>

      {/* ── Bottom Sheet ──────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0      }}
              exit={{    y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50
                         bg-zinc-900 border-t border-zinc-800
                         rounded-t-[28px] shadow-2xl"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-zinc-700" />
              </div>

              {/* Nagłówek */}
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-black text-white">Więcej opcji</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Wszystkie sekcje panelu VTC
                  </p>
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700
                             flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </motion.button>
              </div>

              {/* Lista */}
              <div className="px-4 space-y-2">
                {MORE_NAV.map((item, i) => (
                  <SheetItem
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    index={i}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
