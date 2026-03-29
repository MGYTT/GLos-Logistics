'use client'

import { useState }              from 'react'
import Link                      from 'next/link'
import { usePathname }           from 'next/navigation'
import {
  motion, AnimatePresence,
  useScroll, useMotionValueEvent,
} from 'framer-motion'
import { Button }                from '@/components/ui/button'
import { MobileNav }             from './MobileNav'
import { Truck, Gauge, Heart }   from 'lucide-react'
import { cn }                    from '@/lib/utils/cn'

const navLinks = [
  { href: '/news',        label: 'Aktualności' },
  { href: '/fleet',       label: 'Flota'       },
  { href: '/rankings',    label: 'Rankingi'    },
  { href: '/members',     label: 'Kierowcy'    },
  { href: '/recruitment', label: 'Rekrutacja'  },
  { href: '/hub/bridge',  label: 'ETS2 Bridge' },
]

export function Navbar() {
  const pathname               = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [hidden,   setHidden]   = useState(false)
  const [lastY,    setLastY]    = useState(0)
  const { scrollY } = useScroll()

  if (pathname.startsWith('/hub') || pathname.startsWith('/admin')) return null

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 20)
    setHidden(y > lastY && y > 80)
    setLastY(y)
  })

  return (
    <motion.header
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-300',
        scrolled
          ? 'bg-zinc-950/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -6 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 bg-amber-500 rounded-xl flex items-center
                       justify-center shadow-lg shadow-amber-500/30"
          >
            <Truck className="w-5 h-5 text-black" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="font-black text-xl text-gradient hidden sm:block"
          >
            GLos Logistics
          </motion.span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link, i) => {
            const isActive = pathname === link.href
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.3 }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    'relative px-3.5 py-2 rounded-lg text-sm font-medium',
                    'transition-colors duration-150',
                    isActive
                      ? 'text-amber-400'
                      : 'text-zinc-400 hover:text-white',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-amber-500/10 rounded-lg
                                 border border-amber-500/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              </motion.div>
            )
          })}

          {/* ── Wsparcie — subtelny separator + przycisk ── */}
          <div className="w-px h-4 bg-zinc-800 mx-1.5" />

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * navLinks.length, duration: 0.3 }}
          >
            <Link
              href="/support"
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                'text-xs font-medium transition-all duration-200',
                pathname === '/support'
                  ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                  : 'text-zinc-600 hover:text-red-400 hover:bg-red-500/5 border border-transparent',
              )}
            >
              <motion.div
                animate={
                  pathname !== '/support'
                    ? { scale: [1, 1.25, 1] }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
              >
                <Heart className="w-3 h-3 fill-current" />
              </motion.div>
              Wesprzyj
            </Link>
          </motion.div>
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link href="/login">
            <Button
              variant="ghost" size="sm"
              className="text-zinc-400 hover:text-white"
            >
              Zaloguj
            </Button>
          </Link>
          <Link href="/hub">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button
                size="sm"
                className="bg-amber-500 text-black hover:bg-amber-400
                           font-bold gap-1.5 shadow-md shadow-amber-500/25"
              >
                <Gauge className="w-3.5 h-3.5" />
                Hub
              </Button>
            </motion.div>
          </Link>
        </div>

        {/* Mobile */}
        <MobileNav />
      </div>
    </motion.header>
  )
}