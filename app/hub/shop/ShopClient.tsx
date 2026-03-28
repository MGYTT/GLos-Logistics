'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence }               from 'framer-motion'
import { toast }                                 from 'sonner'
import {
  ShoppingBag, Wallet, Star, Package,
  Shield, Truck, Gift, Sparkles,
  CheckCircle, Lock, Loader2, Search,
  ArrowUpDown, Flame, Clock, TrendingUp,
  ChevronDown, Zap,
} from 'lucide-react'
import { cn }     from '@/lib/utils/cn'
import { buyItem } from './actions'

// ─── Typy ──────────────────────────────────────────────────
interface ShopItem {
  id:          string
  name:        string
  description: string | null
  category:    string
  price:       number
  image_url:   string | null
  stock:       number | null
  is_active:   boolean
  metadata:    Record<string, any> | null
  created_at:  string
}

interface Props {
  items:        ShopItem[]
  balance:      number
  memberId:     string
  ownedItemIds: string[]
}

type Category  = 'all' | 'livery' | 'badge' | 'upgrade' | 'fleet_slot' | 'lootbox'
type SortKey   = 'price_asc' | 'price_desc' | 'rarity' | 'newest'

// ─── Stałe ─────────────────────────────────────────────────
const CATEGORY_META: Record<string, {
  label: string; icon: React.ElementType
  color: string; bg: string; border: string
}> = {
  livery:     { label: 'Malowania',  icon: Truck,    color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
  badge:      { label: 'Odznaki',    icon: Shield,   color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  upgrade:    { label: 'Ulepszenia', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  fleet_slot: { label: 'Flota',      icon: Package,  color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20'  },
  lootbox:    { label: 'Skrzynki',   icon: Gift,     color: 'text-pink-400',   bg: 'bg-pink-400/10',   border: 'border-pink-400/20'   },
}

const RARITY_META: Record<string, {
  label: string; color: string
  glow: string; order: number
  gradient: string
}> = {
  common:    { label: 'Zwykły',     color: 'text-zinc-400',   glow: '',                          order: 0, gradient: '' },
  uncommon:  { label: 'Rzadki',     color: 'text-green-400',  glow: 'shadow-green-400/15',       order: 1, gradient: 'from-green-500/5' },
  rare:      { label: 'Rzadki+',    color: 'text-blue-400',   glow: 'shadow-blue-400/20',        order: 2, gradient: 'from-blue-500/5' },
  epic:      { label: 'Epicki',     color: 'text-purple-400', glow: 'shadow-purple-400/20',      order: 3, gradient: 'from-purple-500/5' },
  legendary: { label: 'Legendarny', color: 'text-amber-400',  glow: 'shadow-amber-500/30',       order: 4, gradient: 'from-amber-500/8' },
  mystery:   { label: 'Tajemniczy', color: 'text-pink-400',   glow: 'shadow-pink-400/20',        order: 2, gradient: 'from-pink-500/5' },
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'price_asc',  label: 'Cena: rosnąco'  },
  { value: 'price_desc', label: 'Cena: malejąco' },
  { value: 'rarity',     label: 'Rzadkość'        },
  { value: 'newest',     label: 'Najnowsze'       },
]

const RARITY_ORDER = ['common','uncommon','rare','epic','legendary','mystery']

function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
}

// ─── Particle burst ────────────────────────────────────────
function ParticleBurst({ active }: { active: boolean }) {
  if (!active) return null
  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle  = (i / 16) * 360
    const dist   = 60 + Math.random() * 40
    const x      = Math.cos((angle * Math.PI) / 180) * dist
    const y      = Math.sin((angle * Math.PI) / 180) * dist
    const colors = ['bg-amber-400','bg-yellow-300','bg-orange-400','bg-amber-300']
    const color  = colors[i % colors.length]
    return { x, y, color, size: 4 + Math.random() * 4 }
  })
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className={cn('absolute rounded-full', p.color)}
          style={{ width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.01 }}
        />
      ))}
    </div>
  )
}

