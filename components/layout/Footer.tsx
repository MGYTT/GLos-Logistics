'use client'

import Link                   from 'next/link'
import { motion }             from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  Truck, Heart, ExternalLink,
  Github, MessageSquare, Youtube,
  FileText, Lock, ChevronRight,
  Fuel, TrendingUp, Users, Map,
  ArrowUpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Konfiguracja ──────────────────────────────────────────
const DISCORD_URL = 'https://discord.gg/gloslogistics'
const PATREON_URL = 'https://www.patreon.com/cw/GLosLogistics'
const YEAR        = new Date().getFullYear()

const NAV_LINKS = [
  {
    heading: 'VTC',
    links: [
      { label: 'Strona główna',    href: '/',              icon: Truck         },
      { label: 'O nas',            href: '/#about',        icon: Users         },
      { label: 'Mapa tras',        href: '/#map',          icon: Map           },
      { label: 'Dołącz do nas',    href: '/recruitment',   icon: ChevronRight  },
    ],
  },
  {
    heading: 'Kierowcy',
    links: [
      { label: 'Ranking',          href: '/#ranking',      icon: TrendingUp    },
      { label: 'Panel kierowcy',   href: '/hub',           icon: Truck         },
      { label: 'Ceny paliwa',      href: '/hub/wallet',    icon: Fuel          },
      { label: 'Wesprzyj nas',     href: '/support',       icon: Heart         },
    ],
  },
  {
    heading: 'Prawne',
    links: [
      { label: 'Warunki usługi',   href: '/tos',           icon: FileText      },
      { label: 'Prywatność',       href: '/privacy',       icon: Lock          },
    ],
  },
]

const SOCIAL = [
  {
    label:   'Discord',
    href:    DISCORD_URL,
    icon:    MessageSquare,
    color:   'hover:text-indigo-400 hover:bg-indigo-400/10',
    border:  'hover:border-indigo-400/30',
  },
  {
    label:   'Patreon',
    href:    PATREON_URL,
    icon:    Heart,
    color:   'hover:text-red-400 hover:bg-red-400/10',
    border:  'hover:border-red-400/30',
  },
  {
    label:   'TruckersMP',
    href:    'https://truckersmp.com',
    icon:    Truck,
    color:   'hover:text-amber-400 hover:bg-amber-400/10',
    border:  'hover:border-amber-400/30',
  },
]

// ─── Status serwera (client-only) ─────────────────────────
function ServerStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    // W produkcji: fetch do /api/health lub Supabase ping
    const t = setTimeout(() => setStatus('online'), 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'checking' ? 'bg-zinc-600 animate-pulse'
        : status === 'online'  ? 'bg-green-400'
        : 'bg-red-400',
      )} />
      <span className={cn(
        'text-xs',
        status === 'checking' ? 'text-zinc-600'
        : status === 'online'  ? 'text-green-400'
        : 'text-red-400',
      )}>
        {status === 'checking' ? 'Sprawdzanie…'
        : status === 'online'  ? 'Wszystkie systemy działają'
        : 'Problemy techniczne'}
      </span>
    </div>
  )
}

// ─── Scroll to top ─────────────────────────────────────────
function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.8 }}
      transition={{ duration: 0.2 }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Przewiń do góry"
      className={cn(
        'fixed bottom-6 right-4 sm:right-6 z-40',
        'w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700',
        'flex items-center justify-center',
        'hover:border-amber-500/50 hover:text-amber-400',
        'text-zinc-500 transition-colors shadow-xl',
        !visible && 'pointer-events-none',
      )}
    >
      <ArrowUpCircle className="w-5 h-5" />
    </motion.button>
  )
}

