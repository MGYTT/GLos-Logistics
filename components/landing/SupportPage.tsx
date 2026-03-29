'use client'

import { motion, useInView }        from 'framer-motion'
import { useRef }                    from 'react'
import Link                          from 'next/link'
import type { Variants, Transition } from 'framer-motion'
import {
  Heart, ChevronRight, Sparkles,
  Wallet, ShieldCheck, BadgeCheck,
  FlaskConical, Crown, Star, Users,
  Zap, Vote, Lock, Check,
  ArrowRight, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Stałe ────────────────────────────────────────────────
const EASE = [0.25, 0.1, 0.25, 1] as [number, number, number, number]
const LINK = 'https://www.patreon.com/cw/GLosLogistics'

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
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
}

// ─── Typy ─────────────────────────────────────────────────
interface Perk {
  icon:      React.ElementType
  text:      string
  highlight: boolean
}

// ─── Dane planów ───────────────────────────────────────────
const TIERS = [
  {
    id:       'supporter',
    name:     'Kierowca Wspierający',
    subtitle: 'Idealny start — pokaż że zależy Ci na VTC',
    emoji:    '🚚',
    price:    '15',
    color:    'text-amber-400',
    bg:       'bg-amber-500/5',
    border:   'border-amber-500/25',
    btnClass: 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25',
    glow:     'shadow-amber-500/10',
    popular:  false,
    bonus:    { label: 'Bonus startowy (jednorazowy)', value: '800 VTC€' },
    perks:    [
      { icon: Wallet,       text: '800 VTC€ bonusu startowego',                      highlight: true  },
      { icon: ShieldCheck,  text: 'Ekskluzywna rola „Supporter" na Discordzie',       highlight: false },
      { icon: BadgeCheck,   text: 'Odznaka Supporter w profilu VTC',                  highlight: false },
      { icon: FlaskConical, text: 'Wczesny dostęp do update\'ów i screenów',          highlight: false },
      { icon: Users,        text: 'Nick na liście wspierających (opcjonalnie)',        highlight: false },
    ] as Perk[],
  },
  {
    id:       'premium',
    name:     'Kierowca Premium',
    subtitle: 'Maksymalne korzyści dla ambitnych kierowców',
    emoji:    '👑',
    price:    '25',
    color:    'text-purple-400',
    bg:       'bg-purple-500/5',
    border:   'border-purple-500/30',
    btnClass: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white shadow-purple-500/30',
    glow:     'shadow-purple-500/15',
    popular:  true,
    bonus:    { label: 'Bonus miesięczny (co miesiąc)', value: '2 200 VTC€' },
    perks:    [
      { icon: Wallet,       text: '2 200 VTC€ bonusu miesięcznie do portfela',        highlight: true  },
      { icon: Star,         text: 'Priorytet w zapisach na konwoje i eventy',          highlight: true  },
      { icon: Crown,        text: 'Custom slot w flocie — oznaczenie Premium',        highlight: true  },
      { icon: FlaskConical, text: 'Beta testy live mapy, czatu i update\'ów ekonomii', highlight: false },
      { icon: ShieldCheck,  text: 'Rola „Premium" + Premium Lounge na Discordzie',    highlight: false },
      { icon: BadgeCheck,   text: 'Badge Premium w profilu — widoczny dla wszystkich', highlight: false },
      { icon: Vote,         text: 'Głos podwójny w ankietach rozwoju VTC',            highlight: false },
    ] as Perk[],
  },
] as const

// ─── Tabela porównawcza ────────────────────────────────────
const COMPARE = [
  { label: 'Bonus VTC€',            supporter: '800 VTC€',    premium: '2 200 VTC€/mies.' },
  { label: 'Rola Discord',          supporter: 'Supporter',   premium: 'Premium VIP'       },
  { label: 'Badge w profilu VTC',   supporter: true,          premium: true                },
  { label: 'Wczesny dostęp',        supporter: 'Screeny',     premium: 'Live beta'         },
  { label: 'Priorytet na konwoje',  supporter: false,         premium: true                },
  { label: 'Custom slot w flocie',  supporter: false,         premium: true                },
  { label: 'Premium Lounge',        supporter: false,         premium: true                },
  { label: 'Głos w ankietach',      supporter: 'x1',          premium: 'x2'                },
  { label: 'Nick na liście',        supporter: 'Opcjonalnie', premium: 'Opcjonalnie'       },
] as const

