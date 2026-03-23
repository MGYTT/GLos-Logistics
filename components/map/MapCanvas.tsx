'use client'
import {
  useEffect, useRef, useState,
  useCallback,
} from 'react'
import type { LiveDriver }    from '@/lib/hooks/useLiveMap'
import type { WheelEvent, MouseEvent, TouchEvent } from 'react'

type DriverOnMap = {
  x:          number
  y:          number
  id:         string
  name:       string
  server:     number
  lastSeen:   number
  memberInfo: { username: string; avatar_url: string | null; rank: string } | null
}

function toDriverOnMap(d: LiveDriver): DriverOnMap {
  return {
    x:          d.game_x    ?? 0,
    y:          d.game_z    ?? 0,
    id:         d.member_id,
    name:       d.member?.username ?? d.member_id,
    server:     1,
    lastSeen:   new Date(d.updated_at).getTime(),
    memberInfo: d.member ?? null,
  }
}

const GAME_SIZE    = 32000
const MAP_IMG_SIZE = 8192

function gameToCanvas(
  gameX: number, gameZ: number,
  offsetX: number, offsetY: number,
  scale: number
): [number, number] {
  const nx = (gameX + 16000) / GAME_SIZE
  const ny = (gameZ + 16000) / GAME_SIZE
  return [
    offsetX + nx * MAP_IMG_SIZE * scale,
    offsetY + ny * MAP_IMG_SIZE * scale,
  ]
}

const RANK_COLORS: Record<string, string> = {
  Owner:   '#f59e0b',
  Manager: '#f59e0b',
  Elite:   '#a855f7',
  Senior:  '#3b82f6',
  Driver:  '#22c55e',
  Recruit: '#6b7280',
}
const rankColor = (rank?: string) => RANK_COLORS[rank ?? ''] ?? '#6b7280'

interface Props {
  drivers:  LiveDriver[]
  selected: LiveDriver | null
  onSelect: (d: LiveDriver) => void
}

