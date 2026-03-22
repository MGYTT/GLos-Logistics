'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MobileNav } from './MobileNav'
import { Truck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navLinks = [
  { href: '/news',        label: 'Aktualności' },
  { href: '/fleet',       label: 'Flota'       },
  { href: '/rankings',    label: 'Rankingi'    },
  { href: '/members',     label: 'Kierowcy'    },
  { href: '/recruitment', label: 'Rekrutacja'  },
  { href: '/hub/bridge', label: 'ETS2 Bridge' },

]

export function Navbar() {
  const pathname  = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden]     = useState(false)
  const [lastY, setLastY]       = useState(0)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 20)
    setHidden(y > lastY && y > 80)
    setLastY(y)
  })

  return (
    <motion.header
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-zinc-950/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center glow-amber"
          >
            <Truck className="w-5 h-5 text-black" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-black text-xl text-gradient"
          >
            GLos Logistics
          </motion.span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link, i) => {
            const isActive = pathname === link.href
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-amber-500/10 rounded-lg border border-amber-500/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
            >
              Zaloguj
            </Button>
          </Link>
          <Link href="/hub">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                className="bg-amber-500 text-black hover:bg-amber-400 font-bold gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
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
