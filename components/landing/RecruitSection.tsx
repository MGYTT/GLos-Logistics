'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronRight, Clock, MessageSquare, UserCheck } from 'lucide-react'

const requirements = [
  'Minimum 100h w ETS2 lub ATS',
  'Zainstalowany TruckersMP',
  'Aktywne konto na TruckersHub',
  'Aktywność minimum 2x w tygodniu',
  'Kultura jazdy i szacunek do innych',
]

const steps = [
  { icon: MessageSquare, title: '1. Złóż podanie', desc: 'Wypełnij formularz rekrutacyjny online'  },
  { icon: Clock,         title: '2. Rozpatrzenie', desc: 'Zarząd odpowie w ciągu 48 godzin'        },
  { icon: UserCheck,     title: '3. Witaj w VTC!', desc: 'Otrzymujesz dostęp do Huba i Discorda'   },
]

export function RecruitSection() {
  const ref      = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="py-24 px-4 relative overflow-hidden">

      {/* Glow */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.055, 0.03] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500 rounded-full blur-[200px] pointer-events-none"
      />

      <div className="max-w-5xl mx-auto relative">

        {/* Nagłówek */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-amber-400 text-sm font-semibold uppercase tracking-widest">
            Rekrutacja otwarta
          </span>
          <h2 className="text-4xl font-black mt-3 mb-4 text-white">
            Gotowy dołączyć?
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
            Szukamy zmotywowanych kierowców którzy chcą być częścią profesjonalnego VTC
            z prawdziwą społecznością i systemem rozwoju.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* Wymagania */}
          <motion.div
            initial={{ opacity: 0, x: -36 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6"
          >
            <h3 className="font-black text-base mb-5 flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              </div>
              Wymagania
            </h3>
            <ul className="space-y-3">
              {requirements.map((r, i) => (
                <motion.li
                  key={r}
                  initial={{ opacity: 0, x: -16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.25 + i * 0.07 }}
                  className="flex items-center gap-3 text-sm text-zinc-300"
                >
                  <motion.span
                    animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.35 }}
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                  />
                  {r}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Kroki + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 36 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="space-y-3"
          >
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35 + i * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/25 rounded-xl p-4 transition-colors cursor-default"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0"
                >
                  <Icon className="w-5 h-5 text-amber-400" />
                </motion.div>
                <div>
                  <div className="font-black text-sm text-white">{title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>
                </div>
              </motion.div>
            ))}

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.65 }}
              className="pt-1"
            >
              <Link href="/recruitment">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="w-full bg-amber-500 text-black hover:bg-amber-400 font-black h-12 gap-2 text-base relative overflow-hidden group shadow-lg shadow-amber-500/20"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    Złóż podanie teraz
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
