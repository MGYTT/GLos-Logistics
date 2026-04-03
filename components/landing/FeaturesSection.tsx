'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Map, BarChart3, Shield, Zap, Users, Calendar, Truck, Globe } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const features = [
  { icon: Map,       title: 'Live mapa',        desc: 'Śledź wszystkich kierowców VTC w czasie rzeczywistym. Pozycja, prędkość i ładunek.',      badge: 'Real-time',   color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'group-hover:border-green-400/25',  shadow: 'group-hover:shadow-green-500/10'  },
  { icon: BarChart3, title: 'Rankingi',          desc: 'Tygodniowe i miesięczne tabele — dystans, zarobki, liczba jobów. Rywalizuj i wspinaj się.', badge: 'Co tydzień',  color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'group-hover:border-blue-400/25',   shadow: 'group-hover:shadow-blue-500/10'   },
  { icon: Shield,    title: 'System rang',       desc: 'Automatyczne awanse: Rekrut → Kierowca → Senior → Elite. Każdy milestone z odznaczeniem.', badge: 'Auto',        color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'group-hover:border-purple-400/25', shadow: 'group-hover:shadow-purple-500/10' },
  { icon: Zap,       title: 'Auto-logowanie',    desc: 'Joby synchronizują się automatycznie z TruckersHub. Zero ręcznego wpisywania.',            badge: 'TruckersHub', color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'group-hover:border-amber-400/25',  shadow: 'group-hover:shadow-amber-500/10'  },
  { icon: Calendar,  title: 'Eventy z bonusami', desc: 'Regularne konwoje i eventy z bonusowymi punktami. Szansa na szybszy awans rangi.',          badge: 'Bonusy',      color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'group-hover:border-orange-400/25', shadow: 'group-hover:shadow-orange-500/10' },
  { icon: Users,     title: 'Społeczność',       desc: 'Discord, czat z zarządem, lista członków z rangami. Prawdziwe VTC life z pasjonatami.',     badge: 'Discord',     color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'group-hover:border-indigo-400/25', shadow: 'group-hover:shadow-indigo-500/10' },
  { icon: Truck,     title: 'Flota VTC',         desc: 'Przeglądaj ciężarówki z custom liveriami. Galeria zdjęć i przypisany kierowca.',            badge: 'Liverie',     color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'group-hover:border-cyan-400/25',   shadow: 'group-hover:shadow-cyan-500/10'   },
  { icon: Globe,     title: 'TruckersMP',        desc: 'Jeździmy na EU1, EU2 i ProMods. Konwoje organizowane co weekend z kompanią.',               badge: 'MP',          color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'group-hover:border-red-400/25',    shadow: 'group-hover:shadow-red-500/10'    },
]

export function FeaturesSection() {
  const ref      = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section ref={ref} className="py-28 px-4 bg-zinc-900/20 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(245,158,11,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(249,115,22,0.02) 0%, transparent 50%)`,
      }} />

      <div className="max-w-7xl mx-auto relative">

        {/* Nagłówek */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }} animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
              <Zap className="w-3 h-3 text-amber-400" />
            </motion.div>
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-widest">Dlaczego my?</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-black mt-2 mb-4 text-white"
          >
            Wszystko czego potrzebuje kierowca
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed"
          >
            Zbudowani z pasji do ETS2 i technologii. Każda funkcja służy prawdziwemu
            doświadczeniu truckera — od pierwszego joba do tytułu Elite.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc, badge, color, bg, border, shadow }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.06 + i * 0.05, ease: 'easeOut' }}
              whileHover={{ scale: 1.03, y: -6 }}
              className={cn(
                'bg-zinc-900/60 border border-zinc-800 rounded-xl p-5',
                'transition-all duration-300 cursor-default group shadow-lg',
                border, shadow,
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <motion.div
                  whileHover={{ rotate: [0, -12, 12, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                  className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300', bg)}
                >
                  <Icon className={cn('w-5 h-5', color)} />
                </motion.div>
                <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-semibold border border-current/20', bg, color)}>
                  {badge}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-2 text-zinc-200 group-hover:text-white transition-colors duration-200">{title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors duration-200">{desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}