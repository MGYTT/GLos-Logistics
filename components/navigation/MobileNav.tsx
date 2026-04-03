'use client'

import { useState, useEffect }     from 'react'
import Link                         from 'next/link'
import { usePathname }              from 'next/navigation'
import { Menu, X, Gauge, Heart, Truck } from 'lucide-react'
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
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileTap={{ scale: 0.88 }}
        className="w-9 h-9 rounded-xl bg-zinc-900/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-200"
        aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{   rotate:  90,  opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
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
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-16 bg-black/70 backdrop-blur-md z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-16 left-0 right-0 z-50 bg-zinc-950/98 backdrop-blur-2xl border-b border-white/[0.07] shadow-2xl shadow-black/60"
          >
            {/* Panel header */}
            <div className="px-4 pt-4 pb-2 flex items-center gap-3 border-b border-zinc-800/60 mb-1">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-md shadow-amber-500/30">
                <Truck className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-xs font-black text-gradient">GLos Logistics</p>
                <p className="text-[10px] text-zinc-600">Wirtualna firma transportowa</p>
              </div>
            </div>

            <div className="px-3 py-2 space-y-0.5">
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0   }}
                    transition={{ delay: 0.025 * i, duration: 0.22, ease: 'easeOut' }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]',
                      )}
                    >
                      <span className="text-base w-5 text-center select-none">{link.emoji}</span>
                      <span className="flex-1">{link.label}</span>
                      {isActive && (
                        <motion.span layoutId="mobile-indicator" className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </Link>
                  </motion.div>
                )
              })}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.2 }}
              >
                <div className="h-px bg-zinc-800/80 mx-1 my-2" />
                <Link
                  href="/support"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isSupportActive
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'text-zinc-600 hover:text-red-400 hover:bg-red-500/5',
                  )}
                >
                  <motion.span
                    className="w-5 text-center"
                    animate={!isSupportActive ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }}
                  >
                    <Heart className={cn('w-4 h-4 mx-auto', isSupportActive ? 'fill-red-400 text-red-400' : 'text-zinc-600')} />
                  </motion.span>
                  <span className="flex-1">Wesprzyj nas</span>
                  {!isSupportActive && (
                    <span className="text-[10px] font-bold text-zinc-700 bg-zinc-800/80 px-2 py-0.5 rounded-full">od 15 PLN</span>
                  )}
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.22 }}
                className="pt-3 mt-1 border-t border-white/[0.05] grid grid-cols-2 gap-2 pb-2"
              >
                <Link href="/login">
                  <Button variant="outline" size="sm" className="w-full border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-600 transition-all">
                    Zaloguj
                  </Button>
                </Link>
                <Link href="/hub">
                  <Button size="sm" className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold gap-1.5 shadow-md shadow-amber-500/20 relative overflow-hidden group">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    <Gauge className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">Hub</span>
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}