function CellValue({ val, color }: { val: string | boolean; color: string }) {
  if (val === true)  return <Check className={cn('w-4 h-4 mx-auto', color)} />
  if (val === false) return <span className="text-zinc-700">—</span>
  return <span className={cn('font-semibold', color)}>{val}</span>
}

// ─── FAQ ──────────────────────────────────────────────────
const FAQ = [
  {
    q: 'Kiedy otrzymam bonus VTC€?',
    a: 'Bonus startowy (Supporter) jest przyznawany jednorazowo po aktywacji subskrypcji. Bonus Premium jest dodawany automatycznie co miesiąc na początku okresu rozliczeniowego.',
  },
  {
    q: 'Czy mogę anulować subskrypcję?',
    a: 'Tak, w dowolnym momencie przez Patreon. Po anulowaniu zachowujesz korzyści do końca opłaconego okresu.',
  },
  {
    q: 'Czy wsparcie wpływa na dostęp do podstawowych funkcji VTC?',
    a: 'Nie. Wszystkie podstawowe funkcje platformy — joby, rankingi, mapa — są dostępne dla każdego kierowcy bez opłat.',
  },
  {
    q: 'Jak szybko dostanę rolę na Discordzie?',
    a: 'Role są przyznawane automatycznie przez bota w ciągu kilku minut od potwierdzenia płatności przez Patreon.',
  },
  {
    q: 'Czy mogę być anonimowym wspierającym?',
    a: 'Tak. Twój nick pojawi się na liście wspierających tylko jeśli wyrazisz na to zgodę — domyślnie pozostajesz anonimowy.',
  },
]

function FaqItem({ item, index }: { item: typeof FAQ[0]; index: number }) {
  return (
    <motion.div
      custom={index * 0.08}
      variants={fadeUp}
      className="border border-zinc-800/60 rounded-xl p-5
                 hover:border-zinc-700/60 transition-colors duration-200"
    >
      <p className="font-bold text-white mb-2 text-sm">{item.q}</p>
      <p className="text-sm text-zinc-500 leading-relaxed">{item.a}</p>
    </motion.div>
  )
}

// ─── Karta planu ───────────────────────────────────────────
function TierCard({ tier, index }: { tier: typeof TIERS[number]; index: number }) {
  return (
    <motion.div
      custom={index * 0.12}
      variants={fadeUp}
      className={cn(
        'relative flex flex-col rounded-2xl border p-7',
        'transition-colors duration-300',
        tier.bg, tier.border,
        `shadow-2xl ${tier.glow}`,
      )}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <motion.span
            animate={{ boxShadow: ['0 0 10px #a855f730', '0 0 22px #a855f760', '0 0 10px #a855f730'] }}
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
      <div className="mt-2 mb-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl leading-none">{tier.emoji}</span>
          <div>
            <h3 className={cn('font-black text-xl leading-tight', tier.color)}>
              {tier.name}
            </h3>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{tier.subtitle}</p>
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          <span className={cn('text-5xl font-black leading-none', tier.color)}>
            {tier.price}
          </span>
          <span className="text-xs text-zinc-500 font-medium mb-1">PLN / mies.</span>
        </div>
      </div>

      <div className="h-px bg-zinc-800/70 mb-5" />

      {/* Bonus badge */}
      <div className="flex items-center justify-between bg-zinc-900/80
                      border border-zinc-800 rounded-xl px-4 py-3 mb-5">
        <span className="text-xs text-zinc-500">{tier.bonus.label}</span>
        <span className={cn('text-sm font-black', tier.color)}>{tier.bonus.value}</span>
      </div>

      {/* Perki */}
      <ul className="space-y-3 flex-1 mb-7">
        {tier.perks.map(perk => {
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
              <span className={perk.highlight ? 'font-semibold' : ''}>{perk.text}</span>
            </li>
          )
        })}
      </ul>

      {/* CTA */}
      <Link href={LINK} target="_blank" rel="noopener noreferrer">
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
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-700 mt-3">
        <Lock className="w-3 h-3" />
        Anuluj w dowolnym momencie
      </p>
    </motion.div>
  )
}

