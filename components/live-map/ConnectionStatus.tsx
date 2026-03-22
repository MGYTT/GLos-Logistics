'use client'
import { motion } from 'framer-motion'
import { Wifi, WifiOff } from 'lucide-react'

interface Props {
  connected:  boolean
  lastUpdate: Date | null
  count:      number
}

export function ConnectionStatus({ connected, lastUpdate, count }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl
                    bg-zinc-900/80 backdrop-blur border border-zinc-800 text-xs">
      <div className="flex items-center gap-1.5">
        {connected ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-400"
            />
            <Wifi className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 font-medium">Live</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <WifiOff className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500">Łączenie...</span>
          </>
        )}
      </div>

      <div className="w-px h-3 bg-zinc-700" />

      <span className="text-zinc-400">
        <span className="text-white font-bold">{count}</span> kierowców online
      </span>

      {lastUpdate && (
        <>
          <div className="w-px h-3 bg-zinc-700" />
          <span className="text-zinc-600">
            {lastUpdate.toLocaleTimeString('pl-PL')}
          </span>
        </>
      )}
    </div>
  )
}
