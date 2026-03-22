'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, Package,
  BarChart3, ArrowLeft, Shield, Truck,
  Calendar, Wallet, Newspaper, Settings,
  ChevronRight,
} from 'lucide-react'
import { cn }          from '@/lib/utils/cn'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ─── Sekcje ────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Główne',
    items: [
      { href: '/admin',       icon: LayoutDashboard, label: 'Przegląd',    color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
      { href: '/admin/stats', icon: BarChart3,       label: 'Statystyki',  color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    ],
  },
  {
    label: 'Zarządzanie',
    items: [
      { href: '/admin/members',     icon: Users,     label: 'Członkowie',  color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
      { href: '/admin/fleet',       icon: Truck,     label: 'Flota',       color: 'text-teal-400',   bg: 'bg-teal-400/10',   border: 'border-teal-400/20'   },
      { href: '/admin/jobs',        icon: Package,   label: 'Zlecenia',    color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
      { href: '/admin/wallet',      icon: Wallet,    label: 'Portfele',    color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20'  },
      { href: '/admin/recruitment', icon: FileText,  label: 'Podania',     color: 'text-pink-400',   bg: 'bg-pink-400/10',   border: 'border-pink-400/20'   },
    ],
  },
  {
    label: 'Treści',
    items: [
      { href: '/admin/news',   icon: Newspaper, label: 'Aktualności', color: 'text-cyan-400',  bg: 'bg-cyan-400/10',  border: 'border-cyan-400/20'  },
      { href: '/admin/events', icon: Calendar,  label: 'Wydarzenia',  color: 'text-rose-400',  bg: 'bg-rose-400/10',  border: 'border-rose-400/20'  },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', icon: Settings, label: 'Ustawienia', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' },
    ],
  },
]

// ─── Props ─────────────────────────────────────
interface Props {
  member: {
    rank:       string
    username:   string
    avatar_url?: string | null
  }
}

// ─── Komponent ─────────────────────────────────
export function AdminSidebar({ member }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    return href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 z-40
                      bg-zinc-950/98 backdrop-blur-xl border-r border-zinc-800/80">

      {/* ── Nagłówek ────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4
                      border-b border-zinc-800/80 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25
                        flex items-center justify-center shrink-0">
          <Shield className="w-4.5 h-4.5 text-red-400" />
        </div>
        <div className="min-w-0">
          <p className="font-black text-sm text-white leading-none">Admin Panel</p>
          <p className="text-[10px] text-red-400/80 font-semibold mt-0.5 leading-none
                        uppercase tracking-wider">
            {member.rank}
          </p>
        </div>
      </div>

      {/* ── Nawigacja ───────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-zinc-700
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
                      'text-sm font-medium transition-all duration-150 border',
                      active
                        ? `${bg} ${border} ${color}`
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 border-transparent',
                    )}
                  >
                    {/* Ikona */}
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      'transition-colors duration-150',
                      active
                        ? bg
                        : 'bg-zinc-800/70 group-hover:bg-zinc-700/70',
                    )}>
                      <Icon className={cn(
                        'w-3.5 h-3.5 transition-colors',
                        active ? color : 'text-zinc-500 group-hover:text-zinc-300',
                      )} />
                    </div>

                    <span className="flex-1 truncate">{label}</span>

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

      {/* ── Profil + powrót ─────────────────── */}
      <div className="shrink-0 border-t border-zinc-800/80">

        {/* Karta użytkownika */}
        <div className="flex items-center gap-3 px-4 py-3
                        border-b border-zinc-800/50">
          <Avatar className="w-8 h-8 shrink-0 border border-zinc-700">
            <AvatarImage src={member.avatar_url ?? ''} />
            <AvatarFallback className="bg-red-500/10 text-red-400
                                       text-xs font-black">
              {member.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-zinc-200 truncate leading-none">
              {member.username}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5 leading-none">
              Panel administracyjny
            </p>
          </div>
        </div>

        {/* Wróć do Hub */}
        <div className="p-3">
          <Link
            href="/hub"
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-sm text-zinc-500 hover:text-zinc-200
                       hover:bg-zinc-800/50 transition-all border
                       border-transparent hover:border-zinc-800"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-800/70 group-hover:bg-zinc-700/70
                            flex items-center justify-center shrink-0 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300
                                    group-hover:-translate-x-0.5 transition-all duration-150" />
            </div>
            <span className="font-medium">Wróć do Hub</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
