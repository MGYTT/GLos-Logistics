'use client'
import {
  useEffect, useRef, useState,
  useCallback, WheelEvent, MouseEvent, TouchEvent
} from 'react'
import { DriverOnMap } from '@/lib/hooks/useLiveMap'

interface Props {
  drivers:  DriverOnMap[]
  selected: DriverOnMap | null
  onSelect: (d: DriverOnMap) => void
}

// ─── Kalibracja ETS2 → canvas px ─────────────────
// Współrzędne gry: X [-16000, 16000], Z [-16000, 16000]
const GAME_SIZE = 32000  // -16000..16000
const MAP_IMG_SIZE = 8192  // rozmiar obrazka mapy w px

function gameToCanvas(
  gameX: number, gameZ: number,
  offsetX: number, offsetY: number,
  scale: number
): [number, number] {
  // Normalizuj do [0,1]
  const nx = (gameX + 16000) / GAME_SIZE
  const ny = (gameZ + 16000) / GAME_SIZE
  // Piksele na obrazku
  const px = nx * MAP_IMG_SIZE
  const py = ny * MAP_IMG_SIZE
  // Zastosuj transformację widoku
  return [
    offsetX + px * scale,
    offsetY + py * scale,
  ]
}

// Kolory rang
const RANK_COLORS: Record<string, string> = {
  Owner:   '#f59e0b',
  Manager: '#f59e0b',
  Elite:   '#a855f7',
  Senior:  '#3b82f6',
  Driver:  '#22c55e',
  Recruit: '#6b7280',
}
const rankColor = (rank?: string) => RANK_COLORS[rank ?? ''] ?? '#6b7280'

