'use client'

import { motion, useInView }         from 'framer-motion'
import { useRef }                     from 'react'
import Link                           from 'next/link'
import type { Variants, Transition }  from 'framer-motion'
import {
  Heart, ChevronRight, Sparkles,
  Wallet, Users, Zap, Star,
  ShieldCheck, Crown, Lock,
  BadgeCheck, FlaskConical, Vote,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Stałe ────────────────────────────────────────────────
const EASE  = [0.25, 0.1, 0.25, 1] as [number, number, number, number]
const LINK  = 'https://www.patreon.com/cw/GLosLogistics'

// ─── Variants ─────────────────────────────────────────────
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: EASE, delay: i * 0.1 } as Transition,
  }),
}
const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09 } },
}
const staggerCards: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } },
}

// ─── Typy ─────────────────────────────────────────────────
interface Perk {
  icon:      React.ElementType
  text:      string
  highlight: boolean
}

interface TierDef {
  id:       string
  name:     string
  subtitle: string
  emoji:    string
  price:    string
  period:   string
  color:    string
  dimColor: string
  bg:       string
  border:   string
  btnClass: string
  shadow:   string
  popular:  boolean
  bonus:    { label: string; value: string }
  perks:    Perk[]
}

// ─── Dane planów ───────────────────────────────────────────
const TIERS: TierDef[] = [
  {
    id:       'supporter',
    name:     'Kierowca Wspierający',
    subtitle: 'Idealny start dla każdego fana VTC',
    emoji:    '🚚',
    price:    '15',
    period:   'PLN / mies.',
    color:    'text-amber-400',
    dimColor: 'text-amber-400/60',
    bg:       'bg-amber-500/5',
    border:   'border-amber-500/25',
    btnClass: 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25',
    shadow:   'shadow-amber-500/10',
    popular:  false,
    bonus: { label: 'Bonus startowy', value: '800 VTC€' },
    perks: [
      { icon: Wallet,      text: '800 VTC€ bonusu startowego',                       highlight: true  },
      { icon: ShieldCheck, text: 'Ekskluzywna rola „Supporter" na Discordzie',        highlight: false },
      { icon: BadgeCheck,  text: 'Odznaka Supporter w profilu VTC',                   highlight: false },
      { icon: FlaskConical,text: 'Wczesny dostęp do update\'ów i nowych funkcji',     highlight: false },
      { icon: Users,       text: 'Nick na liście wspierających na stronie (opcja)',   highlight: false },
    ],
  },
  {
    id:       'premium',
    name:     'Kierowca Premium',
    subtitle: 'Maksymalne korzyści dla ambitnych kierowców',
    emoji:    '👑',
    price:    '25',
    period:   'PLN / mies.',
    color:    'text-purple-400',
    dimColor: 'text-purple-400/60',
    bg:       'bg-purple-500/5',
    border:   'border-purple-500/30',
    btnClass: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white shadow-purple-500/30',
    shadow:   'shadow-purple-500/15',
    popular:  true,
    bonus: { label: 'Bonus miesięczny', value: '2 200 VTC€' },
    perks: [
      { icon: Wallet,      text: '2 200 VTC€ bonusu miesięcznie do portfela',         highlight: true  },
      { icon: Star,        text: 'Priorytet w zapisach na konwoje i eventy',           highlight: true  },
      { icon: Crown,       text: 'Custom slot w flocie — oznaczenie Premium',         highlight: false },
      { icon: FlaskConical,text: 'Beta testy live mapy, czatu i update\'ów ekonomii', highlight: false },
      { icon: ShieldCheck, text: 'Rola „Premium" + kanał Premium Lounge na Discordzie', highlight: false },
      { icon: BadgeCheck,  text: 'Badge Premium w profilu — widoczny dla wszystkich', highlight: false },
      { icon: Vote,        text: 'Głos podwójny w ankietach rozwoju VTC',             highlight: false },
    ],
  },
]

