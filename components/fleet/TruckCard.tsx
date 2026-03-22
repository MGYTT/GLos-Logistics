'use client'
import { useState } from 'react'
import { FleetTruck } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Truck, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function TruckCard({ truck }: { truck: FleetTruck }) {
  const [imgIdx, setImgIdx] = useState(0)
  const images = truck.image_urls?.length ? truck.image_urls : []

  return (
    <div className="glass rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all group">
      {/* Zdjęcie */}
      <div className="relative aspect-video bg-zinc-800 overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[imgIdx]}
            alt={truck.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Truck className="w-12 h-12 text-zinc-700" />
          </div>
        )}

        {/* Livery badge */}
        {truck.livery_url && (
          <Badge className="absolute top-2 left-2 bg-amber-500/90 text-black text-xs border-0">
            Custom Livery
          </Badge>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === imgIdx ? 'bg-amber-400 w-3' : 'bg-white/40'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-sm mb-0.5">{truck.name}</h3>
        <p className="text-xs text-zinc-500 mb-3">{truck.brand} {truck.model}</p>

        {truck.members ? (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Avatar className="w-5 h-5">
              <AvatarImage src={truck.members.avatar_url ?? ''} />
              <AvatarFallback className="bg-zinc-700 text-[10px]">
                {truck.members.username[0]}
              </AvatarFallback>
            </Avatar>
            {truck.members.username}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <User className="w-3.5 h-3.5" />
            Nieprzypisany
          </div>
        )}
      </div>
    </div>
  )
}
