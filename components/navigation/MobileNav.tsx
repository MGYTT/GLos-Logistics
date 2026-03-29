'use client'

import { useState, useEffect }     from 'react'
import Link                         from 'next/link'
import { usePathname }              from 'next/navigation'
import { Menu, X, Gauge, Heart }    from 'lucide-react'
import { Button }                   from '@/components/ui/button'
import { motion, AnimatePresence }  from 'framer-motion'
import { cn }                       from '@/lib/utils/cn'

const navLinks = [
  { href: '/',            label: 'Strona główna', emoji: '🏠' },
  { href: '/news',        label: 'Aktualności',   emoji: '📰' },
  { href: '/fleet',       label: 'Flota',         emoji: '🚛' },
  { href: '/rankings',    label: 'Rankingi',      emoji: '🏆' },
  { href: '/members',     label: 'Kierowcy',      emoji: '👥' },
  { href: '/recruitment', label: 'Rekrutacja',    emoji: '📋' },
  { href: '/hub/bridge',  label: 'ETS2 Bridge',   emoji: '🔗' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname        = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (pathname.startsWith('/hub') || pathname.startsWith('/admin')) return null

  const isSupportActive = pathname === '/support'

  return (
    <div className="md:hidden">

      {/* Burger */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileTap={{ scale: 0.9 }}
        className="w-9 h-9 rounded-lg bg-zinc-800/60 border border-zinc-700/60
                   flex items-center justify-center
                   text-zinc-400 hover:text-white transition-colors"
        aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0,   opacity: 1 }}
            exit={{   rotate:  90,  opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-16 left-0 right-0 z-50
                       bg-zinc-950/98 backdrop-blur-xl
                       border-b border-white/10
                       shadow-2xl shadow-black/40"
          >
            <div className="px-4 py-3 space-y-0.5">

              {/* Linki nawigacyjne */}
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0   }}
                    transition={{ delay: 0.03 * i, duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl',
                        'text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5',
                      )}
                    >
                      <span className="text-base w-5 text-center">{link.emoji}</span>
                      {link.label}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </Link>
                  </motion.div>
                )
              })}

              {/* ── Separator + Wesprzyj ────────────────────── */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0   }}
                transition={{ delay: 0.03 * navLinks.length, duration: 0.2 }}
              >
                <div className="h-px bg-zinc-800/80 mx-1 my-1" />
                <Link
                  href="/support"
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl',
                    'text-sm font-medium transition-colors',
                    isSupportActive
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'text-zinc-600 hover:text-red-400 hover:bg-red-500/5',
                  )}
                >
                  <motion.span
                    className="text-base w-5 text-center"
                    animate={
                      !isSupportActive
                        ? { scale: [1, 1.3, 1] }
                        : {}
                    }
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      repeatDelay: 4,
                    }}
                  >
                    <Heart className={cn(
                      'w-4 h-4 mx-auto',
                      isSupportActive ? 'fill-red-400 text-red-400' : 'text-zinc-600',
                    )} />
                  </motion.span>
                  Wesprzyj nas
                  {isSupportActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" />
                  )}
                  {!isSupportActive && (
                    <span className="ml-auto text-[10px] font-bold text-zinc-700
                                     bg-zinc-800 px-2 py-0.5 rounded-full">
                      od 15 PLN
                    </span>
                  )}
                </Link>
              </motion.div>

              {/* ── CTA: Zaloguj + Hub ──────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.2 }}
                className="pt-3 mt-1 border-t border-white/[0.06] grid grid-cols-2 gap-2"
              >
                <Link href="/login">
                  <Button
                    variant="outline" size="sm"
                    className="w-full border-zinc-700 text-zinc-300 hover:text-white"
                  >
                    Zaloguj
                  </Button>
                </Link>
                <Link href="/hub">
                  <Button
                    size="sm"
                    className="w-full bg-amber-500 text-black
                               hover:bg-amber-400 font-bold gap-1.5"
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    Hub
                  </Button>
                </Link>
              </motion.div>
            </div>

            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}