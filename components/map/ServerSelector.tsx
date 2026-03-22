'use client'
import { useEffect, useState } from 'react'
import { TruckyServer } from '@/lib/truckersmp/types'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Server } from 'lucide-react'

interface Props {
  current:  number
  onChange: (id: number) => void
}

export function ServerSelector({ current, onChange }: Props) {
  const [servers, setServers] = useState<TruckyServer[]>([])

  useEffect(() => {
    fetch('/api/map/servers')
      .then(r => r.json())
      .then(setServers)
      .catch(() => {})
  }, [])

  return (
    <Select value={String(current)} onValueChange={v => onChange(Number(v))}>
      <SelectTrigger className="h-7 w-36 text-xs bg-zinc-800 border-zinc-700 gap-1.5">
        <Server className="w-3 h-3 text-zinc-400 shrink-0" />
        <SelectValue placeholder="Serwer" />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-700">
        {servers.length === 0 ? (
          <SelectItem value="1">EU #1 (domyślny)</SelectItem>
        ) : (
          servers.map(s => (
            <SelectItem key={s.id} value={String(s.id)}>
              <span className="flex items-center gap-2 text-xs">
                <span>{s.shortname}</span>
                <span className="text-zinc-500">{s.players}/{s.maxplayers}</span>
              </span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
