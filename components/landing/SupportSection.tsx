'use client'

import { motion, useInView } from 'framer-motion'
import { useRef }             from 'react'
import Link                   from 'next/link'
import type { Variants, Transition } from 'framer-motion'
import {
  Heart, Zap, Shield,
  ChevronRight, Sparkles, Coffee,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Animacje ──────────────────────────────────────────────
const EASE = [0.25, 0.1, 0.25, 1] as [number, number, number, number]

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease:     EASE,
      delay:    i * 0.1,
    } as Transition,
  }),
}

const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const staggerDelayed: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

// ─── Plany wsparcia ────────────────────────────────────────
const TIERS = [
  {
    name:    'Supporter',
    emoji:   '☕',
    icon:    Coffee,
    price:   '5',
    color:   'text-zinc-300',
    bg:      'bg-zinc-800/60',
    border:  'border-zinc-700/60',
    glow:    '',
    popular: false,
    perks: [
      'Specjalna rola na Discordzie',
      'Dostęp do kanału #supporterzy',
      'Nasze podziękowania',
    ],
  },
  {
    name:    'Driver Pro',
    emoji:   '🚛',
    icon:    Zap,
    price:   '10',
    color:   'text-amber-400',
    bg:      'bg-amber-500/5',
    border:  'border-amber-500/30',
    glow:    'shadow-amber-500/10',
    popular: true,
    perks: [
      'Wszystko z planu Supporter',
      'Rola VIP na Discordzie',
      'Priorytet w rekrutacji',
      'Ekskluzywne ogłoszenia przed wszystkimi',
    ],
  },
  {
    name:    'Elite',
    emoji:   '👑',
    icon:    Shield,
    price:   '20',
    color:   'text-purple-400',
    bg:      'bg-purple-500/5',
    border:  'border-purple-500/30',
    glow:    'shadow-purple-500/10',
    popular: false,
    perks: [
      'Wszystko z planu Driver Pro',
      'Rola Elite na Discordzie',
      'Wpływ na kierunek VTC',
      'Dedykowany shoutout na serwerze',
    ],
  },
] as const

type Tier = typeof TIERS[number]

// ─── Karta planu ───────────────────────────────────────────
function TierCard({ tier, index }: { tier: Tier; index: number }) {
  const Icon = tier.icon

  return (
    <motion.div
      custom={index * 0.15}
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={cn(
        'relative flex flex-col rounded-2xl border p-6',
        'transition-colors duration-300',
        tier.bg,
        tier.border,
        tier.glow && `shadow-xl ${tier.glow}`,
      )}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full
                           bg-amber-500 text-black text-[11px] font-black
                           shadow-lg shadow-amber-500/30 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            Najpopularniejszy
          </span>
        </div>
      )}

      {/* Ikona + nazwa */}
      <div className="flex items-center gap-3 mb-5 mt-2">
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0',
          tier.popular ? 'bg-amber-500/15' : 'bg-zinc-800',
        )}>
          {tier.emoji}
        </div>
        <div>
          <h3 className={cn('font-black text-lg leading-none', tier.color)}>
            {tier.name}
          </h3>
          <p className="text-xs text-zinc-600 mt-0.5">miesięcznie</p>
        </div>
        <div className="ml-auto text-right">
          <span className={cn('text-3xl font-black', tier.color)}>
            ${tier.price}
          </span>
          <span className="text-xs text-zinc-600">/mies.</span>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-zinc-800/80 mb-5" />

      {/* Perki */}
      <ul className="space-y-2.5 flex-1 mb-6">
        {tier.perks.map(perk => (
          <li key={perk} className="flex items-start gap-2.5 text-sm text-zinc-400">
            <span className={cn('mt-0.5 shrink-0', tier.color)}>✓</span>
            {perk}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="https://www.patreon.com/cw/GLosLogistics"
        target="_blank"
        rel="noopener noreferrer"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'w-full py-3 rounded-xl text-sm font-black',
            'flex items-center justify-center gap-2',
            'transition-all duration-200',
            tier.popular
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-600',
          )}
        >
          <Icon className="w-4 h-4" />
          Wybierz plan
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>
      </Link>
    </motion.div>
  )
}

// ─── Główna sekcja ─────────────────────────────────────────
export function SupportSection() {
  const ref    = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">

      {/* Gradient tła */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950
                      via-zinc-950/95 to-zinc-950 pointer-events-none" />

      {/* Glow dekoracyjny */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[700px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]
                   pointer-events-none"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4">

        {/* ── Header ──────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="text-center mb-16"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            border border-red-500/30 bg-red-500/10 text-red-400
                            text-sm font-medium">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Heart className="w-3.5 h-3.5 fill-red-400" />
              </motion.div>
              Wesprzyj GLos Logistics
            </div>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight"
          >
            Pomóż nam{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400
                             bg-clip-text text-transparent">
              rozwijać VTC
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed"
          >
            Twoje wsparcie pozwala nam utrzymywać serwery, rozwijać nowe funkcje
            i organizować ekskluzywne konwoje dla całej społeczności.
          </motion.p>
        </motion.div>

        {/* ── Karty planów ────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerDelayed}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14"
        >
          {TIERS.map((tier, i) => (
            <TierCard key={tier.name} tier={tier} index={i} />
          ))}
        </motion.div>

        {/* ── Dolny CTA — jednorazowe wsparcie ────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
          className="relative flex flex-col sm:flex-row items-center justify-between
                     gap-6 bg-gradient-to-r from-zinc-900 to-zinc-900/80
                     border border-zinc-800 rounded-2xl px-8 py-6 overflow-hidden"
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent
                       via-white/[0.02] to-transparent pointer-events-none"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
          />

          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20
                            flex items-center justify-center shrink-0 text-xl">
              ⭐
            </div>
            <div>
              <p className="font-black text-white">Jednorazowe wsparcie</p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Nie chcesz subskrypcji? Wesprzyj nas jednorazową kwotą na Patreonie.
              </p>
            </div>
          </div>

          <Link
            href="https://www.patreon.com/cw/GLosLogistics"
            target="_blank"
            rel="noopener noreferrer"
            className="relative shrink-0"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-black
                         text-sm bg-amber-500 hover:bg-amber-400 text-black
                         transition-colors shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              <Heart className="w-4 h-4 fill-black" />
              Wesprzyj na Patreonie
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </Link>
        </motion.div>

        {/* ── Disclaimer ──────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center text-xs text-zinc-700 mt-6"
        >
          Wsparcie jest dobrowolne i nie wpływa na dostęp do funkcji VTC.
          Dziękujemy każdemu supporterowi! 🚛
        </motion.p>

      </div>
    </section>
  )
}