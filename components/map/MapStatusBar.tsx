'use client'
import { ReactNode } from 'react'
import { Wifi, WifiOff, Loader2, Users, Radio, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapStatus } from '@/lib/hooks/useLiveMap'
import { format } from 'date-fns'

interface Props {
  status:       MapStatus
  vtcOnline:    number
  totalOnline:  number
  totalMembers: number
  lastUpdate:   Date | null
  children?:    ReactNode
}

export function MapStatusBar({ status, vtcOnline, totalOnline, totalMembers, lastUpdate, children }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/95
                    backdrop-blur-sm border-b border-zinc-800 text-xs z-10 gap-4 flex-wrap">
      {/* Status połączenia */}
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {status === 'online' && (
            <motion.div key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-green-400 font-medium">
              <motion.span
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400 inline-block"
              />
              <Wifi className="w-3.5 h-3.5" />
              Live — TruckersMP
            </motion.div>
          )}
          {status === 'loading' && (
            <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-amber-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Ładowanie graczy...
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-red-400">
              <WifiOff className="w-3.5 h-3.5" />
              Błąd API — retry za 5s
            </motion.div>
          )}
        </AnimatePresence>

        {lastUpdate && status === 'online' && (
          <span className="text-zinc-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(lastUpdate, 'HH:mm:ss')}
          </span>
        )}
      </div>

      {/* Statystyki + selektor serwera */}
      <div className="flex items-center gap-4 flex-wrap">
        {vtcOnline > 0 && (
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">
              VTC:{' '}
              <span className="text-amber-400 font-bold">{vtcOnline}</span>
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Users className="w-3.5 h-3.5 text-zinc-500" />
          <span>
            <span className="text-white font-semibold">{totalOnline.toLocaleString()}</span>
            <span className="text-zinc-600 mx-1">graczy online</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
