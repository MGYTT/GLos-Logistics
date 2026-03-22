'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Truck, Calendar,
  BarChart3, FileText, Settings, ArrowLeft,
  Wallet, Newspaper, ChevronRight, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Sekcje nawigacji ──────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Główne',
    items: [
      { href: '/admin',         icon: LayoutDashboard, label: 'Przegląd',   color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
      { href: '/admin/stats',   icon: BarChart3,       label: 'Statystyki', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    ],
  },
  {
    label: 'Zarządzanie',
    items: [
      { href: '/admin/members',     icon: Users,     label: 'Członkowie', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
      { href: '/admin/fleet',       icon: Truck,     label: 'Flota',      color: 'text-teal-400',  bg: 'bg-teal-400/10',  border: 'border-teal-400/20'  },
      { href: '/admin/wallet',      icon: Wallet,    label: 'Portfele',   color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
      { href: '/admin/recruitment', icon: FileText,  label: 'Podania',    color: 'text-orange-400',bg: 'bg-orange-400/10',border: 'border-orange-400/20'},
    ],
  },
  {
    label: 'Treści',
    items: [
      { href: '/admin/news',   icon: Newspaper, label: 'Aktualności', color: 'text-pink-400',  bg: 'bg-pink-400/10',  border: 'border-pink-400/20'  },
      { href: '/admin/events', icon: Calendar,  label: 'Wydarzenia',  color: 'text-cyan-400',  bg: 'bg-cyan-400/10',  border: 'border-cyan-400/20'  },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', icon: Settings, label: 'Ustawienia', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' },
    ],
  },
]

// ─── Komponent ─────────────────────────────────
export function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    return href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col z-40
                      bg-zinc-950/95 backdrop-blur-xl
                      border-r border-zinc-800/80">

      {/* ── Logo / nagłówek ─────────────────── */}
      <div className="h-16 flex items-center gap-3 px-5
                      border-b border-zinc-800/80 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/20
                        flex items-center justify-center">
          <Shield className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-black text-white leading-none">Admin Panel</p>
          <p className="text-[10px] text-zinc-600 mt-0.5 leading-none">
            Panel zarządzania
          </p>
        </div>
      </div>

      {/* ── Nawigacja ───────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5
                      scrollbar-thin scrollbar-track-transparent
                      scrollbar-thumb-zinc-800">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {/* Etykieta sekcji */}
            <p className="text-[10px] font-semibold text-zinc-600
                          uppercase tracking-widest px-3 mb-1.5">
              {section.label}
            </p>

            <div className="space-y-0.5">
              {section.items.map(({ href, icon: Icon, label, color, bg, border }) => {
                const active = isActive(href)

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl',
                      'text-sm font-medium transition-all duration-150',
                      active
                        ? `${bg} ${border} border ${color}`
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent',
                    )}
                  >
                    {/* Ikona */}
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      active ? bg : 'bg-zinc-800/60 group-hover:bg-zinc-700/60',
                    )}>
                      <Icon className={cn(
                        'w-3.5 h-3.5 transition-colors',
                        active ? color : 'text-zinc-500 group-hover:text-zinc-300',
                      )} />
                    </div>

                    {/* Label */}
                    <span className="flex-1 truncate">{label}</span>

                    {/* Chevron przy aktywnym */}
                    {active && (
                      <ChevronRight className={cn('w-3.5 h-3.5 shrink-0', color)} />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Stopka ──────────────────────────── */}
      <div className="shrink-0 p-3 border-t border-zinc-800/80 space-y-1">
        <Link
          href="/hub"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60
                     transition-all group border border-transparent"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-800/60 group-hover:bg-zinc-700/60
                          flex items-center justify-center shrink-0 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-500
                                  group-hover:text-zinc-300 transition-colors
                                  group-hover:-translate-x-0.5 duration-150" />
          </div>
          <span className="font-medium">Wróć do Hub</span>
        </Link>
      </div>
    </aside>
  )
}