export default function MapCanvas({ drivers, selected, onSelect }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const mapImgRef    = useRef<HTMLImageElement | null>(null)
  const mapLoadedRef = useRef(false)
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.08 })
  const viewRef     = useRef(view)
  viewRef.current   = view
  const driversRef  = useRef<DriverOnMap[]>([])
  driversRef.current = drivers.map(toDriverOnMap)
  const selectedMapped = selected ? toDriverOnMap(selected) : null
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const dragRef = useRef({ active: false, startX: 0, startY: 0, viewX: 0, viewY: 0 })

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const sources = ['/map/ets2.jpg', '/map/ets2.png']
    let idx = 0
    function tryNext() {
      if (idx >= sources.length) { mapLoadedRef.current = false; return }
      img.src = sources[idx++]
    }
    img.onload = () => {
      mapImgRef.current  = img
      mapLoadedRef.current = true
      const canvas = canvasRef.current
      if (canvas) {
        const scale = Math.min(canvas.width, canvas.height) / MAP_IMG_SIZE * 1.1
        setView({
          x: (canvas.width  - MAP_IMG_SIZE * scale) / 2,
          y: (canvas.height - MAP_IMG_SIZE * scale) / 2,
          scale,
        })
      }
    }
    img.onerror = tryNext
    tryNext()
  }, [])

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x: ox, y: oy, scale } = viewRef.current
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, w, h)

    if (mapLoadedRef.current && mapImgRef.current) {
      ctx.drawImage(mapImgRef.current, ox, oy, MAP_IMG_SIZE * scale, MAP_IMG_SIZE * scale)
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(ox, oy, MAP_IMG_SIZE * scale, MAP_IMG_SIZE * scale)
    } else {
      ctx.strokeStyle = '#1f1f23'
      ctx.lineWidth   = 1
      const gridStep = 50 * scale
      const startX = ((ox % gridStep) + gridStep) % gridStep
      const startY = ((oy % gridStep) + gridStep) % gridStep
      for (let gx = startX; gx < w; gx += gridStep) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke()
      }
      for (let gy = startY; gy < h; gy += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke()
      }
      ctx.fillStyle = '#3f3f46'
      ctx.font = 'bold 14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Umieść plik mapy w /public/map/ets2.jpg', w / 2, h / 2 - 10)
      ctx.font = '12px system-ui'
      ctx.fillStyle = '#27272a'
      ctx.fillText('Pobierz: github.com/Unicor-p/SCS_Map_Tiles', w / 2, h / 2 + 15)
      ctx.textAlign = 'left'
    }

    const list = driversRef.current
    const sel  = selectedMapped

    for (const d of list) if (!d.memberInfo) drawMarker(ctx, d, false, ox, oy, scale)
    for (const d of list) if ( d.memberInfo) drawMarker(ctx, d, sel?.id === d.id, ox, oy, scale)
    if (sel) drawMarker(ctx, sel, true, ox, oy, scale, true)
  }, [selectedMapped])

  function drawMarker(
    ctx: CanvasRenderingContext2D,
    driver: DriverOnMap,
    isSelected: boolean,
    ox: number, oy: number, scale: number,
    forceTop = false
  ) {
    const [cx, cy] = gameToCanvas(driver.x, driver.y, ox, oy, scale)
    const cw = ctx.canvas.width, ch = ctx.canvas.height
    if (cx < -50 || cx > cw + 50 || cy < -50 || cy > ch + 50) return

    const isVtc  = !!driver.memberInfo
    const color  = isVtc ? rankColor(driver.memberInfo?.rank) : '#4b5563'
    const radius = isSelected ? 10 : isVtc ? 8 : 5

    ctx.save()
    ctx.translate(cx, cy)
    if (isVtc) { ctx.shadowColor = color; ctx.shadowBlur = isSelected ? 16 : 8 }
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#18181b'; ctx.fill()
    ctx.lineWidth = isSelected ? 2.5 : isVtc ? 2 : 1.5
    ctx.strokeStyle = color; ctx.stroke()
    ctx.shadowBlur = 0

    if (isVtc) {
      ctx.font = `${isSelected ? 11 : 9}px system-ui`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('🚛', 0, 0.5)
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = color; ctx.fill()
    }

    if (isSelected) {
      const pulse = (Date.now() % 1500) / 1500
      ctx.beginPath()
      ctx.arc(0, 0, radius + 6 + pulse * 8, 0, Math.PI * 2)
      ctx.strokeStyle = `${color}${Math.round((1 - pulse) * 255).toString(16).padStart(2, '0')}`
      ctx.lineWidth = 1.5; ctx.stroke()
    }

    if (isVtc || isSelected) {
      const label  = driver.memberInfo?.username ?? driver.name
      const labelY = -(radius + 7)
      ctx.font = `${isSelected ? 700 : 600} ${isSelected ? 11 : 9}px system-ui`
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
      const textW = ctx.measureText(label).width, pad = 3
      ctx.fillStyle = 'rgba(9,9,11,0.85)'
      ctx.beginPath()
      ctx.roundRect(-textW / 2 - pad, labelY - 11, textW + pad * 2, 12, 3)
      ctx.fill()
      ctx.fillStyle = isSelected ? color : '#e4e4e7'
      ctx.fillText(label, 0, labelY)
    }
    ctx.restore()
  }

  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    function loop() { drawFrame(); rafRef.current = requestAnimationFrame(loop) }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [drawFrame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(([entry]) => {
      canvas.width  = entry.contentRect.width
      canvas.height = entry.contentRect.height
    })
    observer.observe(canvas.parentElement!)
    return () => observer.disconnect()
  }, [])

  const handleWheel = useCallback((e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    const rect   = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    setView(prev => {
      const factor   = e.deltaY < 0 ? 1.12 : 0.89
      const newScale = Math.min(Math.max(prev.scale * factor, 0.04), 1.5)
      return {
        x:     mouseX - (mouseX - prev.x) * (newScale / prev.scale),
        y:     mouseY - (mouseY - prev.y) * (newScale / prev.scale),
        scale: newScale,
      }
    })
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, viewX: viewRef.current.x, viewY: viewRef.current.y }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return
    setView(prev => ({
      ...prev,
      x: dragRef.current.viewX + e.clientX - dragRef.current.startX,
      y: dragRef.current.viewY + e.clientY - dragRef.current.startY,
    }))
  }, [])

  const handleMouseUp = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const dx = Math.abs(e.clientX - dragRef.current.startX)
    const dy = Math.abs(e.clientY - dragRef.current.startY)
    if (dx < 5 && dy < 5) {
      const canvas = canvasRef.current; if (!canvas) return
      const rect   = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      const { x: ox, y: oy, scale } = viewRef.current
      let closest: DriverOnMap | null = null, closestDist = 20
      for (const d of driversRef.current) {
        const [cx, cy] = gameToCanvas(d.x, d.y, ox, oy, scale)
        const dist = Math.sqrt((cx - clickX) ** 2 + (cy - clickY) ** 2)
        if (dist < closestDist) { closest = d; closestDist = dist }
      }
      if (closest) {
        const original = drivers.find(d => d.member_id === closest!.id)
        if (original) onSelectRef.current(original)
      }
    }
    dragRef.current.active = false
  }, [drivers])

  const lastTouchDistRef = useRef<number | null>(null)
  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDistRef.current = Math.sqrt(dx * dx + dy * dy)
    } else if (e.touches.length === 1) {
      dragRef.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, viewX: viewRef.current.x, viewY: viewRef.current.y }
    }
  }
  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (e.touches.length === 2 && lastTouchDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      setView(prev => ({ ...prev, scale: Math.min(Math.max(prev.scale * dist / lastTouchDistRef.current!, 0.04), 1.5) }))
      lastTouchDistRef.current = dist
    } else if (e.touches.length === 1 && dragRef.current.active) {
      setView(prev => ({ ...prev, x: dragRef.current.viewX + e.touches[0].clientX - dragRef.current.startX, y: dragRef.current.viewY + e.touches[0].clientY - dragRef.current.startY }))
    }
  }
  const handleTouchEnd = () => { dragRef.current.active = false; lastTouchDistRef.current = null }

  useEffect(() => {
    if (!selected) return
    const canvas = canvasRef.current; if (!canvas) return
    const { scale } = viewRef.current
    const px = ((selected.game_x ?? 0) + 16000) / GAME_SIZE * MAP_IMG_SIZE * scale
    const py = ((selected.game_z ?? 0) + 16000) / GAME_SIZE * MAP_IMG_SIZE * scale
    setView(prev => ({ ...prev, x: canvas.width / 2 - px, y: canvas.height / 2 - py }))
  }, [selected?.member_id])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      style={{ display: 'block' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { dragRef.current.active = false }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  )
}
