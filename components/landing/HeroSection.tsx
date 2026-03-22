'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight, Users, Truck, MapPin, Star, ArrowDown } from 'lucide-react'
import { ParticlesBackground } from './ParticlesBackground'

interface Props {
  memberCount: number
  totalKm:     number
}

function formatKm(km: number) {
  if (km >= 1_000_000) return `${(km / 1_000_000).toFixed(1)}M`
  if (km >= 1_000)     return `${(km / 1_000).toFixed(0)}K`
  return km > 0 ? String(km) : '0'
}

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
}

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1,   transition: { duration: 0.5, ease: 'backOut' } },
}

const container = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.2 } },
}

export function HeroSection({ memberCount, totalKm }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const yRaw    = useTransform(scrollYProgress, [0, 1], [0, 110])
  const opacity = useTransform(scrollYProgress, [0, 0.55], [1, 0])
  const scale   = useTransform(scrollYProgress, [0, 1], [1, 0.93])
  const y       = useSpring(yRaw, { stiffness: 100, damping: 30 })

  const stats = [
    { icon: Users,  value: memberCount > 0 ? String(memberCount) : '0', label: 'Kierowców'  },
    { icon: Truck,  value: formatKm(totalKm),                            label: 'km łącznie' },
    { icon: MapPin, value: '24/7',                                       label: 'Live mapa'  },
    { icon: Star,   value: 'ETS2',                                       label: 'TruckersMP' },
  ]

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Particles */}
      <ParticlesBackground />

      {/* Gradient tła */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-zinc-950 to-zinc-950 z-[1] pointer-events-none" />

      {/* Siatka */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.055,
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
        }}
      />

      {/* Glow */}
      <motion.div
        animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none z-[2]"
      />
      <motion.div
        animate={{ x: [0, -22, 0], y: [0, 22, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-[100px] pointer-events-none z-[2]"
      />

      {/* Content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 w-full max-w-5xl mx-auto px-4 text-center"
      >
        <motion.div variants={container} initial="hidden" animate="visible" className="space-y-0">

          {/* Badge */}
          <motion.div variants={fadeUp} className="flex justify-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium backdrop-blur-sm cursor-default"
            >
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-amber-400 inline-block"
              />
              Rekrutacja otwarta – dołącz teraz!
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </motion.div>

          {/* Tytuł */}
          <motion.div variants={fadeUp} className="mb-6">
            <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="block text-white"
              >
                Jeździmy razem.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.45 }}
                className="block bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent"
              >
                Dowozimy zawsze.
              </motion.span>
            </h1>
          </motion.div>

          {/* Opis */}
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Profesjonalna wirtualna firma transportowa w ETS2. Dołącz do najlepszych
            kierowców, bierz udział w konwojach i buduj swoją legendę na europejskich drogach.
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          >
            <Link href="/recruitment">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-amber-500 text-black hover:bg-amber-400 font-black px-8 h-12 gap-2 text-base relative overflow-hidden group shadow-lg shadow-amber-500/25"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  Dołącz do VTC
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/hub">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-zinc-700 hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/5 px-8 h-12 text-base backdrop-blur-sm transition-all"
                >
                  Zaloguj do Huba
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Statystyki */}
          <motion.div
            variants={container}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {stats.map(({ icon: Icon, value, label }, i) => (
              <motion.div
                key={label}
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-amber-500/25 rounded-2xl p-5 text-center cursor-default transition-colors"
              >
                <motion.div
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1, type: 'spring', stiffness: 300 }}
                >
                  <Icon className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                </motion.div>
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
              </motion.div>
            ))}
          </motion.div>

        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 z-10 pointer-events-none"
      >
        <span className="text-xs tracking-widest uppercase">Przewiń</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  )
}