// ─── Featured Banner ───────────────────────────────────────
function FeaturedBanner({
  item, canAfford, owned, onBuy,
}: {
  item:      ShopItem
  canAfford: boolean
  owned:     boolean
  onBuy:     (id: string) => void
}) {
  const cat    = CATEGORY_META[item.category] ?? CATEGORY_META.badge
  const rarity = RARITY_META[item.metadata?.rarity ?? 'common']
  const Icon   = cat.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6',
        'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950',
        rarity.glow ? `shadow-xl ${rarity.glow}` : '',
        owned ? 'border-amber-500/40' : 'border-amber-500/30',
      )}
    >
      {/* Tło gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-30',
        rarity.gradient || 'from-amber-500/5',
        'to-transparent',
      )} />

      {/* Animated shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />

      <div className="relative flex items-center gap-6 flex-wrap">
        {/* Ikona */}
        <div className={cn(
          'w-20 h-20 rounded-2xl flex items-center justify-center shrink-0',
          cat.bg, 'border', cat.border,
        )}>
          <Icon className={cn('w-10 h-10', cat.color)} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] font-bold
                             text-amber-400 bg-amber-400/10 border border-amber-400/20
                             px-2 py-0.5 rounded-full">
              <Flame className="w-3 h-3" />
              Polecany
            </span>
            <span className={cn(
              'text-[11px] font-bold px-2 py-0.5 rounded-full',
              'bg-zinc-800 border border-zinc-700',
              rarity.color,
            )}>
              {rarity.label}
            </span>
            {isNew(item.created_at) && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full
                               bg-green-500/10 border border-green-500/20 text-green-400">
                Nowy!
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-white">{item.name}</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{item.description}</p>
          {item.stock !== null && (
            <p className="text-xs text-zinc-500 mt-1">
              Zostało:{' '}
              <span className={item.stock <= 3 ? 'text-red-400 font-bold' : 'text-zinc-400'}>
                {item.stock} szt.
              </span>
            </p>
          )}
        </div>

        {/* Cena + CTA */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <p className="text-3xl font-black text-amber-400">
            {item.price.toLocaleString('pl-PL')}
            <span className="text-sm font-semibold ml-1 text-amber-400/70">VTC€</span>
          </p>
          {owned ? (
            <span className="flex items-center gap-1.5 text-sm font-bold text-amber-400
                             bg-amber-400/10 border border-amber-400/20 px-4 py-2 rounded-xl">
              <CheckCircle className="w-4 h-4" />
              Posiadasz
            </span>
          ) : !canAfford ? (
            <span className="flex items-center gap-1.5 text-sm text-zinc-600
                             bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-800">
              <Lock className="w-4 h-4" />
              Za mało VTC€
            </span>
          ) : (
            <button
              onClick={() => onBuy(item.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black
                         text-sm bg-amber-500 hover:bg-amber-400 text-black
                         transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-400/30
                         hover:scale-105 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              Kup teraz
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Karta przedmiotu ──────────────────────────────────────
function ItemCard({
  item, canAfford, owned, onBuy, buying,
}: {
  item:      ShopItem
  canAfford: boolean
  owned:     boolean
  onBuy:     (id: string) => void
  buying:    boolean
}) {
  const cat      = CATEGORY_META[item.category] ?? CATEGORY_META.badge
  const rarity   = RARITY_META[item.metadata?.rarity ?? 'common']
  const Icon     = cat.icon
  const outOfStock = item.stock !== null && item.stock <= 0
  const newItem  = isNew(item.created_at)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={canAfford && !owned && !outOfStock ? { y: -2 } : {}}
      className={cn(
        'relative bg-zinc-900/60 border rounded-2xl overflow-hidden flex flex-col',
        'transition-colors duration-200 group',
        owned        && 'border-amber-500/30',
        !owned && canAfford && !outOfStock
                     && `border-zinc-800 hover:border-zinc-600 ${rarity.glow ? `shadow-lg ${rarity.glow}` : ''}`,
        !canAfford && !owned && 'border-zinc-800/50 opacity-60',
        outOfStock   && 'border-zinc-800/40 opacity-40',
      )}
    >
      {/* Top gradient z rzadkości */}
      {rarity.gradient && (
        <div className={cn(
          'absolute top-0 left-0 right-0 h-24 bg-gradient-to-b opacity-60',
          rarity.gradient, 'to-transparent pointer-events-none',
        )} />
      )}

      {/* Thumbnail */}
      <div className={cn('h-36 flex items-center justify-center relative overflow-hidden', cat.bg)}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <Icon className={cn('w-14 h-14 opacity-30', cat.color)} />
        )}

        {/* Rarity badge */}
        <span className={cn(
          'absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5',
          'rounded-full bg-zinc-900/90 border border-zinc-700/80 backdrop-blur-sm',
          rarity.color,
        )}>
          {rarity.label}
        </span>

        {/* Nowy badge */}
        {newItem && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5
                           rounded-full bg-green-500/20 border border-green-500/30
                           text-green-400 backdrop-blur-sm">
            ✦ Nowy
          </span>
        )}

        {/* Owned overlay */}
        {owned && (
          <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
            <div className="bg-zinc-900/80 rounded-full p-2 backdrop-blur-sm">
              <CheckCircle className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        )}

        {/* Stock warning */}
        {item.stock !== null && item.stock > 0 && item.stock <= 5 && (
          <span className="absolute bottom-2 left-2.5 text-[10px] font-bold px-2 py-0.5
                           rounded-full bg-red-500/20 border border-red-500/30 text-red-400">
            🔥 Ostatnie {item.stock}!
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 relative">
        <div className="flex items-start gap-2 mb-1">
          <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5', cat.bg)}>
            <Icon className={cn('w-3.5 h-3.5', cat.color)} />
          </div>
          <h3 className="text-sm font-black text-zinc-100 leading-snug">{item.name}</h3>
        </div>

        {item.description && (
          <p className="text-xs text-zinc-600 mt-1 mb-3 flex-1 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Cena + przycisk */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800/60">
          <div>
            <p className={cn(
              'text-base font-black leading-none',
              canAfford && !outOfStock ? 'text-amber-400' : 'text-zinc-600',
            )}>
              {item.price.toLocaleString('pl-PL')}
              <span className="text-[10px] font-semibold ml-1">VTC€</span>
            </p>
          </div>

          {owned ? (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <CheckCircle className="w-3.5 h-3.5" /> Posiadasz
            </span>
          ) : outOfStock ? (
            <span className="text-xs text-zinc-600 font-semibold">Wyprzedany</span>
          ) : !canAfford ? (
            <span className="flex items-center gap-1 text-xs text-zinc-600">
              <Lock className="w-3 h-3" /> Za mało
            </span>
          ) : (
            <button
              onClick={() => onBuy(item.id)}
              disabled={buying}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black',
                'bg-amber-500 hover:bg-amber-400 text-black transition-all',
                'hover:shadow-md hover:shadow-amber-500/25 active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {buying
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <ShoppingBag className="w-3.5 h-3.5" />
              }
              Kup
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Confirm Modal ─────────────────────────────────────────
function ConfirmModal({
  item, balance, onConfirm, onCancel, loading,
}: {
  item:      ShopItem
  balance:   number
  onConfirm: () => void
  onCancel:  () => void
  loading:   boolean
}) {
  const cat    = CATEGORY_META[item.category] ?? CATEGORY_META.badge
  const rarity = RARITY_META[item.metadata?.rarity ?? 'common']
  const Icon   = cat.icon
  const afterBalance = balance - item.price

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                 bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800
                   rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Top color bar */}
        <div className={cn('h-1', {
          'bg-zinc-600':   (item.metadata?.rarity ?? 'common') === 'common',
          'bg-green-500':  item.metadata?.rarity === 'uncommon',
          'bg-blue-500':   item.metadata?.rarity === 'rare',
          'bg-purple-500': item.metadata?.rarity === 'epic',
          'bg-amber-500':  item.metadata?.rarity === 'legendary',
          'bg-pink-500':   item.metadata?.rarity === 'mystery',
        })} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
              cat.bg, 'border', cat.border,
            )}>
              <Icon className={cn('w-7 h-7', cat.color)} />
            </div>
            <div>
              <p className={cn('text-[11px] font-bold mb-0.5', rarity.color)}>
                {rarity.label}
              </p>
              <h3 className="font-black text-white text-lg leading-tight">{item.name}</h3>
              {item.description && (
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{item.description}</p>
              )}
            </div>
          </div>

          {/* Podsumowanie */}
          <div className="bg-zinc-800/60 rounded-xl p-4 mb-5 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Cena przedmiotu</span>
              <span className="font-black text-amber-400">
                {item.price.toLocaleString('pl-PL')} VTC€
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Twoje saldo</span>
              <span className="text-zinc-300">{balance.toLocaleString('pl-PL')} VTC€</span>
            </div>
            <div className="h-px bg-zinc-700" />
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Saldo po zakupie</span>
              <span className={cn('font-black', afterBalance >= 0 ? 'text-white' : 'text-red-400')}>
                {afterBalance.toLocaleString('pl-PL')} VTC€
              </span>
            </div>
          </div>

          {/* Przyciski */}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl
                         text-sm font-semibold text-zinc-400 transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 rounded-xl
                         text-sm font-black text-black transition-all
                         disabled:opacity-50 flex items-center justify-center gap-2
                         shadow-lg shadow-amber-500/20"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Zap className="w-4 h-4" />
              }
              Potwierdź zakup
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Główny komponent ──────────────────────────────────────
export function ShopClient({ items, balance: initialBalance, memberId, ownedItemIds }: Props) {
  const [balance,  setBalance]  = useState(initialBalance)
  const [owned,    setOwned]    = useState(new Set(ownedItemIds))
  const [category, setCategory] = useState<Category>('all')
  const [sort,     setSort]     = useState<SortKey>('price_asc')
  const [search,   setSearch]   = useState('')
  const [confirm,  setConfirm]  = useState<ShopItem | null>(null)
  const [buying,   setBuying]   = useState<string | null>(null)
  const [burst,    setBurst]    = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  // Featured item — pierwszy z metadata.featured = true
  const featuredItem = useMemo(
    () => items.find(i => i.metadata?.featured === true && i.is_active),
    [items]
  )

  // Kategorie z licznikami
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach(i => counts.set(i.category, (counts.get(i.category) ?? 0) + 1))
    return counts
  }, [items])

  // Filtrowanie + sortowanie
  const filtered = useMemo(() => {
    let result = [...items]

    if (category !== 'all') result = result.filter(i => i.category === category)

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.description ?? '').toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'price_asc':  return a.price - b.price
        case 'price_desc': return b.price - a.price
        case 'rarity':
          return (RARITY_ORDER.indexOf(b.metadata?.rarity ?? 'common')) -
                 (RARITY_ORDER.indexOf(a.metadata?.rarity ?? 'common'))
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default: return 0
      }
    })

    return result
  }, [items, category, search, sort])

  const handleBuy = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) setConfirm(item)
  }

  const handleConfirm = async () => {
    if (!confirm) return
    setBuying(confirm.id)

    const res = await buyItem(confirm.id)

    if (res.ok) {
      setBalance(res.newBalance ?? balance - confirm.price)
      setOwned(prev => new Set([...prev, confirm.id]))
      setConfirm(null)
      // Particle burst
      setBurst(true)
      setTimeout(() => setBurst(false), 800)
      toast.success(`🎉 Zakupiono: ${res.itemName}!`, {
        description: `Nowe saldo: ${(res.newBalance ?? 0).toLocaleString('pl-PL')} VTC€`,
      })
    } else {
      toast.error(res.error ?? 'Błąd zakupu')
    }

    setBuying(null)
  }

  const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Sortuj'

  return (
    <>
      <ParticleBurst active={burst} />

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20
                            flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Sklep VTC</h1>
              <p className="text-sm text-zinc-500">
                Wydaj zarobione VTC€ na ekskluzywne przedmioty
              </p>
            </div>
          </div>

          {/* Saldo */}
          <motion.div
            key={balance}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2.5 bg-zinc-900/80 border
                       border-amber-500/20 rounded-xl px-4 py-2.5"
          >
            <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider leading-none mb-0.5">
                Saldo
              </p>
              <p className="text-sm font-black text-amber-400 leading-none">
                {balance.toLocaleString('pl-PL')} VTC€
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Featured Banner ─────────────────────────────── */}
        {featuredItem && (
          <FeaturedBanner
            item={featuredItem}
            canAfford={balance >= featuredItem.price}
            owned={owned.has(featuredItem.id)}
            onBuy={handleBuy}
          />
        )}

        {/* ── Filtry + Wyszukiwarka ────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Szukaj przedmiotu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl
                         pl-9 pr-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-600
                         focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSortOpen(v => !v)}
              className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800
                         hover:border-zinc-700 rounded-xl px-4 py-2.5 text-sm
                         text-zinc-400 transition-colors whitespace-nowrap"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortLabel}
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', sortOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,  scale: 1    }}
                  exit={{    opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border
                             border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden"
                >
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors',
                        sort === opt.value
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                      )}
                    >
                      {opt.value === sort && <span className="mr-2">✓</span>}
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Kategorie ───────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategory('all')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold',
              'whitespace-nowrap transition-all border shrink-0',
              category === 'all'
                ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200',
            )}
          >
            <Star className="w-3.5 h-3.5" />
            Wszystko
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
              category === 'all' ? 'bg-black/20' : 'bg-zinc-800',
            )}>
              {items.length}
            </span>
          </button>

          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const count  = categoryCounts.get(key) ?? 0
            if (!count) return null
            const CatIcon  = meta.icon
            const active = category === key
            return (
              <button
                key={key}
                onClick={() => setCategory(key as Category)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold',
                  'whitespace-nowrap transition-all border shrink-0',
                  active
                    ? `${meta.bg} ${meta.border} ${meta.color} shadow-sm`
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200',
                )}
              >
                <CatIcon className="w-3.5 h-3.5" />
                {meta.label}
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                  active ? 'bg-black/20' : 'bg-zinc-800',
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Grid ────────────────────────────────────────── */}
        {filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  canAfford={balance >= item.price}
                  owned={owned.has(item.id)}
                  onBuy={handleBuy}
                  buying={buying === item.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <ShoppingBag className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-500 font-semibold">
              {search ? `Brak wyników dla "${search}"` : 'Brak przedmiotów w tej kategorii'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-xs text-amber-400 hover:underline"
              >
                Wyczyść wyszukiwanie
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Confirm Modal ────────────────────────────────── */}
      <AnimatePresence>
        {confirm && (
          <ConfirmModal
            item={confirm}
            balance={balance}
            onConfirm={handleConfirm}
            onCancel={() => !buying && setConfirm(null)}
            loading={!!buying}
          />
        )}
      </AnimatePresence>
    </>
  )
}