// ─── Badge porównawczy ─────────────────────────────────────
function BonusBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between bg-zinc-900/80
                    border border-zinc-800 rounded-xl px-4 py-3 mb-5">
      <span className="text-xs text-zinc-500 font-medium">{label}</span>
      <span className={cn('text-sm font-black', color)}>{value}</span>
    </div>
  )
}

// ─── Karta planu ───────────────────────────────────────────
function TierCard({ tier, index }: { tier: TierDef; index: number }) {
  return (
    <motion.div
      custom={index * 0.12}
      variants={fadeUp}
      className={cn(
        'relative flex flex-col rounded-2xl border p-7 transition-colors duration-300',
        tier.bg, tier.border,
        tier.shadow && `shadow-2xl ${tier.shadow}`,
      )}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <motion.span
            animate={{ boxShadow: ['0 0 12px #a855f740', '0 0 24px #a855f770', '0 0 12px #a855f740'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full
                       bg-gradient-to-r from-purple-500 to-purple-600
                       text-white text-[11px] font-black whitespace-nowrap
                       shadow-lg shadow-purple-500/40"
          >
            <Sparkles className="w-3 h-3" />
            Najpopularniejszy
          </motion.span>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 mt-1">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl leading-none">{tier.emoji}</span>
          <div>
            <h3 className={cn('font-black text-xl leading-tight', tier.color)}>
              {tier.name}
            </h3>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              {tier.subtitle}
            </p>
          </div>
        </div>

        {/* Cena */}
        <div className="flex items-end gap-1.5 mt-4">
          <span className={cn('text-5xl font-black leading-none', tier.color)}>
            {tier.price}
          </span>
          <div className="mb-1">
            <span className="text-xs text-zinc-500 font-medium block leading-tight">
              {tier.period}
            </span>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-zinc-800/70 mb-5" />

      {/* Bonus VTC badge */}
      <BonusBadge
        label={tier.bonus.label}
        value={tier.bonus.value}
        color={tier.color}
      />

      {/* Perki */}
      <ul className="space-y-3 flex-1 mb-7">
        {tier.perks.map((perk) => {
          const Icon = perk.icon
          return (
            <li
              key={perk.text}
              className={cn(
                'flex items-start gap-3 text-sm leading-snug',
                perk.highlight ? tier.color : 'text-zinc-400',
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5',
                perk.highlight ? `${tier.bg} border ${tier.border}` : 'bg-zinc-800/60',
              )}>
                <Icon className={cn('w-3 h-3', perk.highlight ? tier.color : 'text-zinc-600')} />
              </div>
              <span className={perk.highlight ? 'font-semibold' : ''}>
                {perk.text}
              </span>
            </li>
          )
        })}
      </ul>

      {/* CTA */}
      <Link
        href={LINK}
        target="_blank"
        rel="noopener noreferrer"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'w-full py-3.5 rounded-xl text-sm font-black',
            'flex items-center justify-center gap-2',
            'transition-all duration-200 shadow-lg',
            tier.btnClass,
          )}
        >
          <Heart className="w-4 h-4" />
          Wesprzyj — {tier.price} PLN/mies.
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>
      </Link>

      {/* Lock info */}
      <p className="flex items-center justify-center gap-1.5 text-[11px]
                    text-zinc-700 mt-3">
        <Lock className="w-3 h-3" />
        Anuluj w dowolnym momencie
      </p>
    </motion.div>
  )
}

// ─── Porównanie planów (tabela) ────────────────────────────
const COMPARE_ROWS = [
  { label: 'Bonus VTC€',              supporter: '800 VTC€',    premium: '2 200 VTC€'   },
  { label: 'Rola Discord',            supporter: 'Supporter',   premium: 'Premium VIP'  },
  { label: 'Badge w profilu',         supporter: '✓',           premium: '✓'            },
  { label: 'Wczesny dostęp',          supporter: '✓',           premium: '✓'            },
  { label: 'Priorytet na konwoje',    supporter: '—',           premium: '✓'            },
  { label: 'Custom slot w flocie',    supporter: '—',           premium: '✓'            },
  { label: 'Beta testy funkcji',      supporter: 'Screeny',     premium: 'Live beta'    },
  { label: 'Premium Lounge',          supporter: '—',           premium: '✓'            },
  { label: 'Głos w ankietach',        supporter: 'x1',          premium: 'x2'           },
] as const

function CompareTable({ inView }: { inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
      className="mt-12 overflow-x-auto"
    >
      <div className="min-w-[480px]">
        {/* Nagłówek */}
        <div className="grid grid-cols-3 gap-px bg-zinc-800/40 rounded-t-xl overflow-hidden mb-px">
          <div className="bg-zinc-900/80 px-5 py-3 text-xs text-zinc-600 uppercase tracking-wider font-semibold">
            Funkcja
          </div>
          <div className="bg-amber-500/5 px-5 py-3 text-center">
            <span className="text-xs font-black text-amber-400">🚚 Wspierający</span>
          </div>
          <div className="bg-purple-500/5 px-5 py-3 text-center">
            <span className="text-xs font-black text-purple-400">👑 Premium</span>
          </div>
        </div>

        {/* Wiersze */}
        <div className="rounded-b-xl overflow-hidden border border-zinc-800/60 divide-y divide-zinc-800/40">
          {COMPARE_ROWS.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                'grid grid-cols-3 gap-px transition-colors',
                i % 2 === 0 ? 'bg-zinc-900/40' : 'bg-zinc-900/20',
              )}
            >
              <div className="px-5 py-3 text-xs text-zinc-500">{row.label}</div>
              <div className="px-5 py-3 text-center text-xs font-medium text-amber-400/80">
                {row.supporter}
              </div>
              <div className="px-5 py-3 text-center text-xs font-bold text-purple-400">
                {row.premium}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Sekcja „Nasi Wspierający" placeholder ─────────────────
function SupportersRow({ inView }: { inView: boolean }) {
  const avatars = ['M', 'K', 'A', 'P', 'T', '+']
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
      className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
    >
      <div className="flex -space-x-2.5">
        {avatars.map((a, i) => (
          <div
            key={i}
            className={cn(
              'w-8 h-8 rounded-full border-2 border-zinc-950',
              'flex items-center justify-center text-[11px] font-black',
              i === 5
                ? 'bg-zinc-800 text-zinc-400'
                : 'bg-amber-500/20 text-amber-400',
            )}
          >
            {a}
          </div>
        ))}
      </div>
      <p className="text-sm text-zinc-500">
        Dołącz do grona{' '}
        <span className="text-amber-400 font-bold">wspierających kierowców</span>
        {' '}GLos Logistics
      </p>
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

      {/* Glow */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[800px] h-[500px] bg-purple-500/5 rounded-full blur-[140px]
                   pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/3 left-1/3 w-[500px] h-[300px]
                   bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4">

        {/* ── Header ──────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            border border-red-500/30 bg-red-500/10
                            text-red-400 text-sm font-medium">
              <motion.div
                animate={{ scale: [1, 1.35, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
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
          variants={staggerCards}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          {TIERS.map((tier, i) => (
            <TierCard key={tier.id} tier={tier} index={i} />
          ))}
        </motion.div>

        {/* ── Tabela porównawcza ───────────────────────────── */}
        <CompareTable inView={inView} />

        {/* ── Avatary wspierających ────────────────────────── */}
        <SupportersRow inView={inView} />

        {/* ── Disclaimer ──────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center text-xs text-zinc-700 mt-6"
        >
          Wsparcie jest dobrowolne i nie wpływa na dostęp do podstawowych funkcji VTC.
          Płatności obsługuje Patreon. Anuluj w dowolnym momencie. 🚛
        </motion.p>

      </div>
    </section>
  )
}