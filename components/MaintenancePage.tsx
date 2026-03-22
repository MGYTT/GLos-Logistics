'use client'

import { motion }       from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Wrench, Clock, MessageSquare,
  Truck, RefreshCw,
} from 'lucide-react'

interface Props {
  vtcName: string
  discord: string | null
  message: string
}

export function MaintenancePage({ vtcName, discord, message }: Props) {
  const [dots,    setDots]    = useState('.')
  const [refresh, setRefresh] = useState(false)

  // Animacja kropek
  useEffect(() => {
    const t = setInterval(() =>
      setDots(d => d.length >= 3 ? '.' : d + '.'), 600
    )
    return () => clearInterval(t)
  }, [])

  // Auto-odświeżanie co 60 sekund
  useEffect(() => {
    const t = setTimeout(() => {
      setRefresh(true)
      window.location.reload()
    }, 60_000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center
                    justify-center px-4 relative overflow-hidden">

      {/* ── Tło ────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96
                        bg-orange-500/3 rounded-full blur-3xl" />
        {/* Siatka */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Ciężarówka jeżdżąca ─────────────── */}
      <div className="absolute bottom-8 w-full overflow-hidden
                      pointer-events-none opacity-20">
        <motion.div
          animate={{ x: ['110vw', '-20vw'] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 4,
          }}
          className="flex items-center gap-1"
        >
          <Truck className="w-10 h-10 text-amber-400 scale-x-[-1]" />
        </motion.div>
      </div>

      {/* ── Główna karta ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Ikona */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20
                     flex items-center justify-center mx-auto mb-8"
        >
          <Wrench className="w-10 h-10 text-amber-400" />
        </motion.div>

        {/* Treść */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-amber-400/10 border border-amber-400/20
                          text-amber-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Przerwa techniczna
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            {vtcName}
            <br />
            <span className="text-transparent bg-clip-text
                             bg-gradient-to-r from-amber-400 to-orange-500">
              jest w trakcie
              <br />
              konserwacji{dots}
            </span>
          </h1>

          {/* Wiadomość z admina */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl
                          px-6 py-5 text-left space-y-2 mt-6">
            <div className="flex items-center gap-2 text-zinc-500 text-xs
                            uppercase tracking-wider mb-3">
              <Clock className="w-3.5 h-3.5" />
              Komunikat od administratora
            </div>
            <p className="text-zinc-300 leading-relaxed text-sm">
              {message}
            </p>
          </div>
        </div>

        {/* Przyciski */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 flex items-center justify-center gap-2
                       py-3 rounded-xl bg-zinc-900 border border-zinc-800
                       hover:border-zinc-700 text-zinc-400 hover:text-white
                       text-sm font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refresh ? 'animate-spin' : ''}`} />
            Odśwież stronę
          </button>

          {discord && (
            <a
              href={discord}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2
                         py-3 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20
                         hover:bg-[#5865F2]/20 text-[#7289da] hover:text-white
                         text-sm font-medium transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Dołącz na Discord
            </a>
          )}
        </div>

        {/* Auto-refresh info */}
        <p className="text-center text-xs text-zinc-700 mt-6">
          Strona odświeży się automatycznie za 60 sekund
        </p>
      </motion.div>

      {/* ── Stopka ──────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 text-xs text-zinc-800 z-10"
      >
        {vtcName} · Panel zarządzania
      </motion.p>
    </div>
  )
}