// ─── Główny komponent strony ───────────────────────────────
export function SupportPage() {
  const heroRef    = useRef<HTMLDivElement>(null)
  const tiersRef   = useRef<HTMLDivElement>(null)
  const compareRef = useRef<HTMLDivElement>(null)
  const faqRef     = useRef<HTMLDivElement>(null)

  const tiersInView   = useInView(tiersRef,   { once: true, margin: '-60px' })
  const compareInView = useInView(compareRef, { once: true, margin: '-60px' })
  const faqInView     = useInView(faqRef,     { once: true, margin: '-60px' })

  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-x-hidden">

      {/* ── Glowy tła ─────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2
                     w-[800px] h-[500px] bg-purple-500/5 rounded-full blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/3 left-1/4
                     w-[500px] h-[300px] bg-amber-500/5 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 space-y-28">

        {/* ── Hero ────────────────────────────────────────── */}
        <motion.div
          ref={heroRef}
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="text-center pt-8"
        >
          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                            border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium">
              <motion.div
                animate={{ scale: [1, 1.35, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Heart className="w-3.5 h-3.5 fill-red-400" />
              </motion.div>
              Wesprzyj GLos Logistics
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl font-black text-white mb-5 leading-tight"
          >
            Razem budujemy{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400
                             bg-clip-text text-transparent">
              coś wyjątkowego
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Twoje wsparcie to nie tylko pieniądze — to inwestycja w społeczność,
            nowe funkcje i doświadczenia, z których korzystają wszyscy kierowcy GLos Logistics.
          </motion.p>

          {/* Statsy wsparcia */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-8 mb-10"
          >
            {[
              { value: '100%', label: 'idzie na serwery i dev' },
              { value: '2',    label: 'plany wsparcia'          },
              { value: '0',    label: 'obowiązków — pełna wolność' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black text-amber-400">{value}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp}>
            <Link href="#plans" scroll>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl
                           bg-amber-500 hover:bg-amber-400 text-black font-black
                           text-sm shadow-lg shadow-amber-500/25 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Zobacz plany wsparcia
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Plany ───────────────────────────────────────── */}
        <div ref={tiersRef} id="plans">
          <motion.div
            initial="hidden"
            animate={tiersInView ? 'visible' : 'hidden'}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-black text-white mb-3">
              Wybierz swój plan
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-500">
              Oba plany możesz anulować w dowolnym momencie przez Patreon.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={tiersInView ? 'visible' : 'hidden'}
            variants={staggerCards}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {TIERS.map((tier, i) => (
              <TierCard key={tier.id} tier={tier} index={i} />
            ))}
          </motion.div>
        </div>

        {/* ── Tabela porównawcza ───────────────────────────── */}
        <div ref={compareRef}>
          <motion.div
            initial="hidden"
            animate={compareInView ? 'visible' : 'hidden'}
            variants={stagger}
            className="text-center mb-10"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-black text-white mb-3">
              Porównanie planów
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-500 text-sm">
              Wszystko czego możesz się spodziewać w każdym z planów.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={compareInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="overflow-x-auto"
          >
            <div className="min-w-[480px] rounded-2xl border border-zinc-800/60 overflow-hidden">
              {/* Nagłówek */}
              <div className="grid grid-cols-3 border-b border-zinc-800/60">
                <div className="px-6 py-4 text-xs text-zinc-600 uppercase tracking-wider
                                font-semibold bg-zinc-900/60">
                  Funkcja
                </div>
                <div className="px-6 py-4 text-center bg-amber-500/5 border-l border-zinc-800/60">
                  <span className="text-sm font-black text-amber-400">🚚 Wspierający</span>
                  <p className="text-[11px] text-zinc-600 mt-0.5">15 PLN/mies.</p>
                </div>
                <div className="px-6 py-4 text-center bg-purple-500/5 border-l border-zinc-800/60">
                  <span className="text-sm font-black text-purple-400">👑 Premium</span>
                  <p className="text-[11px] text-zinc-600 mt-0.5">25 PLN/mies.</p>
                </div>
              </div>

              {/* Wiersze */}
              {COMPARE.map((row, i) => (
                <div
                  key={row.label}
                  className={cn(
                    'grid grid-cols-3 border-b border-zinc-800/40 last:border-0',
                    i % 2 === 0 ? 'bg-zinc-900/30' : 'bg-zinc-900/10',
                  )}
                >
                  <div className="px-6 py-3.5 text-sm text-zinc-500">{row.label}</div>
                  <div className="px-6 py-3.5 text-center text-sm border-l border-zinc-800/40">
                    <CellValue val={row.supporter} color="text-amber-400" />
                  </div>
                  <div className="px-6 py-3.5 text-center text-sm border-l border-zinc-800/40">
                    <CellValue val={row.premium} color="text-purple-400" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Na co idą środki ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={compareInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-3">Na co idą środki?</h2>
            <p className="text-zinc-500 text-sm">Przejrzystość jest dla nas priorytetem.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                emoji: '🖥️',
                title: 'Serwery i hosting',
                desc:  'Utrzymanie serwera aplikacji, bazy danych i bota Discord przez cały rok.',
                pct:   '60%',
                color: 'text-amber-400',
                bar:   'bg-amber-500',
              },
              {
                emoji: '⚙️',
                title: 'Rozwój platformy',
                desc:  'Nowe funkcje, mapa live, aktualizacje systemu ekonomii VTC.',
                pct:   '30%',
                color: 'text-purple-400',
                bar:   'bg-purple-500',
              },
              {
                emoji: '🎉',
                title: 'Eventy i nagrody',
                desc:  'Organizacja konwojów, nagrody dla top kierowców, specjalne eventy.',
                pct:   '10%',
                color: 'text-green-400',
                bar:   'bg-green-500',
              },
            ].map(({ emoji, title, desc, pct, color, bar }) => (
              <div
                key={title}
                className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{title}</p>
                    <p className={cn('text-lg font-black', color)}>{pct}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed mb-3">{desc}</p>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={compareInView ? { width: pct } : { width: 0 }}
                    transition={{ duration: 1, delay: 0.4, ease: EASE }}
                    className={cn('h-full rounded-full', bar)}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── FAQ ─────────────────────────────────────────── */}
        <div ref={faqRef}>
          <motion.div
            initial="hidden"
            animate={faqInView ? 'visible' : 'hidden'}
            variants={stagger}
            className="text-center mb-10"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-black text-white mb-3">
              Często zadawane pytania
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={faqInView ? 'visible' : 'hidden'}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-3 max-w-3xl mx-auto"
          >
            {FAQ.map((item, i) => (
              <FaqItem key={item.q} item={item} index={i} />
            ))}
          </motion.div>
        </div>

        {/* ── Końcowy CTA ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/20
                     bg-gradient-to-br from-amber-500/10 via-zinc-900 to-purple-500/10
                     px-8 py-12 text-center"
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent
                       via-white/[0.02] to-transparent pointer-events-none"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
          />

          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex justify-center mb-4"
            >
              <Heart className="w-10 h-10 text-red-400 fill-red-400" />
            </motion.div>

            <h2 className="text-3xl font-black text-white mb-3">
              Dziękujemy za wsparcie! 🚛
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto mb-8 leading-relaxed">
              Każda złotówka trafia bezpośrednio w rozwój VTC.
              Wspierający kierowcy to fundament naszej społeczności.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={LINK} target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl
                             bg-amber-500 hover:bg-amber-400 text-black font-black
                             text-sm shadow-lg shadow-amber-500/25 transition-colors"
                >
                  <Heart className="w-4 h-4 fill-black" />
                  Wesprzyj na Patreonie
                  <ExternalLink className="w-3.5 h-3.5" />
                </motion.button>
              </Link>
              <Link href="/recruitment">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl
                             bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold
                             text-sm border border-zinc-700 transition-colors"
                >
                  Dołącz do VTC
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>

            <p className="text-xs text-zinc-700 mt-6">
              Płatności obsługuje Patreon · Anuluj w dowolnym momencie · Wsparcie jest dobrowolne
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  )
}