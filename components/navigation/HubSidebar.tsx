'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Map, Package, Calendar,
  MessageSquare, User, Truck, LogOut, Shield, Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { Wallet } from 'lucide-react'
import { ShoppingBag } from 'lucide-react';
const navItems = [
  { href: '/hub',          icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/hub/live',     icon: Radio,           label: 'Na żywo',
    dot: true /* pulsujący zielony dot */ },
  { href: '/hub/livemap',  icon: Map,             label: 'Live Mapa'  },
  { href: '/hub/jobs',     icon: Package,         label: 'Moje Joby'  },
  { href: '/hub/events',   icon: Calendar,        label: 'Wydarzenia' },
  { href: '/hub/wallet', icon: Wallet,      label: 'Portfel'  },
  { href: '/hub/shop',   icon: ShoppingBag, label: 'Sklep'    },
  { href: '/hub/chat',     icon: MessageSquare,   label: 'Chat'       },
  { href: '/hub/profile',  icon: User,            label: 'Profil'     },
]

const ADMIN_RANKS = ['Owner', 'Manager']

export function HubSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [rank, setRank] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRank() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('members')
        .select('rank')
        .eq('id', user.id)
        .single()
      setRank(data?.rank ?? null)
    }
    fetchRank()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isAdmin = rank && ADMIN_RANKS.includes(rank)

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-zinc-900/80
                      backdrop-blur-xl border-r border-white/10
                      flex flex-col z-40">

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500 rounded-md flex items-center justify-center">
            <Truck className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="font-bold text-gradient">GLos Logistics</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, dot }) => {
          const active = href === '/hub'
            ? pathname === '/hub'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-all',
                active
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5',
              )}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {/* Pulsujący dot dla "Na żywo" */}
                {dot && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full
                                     rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2
                                     bg-green-500" />
                  </span>
                )}
              </div>
              {label}
            </Link>
          )
        })}

        {/* Admin link */}
        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <div className="h-px bg-zinc-800" />
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-all',
                pathname.startsWith('/admin')
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-red-400/50 hover:text-red-400 hover:bg-red-400/5',
              )}
            >
              <Shield className="w-4 h-4" />
              Panel Admina
            </Link>
          </>
        )}
      </nav>

      {/* Wyloguj */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg
                     text-sm text-zinc-500 hover:text-red-400
                     hover:bg-red-400/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Wyloguj
        </button>
      </div>
    </aside>
  )
}
