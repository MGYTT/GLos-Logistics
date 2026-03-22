'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

const navLinks = [
  { href: '/',            label: 'Strona główna' },
  { href: '/news',        label: 'Aktualności'   },
  { href: '/fleet',       label: 'Flota'         },
  { href: '/rankings',    label: 'Rankingi'      },
  { href: '/members',     label: 'Kierowcy'      },
  { href: '/recruitment', label: 'Rekrutacja'    },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // ✅ W /hub/* działa HubBottomNav — tu nic nie renderuj
  if (pathname.startsWith('/hub')) return null

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-zinc-400 hover:text-white transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-16 left-0 right-0 bg-zinc-950/98
                       backdrop-blur-xl border-b border-white/10 z-50"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-white/10 flex gap-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" size="sm"
                    className="w-full border-zinc-700">
                    Zaloguj
                  </Button>
                </Link>
                <Link href="/hub" className="flex-1">
                  <Button size="sm"
                    className="w-full bg-amber-500 text-black
                               hover:bg-amber-400 font-bold">
                    Hub
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