export default function MapCanvas({ drivers, selected, onSelect }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const mapImgRef    = useRef<HTMLImageElement | null>(null)
  const mapLoadedRef = useRef(false)

  // Widok: offset + scale
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.08 })
  const viewRef = useRef(view)
  viewRef.current = view

  const driversRef  = useRef(drivers)
  driversRef.current = drivers

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // Drag state
  const dragRef = useRef({ active: false, startX: 0, startY: 0, viewX: 0, viewY: 0 })

  // ─── Załaduj mapę ───────────────────────────────
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    // Kolejność prób ładowania mapy
    const sources = [
      '/map/ets2.jpg',           // lokalny plik (najszybszy)
      '/map/ets2.png',
    ]

    let idx = 0
    function tryNext() {
      if (idx >= sources.length) {
        // Jeśli żaden nie działa — narysuj siatkę
        mapLoadedRef.current = false
        drawFrame()
        return
      }
      img.src = sources[idx++]
    }

    img.onload = () => {
      mapImgRef.current = img
      mapLoadedRef.current = true

      // Wycentruj mapę po załadowaniu
      const canvas = canvasRef.current
      if (canvas) {
        const w = canvas.width
        const h = canvas.height
        const scale = Math.min(w, h) / MAP_IMG_SIZE * 1.1
        setView({
          x: (w - MAP_IMG_SIZE * scale) / 2,
          y: (h - MAP_IMG_SIZE * scale) / 2,
          scale,
        })
      }
    }
    img.onerror = tryNext
    tryNext()
  }, [])

  // ─── Rysuj klatkę ───────────────────────────────
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x: ox, y: oy, scale } = viewRef.current
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // ── Tło ──
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, w, h)

    if (mapLoadedRef.current && mapImgRef.current) {
      // ── Mapa ETS2 ──
      const imgW = MAP_IMG_SIZE * scale
      const imgH = MAP_IMG_SIZE * scale
      ctx.drawImage(mapImgRef.current, ox, oy, imgW, imgH)

      // Delikatna ciemna nakładka dla lepszej widoczności markerów
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(ox, oy, imgW, imgH)
    } else {
      // ── Fallback: siatka ──
      ctx.strokeStyle = '#1f1f23'
      ctx.lineWidth = 1
      const gridStep = 50 * scale
      const startX = ((ox % gridStep) + gridStep) % gridStep
      const startY = ((oy % gridStep) + gridStep) % gridStep
      for (let gx = startX; gx < w; gx += gridStep) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke()
      }
      for (let gy = startY; gy < h; gy += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke()
      }
      // Info tekst
      ctx.fillStyle = '#3f3f46'
      ctx.font = 'bold 14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Umieść plik mapy w /public/map/ets2.jpg', w / 2, h / 2 - 10)
      ctx.font = '12px system-ui'
      ctx.fillStyle = '#27272a'
      ctx.fillText('Pobierz: github.com/Unicor-p/SCS_Map_Tiles', w / 2, h / 2 + 15)
      ctx.textAlign = 'left'
    }

    // ── Markery kierowców ──
    const driversList = driversRef.current
    const sel = selected

    // Najpierw zwykli gracze (pod VTC)
    for (const d of driversList) {
      if (d.memberInfo) continue
      drawMarker(ctx, d, false, ox, oy, scale)
    }
    // Potem VTC memberowie
    for (const d of driversList) {
      if (!d.memberInfo) continue
      const isSel = sel?.id === d.id
      drawMarker(ctx, d, isSel, ox, oy, scale)
    }
    // Wybrany zawsze na wierzchu
    if (sel) {
      drawMarker(ctx, sel, true, ox, oy, scale, true)
    }
  }, [selected])

  // ─── Marker SVG na canvas ───────────────────────
  function drawMarker(
    ctx: CanvasRenderingContext2D,
    driver: DriverOnMap,
    isSelected: boolean,
    ox: number, oy: number, scale: number,
    forceTop = false
  ) {
    const [cx, cy] = gameToCanvas(driver.x, driver.y, ox, oy, scale)

    // Nie rysuj poza widocznym obszarem
    const cw = ctx.canvas.width
    const ch = ctx.canvas.height
    if (cx < -50 || cx > cw + 50 || cy < -50 || cy > ch + 50) return

    const isVtc  = !!driver.memberInfo
    const color  = isVtc ? rankColor(driver.memberInfo?.rank) : '#4b5563'
    const radius = isSelected ? 10 : isVtc ? 8 : 5

    ctx.save()
    ctx.translate(cx, cy)

    // Glow dla VTC member
    if (isVtc) {
      ctx.shadowColor = color
      ctx.shadowBlur  = isSelected ? 16 : 8
    }

    // Koło tła
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#18181b'
    ctx.fill()

    // Obramowanie
    ctx.lineWidth   = isSelected ? 2.5 : isVtc ? 2 : 1.5
    ctx.strokeStyle = color
    ctx.stroke()

    ctx.shadowBlur = 0

    // Ikona
    if (isVtc) {
      ctx.font = `${isSelected ? 11 : 9}px system-ui`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🚛', 0, 0.5)
    } else {
      ctx.beginPath()
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }

    // Pulsujący ring dla selected
    if (isSelected) {
      const pulse = (Date.now() % 1500) / 1500
      ctx.beginPath()
      ctx.arc(0, 0, radius + 6 + pulse * 8, 0, Math.PI * 2)
      ctx.strokeStyle = `${color}${Math.round((1 - pulse) * 255).toString(16).padStart(2, '0')}`
      ctx.lineWidth   = 1.5
      ctx.stroke()
    }

    // Label nad markerem
    if (isVtc || isSelected) {
      const label = driver.memberInfo?.username ?? driver.name
      const labelY = -(radius + 7)
      ctx.font         = `${isSelected ? 700 : 600} ${isSelected ? 11 : 9}px system-ui`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'bottom'

      // Tło labela
      const textW = ctx.measureText(label).width
      const pad   = 3
      ctx.fillStyle = 'rgba(9,9,11,0.85)'
      ctx.beginPath()
      ctx.roundRect(
        -textW / 2 - pad,
        labelY - 11,
        textW + pad * 2,
        12,
        3
      )
      ctx.fill()

      // Tekst
      ctx.fillStyle    = isSelected ? color : '#e4e4e7'
      ctx.fillText(label, 0, labelY)
    }

    ctx.restore()
  }

  // ─── RAF loop ───────────────────────────────────
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    function loop() {
      drawFrame()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [drawFrame])

  // ─── Resize canvas ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      canvas.width  = width
      canvas.height = height
    })
    observer.observe(canvas.parentElement!)
    return () => observer.disconnect()
  }, [])

  // ─── Wheel zoom ─────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect   = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setView(prev => {
      const factor = e.deltaY < 0 ? 1.12 : 0.89
      const newScale = Math.min(Math.max(prev.scale * factor, 0.04), 1.5)

      // Zoom względem kursora
      const nx = mouseX - (mouseX - prev.x) * (newScale / prev.scale)
      const ny = mouseY - (mouseY - prev.y) * (newScale / prev.scale)

      return { x: nx, y: ny, scale: newScale }
    })
  }, [])

  // ─── Mouse drag ─────────────────────────────────
  const handleMouseDown = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      viewX:  viewRef.current.x,
      viewY:  viewRef.current.y,
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setView(prev => ({
      ...prev,
      x: dragRef.current.viewX + dx,
      y: dragRef.current.viewY + dy,
    }))
  }, [])

  const handleMouseUp = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const dx = Math.abs(e.clientX - dragRef.current.startX)
    const dy = Math.abs(e.clientY - dragRef.current.startY)

    if (dx < 5 && dy < 5) {
      // Klik – znajdź kierowcę
      const canvas = canvasRef.current
      if (!canvas) return
      const rect  = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      const { x: ox, y: oy, scale } = viewRef.current

      let closest: DriverOnMap | null = null
      let closestDist = 20 // px próg kliknięcia

      for (const d of driversRef.current) {
        const [cx, cy] = gameToCanvas(d.x, d.y, ox, oy, scale)
        const dist = Math.sqrt((cx - clickX) ** 2 + (cy - clickY) ** 2)
        if (dist < closestDist) {
          closest     = d
          closestDist = dist
        }
      }
      if (closest) onSelectRef.current(closest)
    }

    dragRef.current.active = false
  }, [])

  // ─── Touch support ───────────────────────────────
  const lastTouchDistRef = useRef<number | null>(null)

  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDistRef.current = Math.sqrt(dx * dx + dy * dy)
    } else if (e.touches.length === 1) {
      dragRef.current = {
        active: true,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        viewX:  viewRef.current.x,
        viewY:  viewRef.current.y,
      }
    }
  }

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (e.touches.length === 2 && lastTouchDistRef.current) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX
      const dy   = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const factor = dist / lastTouchDistRef.current
      lastTouchDistRef.current = dist
      setView(prev => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * factor, 0.04), 1.5),
      }))
    } else if (e.touches.length === 1 && dragRef.current.active) {
      const ddx = e.touches[0].clientX - dragRef.current.startX
      const ddy = e.touches[0].clientY - dragRef.current.startY
      setView(prev => ({
        ...prev,
        x: dragRef.current.viewX + ddx,
        y: dragRef.current.viewY + ddy,
      }))
    }
  }

  const handleTouchEnd = () => {
    dragRef.current.active   = false
    lastTouchDistRef.current = null
  }

  // ─── Auto-pan do wybranego kierowcy ─────────────
  useEffect(() => {
    if (!selected) return
    const canvas = canvasRef.current
    if (!canvas) return

    const { scale } = viewRef.current
    const [px, py] = [
      (selected.x + 16000) / GAME_SIZE * MAP_IMG_SIZE * scale,
      (selected.y + 16000) / GAME_SIZE * MAP_IMG_SIZE * scale,
    ]

    setView(prev => ({
      ...prev,
      x: canvas.width  / 2 - px,
      y: canvas.height / 2 - py,
    }))
  }, [selected?.id])

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
