'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Map, BarChart3, Shield, Zap, Users, Calendar, Truck, Globe } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const features = [
  { icon: Map,       title: 'Live mapa',        desc: 'Śledź wszystkich kierowców VTC w czasie rzeczywistym. Widzisz pozycję, prędkość i ładunek.',     badge: 'Real-time',   color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'hover:border-green-400/20'  },
  { icon: BarChart3, title: 'Rankingi',          desc: 'Tygodniowe i miesięczne tabele — dystans, zarobki, liczba jobów. Rywalizuj i wspinaj się.',       badge: 'Co tydzień',  color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'hover:border-blue-400/20'   },
  { icon: Shield,    title: 'System rang',       desc: 'Automatyczne awanse: Rekrut → Kierowca → Senior → Elite. Każdy milestone z odznaczeniem.',        badge: 'Auto',        color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'hover:border-purple-400/20' },
  { icon: Zap,       title: 'Auto-logowanie',    desc: 'Joby synchronizują się automatycznie z TruckersHub. Zero ręcznego wpisywania po każdym kursie.',   badge: 'TruckersHub', color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'hover:border-amber-400/20'  },
  { icon: Calendar,  title: 'Eventy z bonusami', desc: 'Regularne konwoje i eventy z bonusowymi punktami. Szansa na szybszy awans rangi.',                 badge: 'Bonusy',      color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'hover:border-orange-400/20' },
  { icon: Users,     title: 'Społeczność',       desc: 'Discord, czat z zarządem, lista członków z rangami. Prawdziwe VTC life z pasjonatami.',            badge: 'Discord',     color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'hover:border-indigo-400/20' },
  { icon: Truck,     title: 'Flota VTC',         desc: 'Przeglądaj ciężarówki z custom liveriami. Galeria zdjęć i przypisany kierowca do każdego auta.',   badge: 'Liverie',     color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'hover:border-cyan-400/20'   },
  { icon: Globe,     title: 'TruckersMP',        desc: 'Jeździmy na EU1, EU2 i ProMods. Konwoje organizowane co weekend z kompanią.',                      badge: 'MP',          color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'hover:border-red-400/20'    },
]

export function FeaturesSection() {
  const ref      = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section ref={ref} className="py-24 px-4 bg-zinc-900/20 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Nagłówek */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="text-amber-400 text-sm font-semibold uppercase tracking-widest"
          >
            Dlaczego my?
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl font-black mt-3 mb-3"
          >
            Wszystko czego potrzebuje kierowca
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed"
          >
            Zbudowani z pasji do ETS2 i technologii. Każda funkcja służy prawdziwemu
            doświadczeniu truckera — od pierwszego joba do tytułu Elite.
          </motion.p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc, badge, color, bg, border }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 44 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 + i * 0.055, ease: 'easeOut' }}
              whileHover={{ scale: 1.03, y: -6 }}
              className={cn(
                'bg-zinc-900/60 border border-zinc-800 rounded-xl p-5',
                'transition-all duration-200 cursor-default group',
                border,
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', bg)}
                >
                  <Icon className={cn('w-5 h-5', color)} />
                </motion.div>
                <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-semibold border border-current/20', bg, color)}>
                  {badge}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-2 text-zinc-200 group-hover:text-white transition-colors">
                {title}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