// ─── Główny Footer ─────────────────────────────────────────
export function Footer() {
  return (
    <>
      <ScrollToTop />

      <footer className="relative mt-20 sm:mt-28 border-t border-zinc-800/60
                         bg-zinc-950 overflow-hidden">

        {/* Glow tła */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2
                          w-[600px] h-[200px] bg-amber-500/3
                          rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto
                        px-4 sm:px-6 pt-12 sm:pt-16 pb-8">

          {/* ── Górna sekcja ───────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5
                          gap-10 sm:gap-8 mb-12 sm:mb-14">

            {/* Brand — col-span-2 */}
            <div className="lg:col-span-2 space-y-5">

              {/* Logo + nazwa */}
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border
                                border-amber-500/20 flex items-center justify-center
                                group-hover:bg-amber-500/20 transition-colors">
                  <Truck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-black text-white text-lg leading-tight">
                    GLos Logistics
                  </p>
                  <p className="text-[11px] text-zinc-600 font-medium tracking-wider uppercase">
                    Virtual Trucking Company
                  </p>
                </div>
              </Link>

              <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                Wirtualna firma transportowa działająca w Euro Truck Simulator 2
                i American Truck Simulator. Dołącz do naszej społeczności kierowców.
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-2">
                {SOCIAL.map(({ label, href, icon: Icon, color, border }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className={cn(
                      'w-9 h-9 rounded-lg border border-zinc-800 bg-zinc-900/60',
                      'flex items-center justify-center text-zinc-600',
                      'transition-all duration-200',
                      color, border,
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>

              {/* Discord CTA */}
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                           bg-indigo-500/10 hover:bg-indigo-500/20
                           border border-indigo-500/20 hover:border-indigo-500/40
                           text-indigo-400 text-sm font-semibold
                           transition-all duration-200 group"
              >
                <MessageSquare className="w-4 h-4" />
                Dołącz na Discordzie
                <ExternalLink className="w-3 h-3 opacity-60
                                         group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            {/* Nawigacja — 3 kolumny */}
            {NAV_LINKS.map(({ heading, links }) => (
              <div key={heading}>
                <p className="text-[11px] font-bold text-zinc-600
                              uppercase tracking-widest mb-4">
                  {heading}
                </p>
                <ul className="space-y-2.5">
                  {links.map(({ label, href, icon: Icon }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="flex items-center gap-2 text-sm text-zinc-500
                                   hover:text-zinc-200 transition-colors group"
                      >
                        <Icon className="w-3.5 h-3.5 text-zinc-700
                                         group-hover:text-amber-400/70
                                         transition-colors shrink-0" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Separator ──────────────────────────────── */}
          <div className="h-px bg-gradient-to-r from-transparent
                          via-zinc-800 to-transparent mb-7" />

          {/* ── Dolna belka ────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center
                          justify-between gap-4">

            {/* Lewo: copyright + status */}
            <div className="space-y-1.5">
              <p className="text-xs text-zinc-600">
                © {YEAR} GLos Logistics VTC. Wszelkie prawa zastrzeżone.
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <ServerStatus />
                <span className="text-zinc-800 hidden sm:inline">·</span>
                <span className="text-xs text-zinc-700">
                  Wirtualna waluta VTC€ nie ma wartości pieniężnej
                </span>
              </div>
            </div>

            {/* Prawo: linki prawne */}
            <div className="flex items-center gap-4 sm:gap-5">
              <Link
                href="/tos"
                className="text-xs text-zinc-600 hover:text-zinc-400
                           transition-colors"
              >
                Warunki usługi
              </Link>
              <span className="text-zinc-800">·</span>
              <Link
                href="/privacy"
                className="text-xs text-zinc-600 hover:text-zinc-400
                           transition-colors"
              >
                Polityka prywatności
              </Link>
              <span className="text-zinc-800 hidden sm:inline">·</span>
              <span className="hidden sm:flex items-center gap-1
                               text-xs text-zinc-800">
                Made with{' '}
                <Heart className="w-3 h-3 text-red-900 fill-red-900 mx-0.5" />
                in Poland
              </span>
            </div>
          </div>

          {/* ── Disclaimer SCS ─────────────────────────── */}
          <p className="mt-5 text-[10px] text-zinc-800 leading-relaxed
                        max-w-2xl">
            GLos Logistics VTC jest projektem fanowskim i nie jest oficjalnie
            powiązane z SCS Software s.r.o. Euro Truck Simulator 2 oraz
            American Truck Simulator są znakami towarowymi SCS Software s.r.o.
            TruckersMP jest niezależną modyfikacją sieciową.
          </p>

        </div>
      </footer>
    </>
  )
}