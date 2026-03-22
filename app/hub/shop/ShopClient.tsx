'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast }   from 'sonner'
import {
  ShoppingBag, Wallet, Star, Package,
  Shield, Truck, Gift, Sparkles,
  CheckCircle, Lock, ChevronRight, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { buyItem } from './actions'

// ─── Typy ──────────────────────────────────────
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
}

interface Props {
  items:        ShopItem[]
  balance:      number
  memberId:     string
  ownedItemIds: string[]
}

type Category = 'all' | 'livery' | 'badge' | 'upgrade' | 'fleet_slot' | 'lootbox'

// ─── Helpers ───────────────────────────────────
const CATEGORY_META: Record<string, {
  label: string
  icon:  React.ElementType
  color: string
  bg:    string
}> = {
  livery:     { label: 'Malowania',    icon: Truck,       color: 'text-amber-400',  bg: 'bg-amber-400/10'  },
  badge:      { label: 'Odznaki',      icon: Shield,      color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  upgrade:    { label: 'Ulepszenia',   icon: Sparkles,    color: 'text-purple-400', bg: 'bg-purple-400/10' },
  fleet_slot: { label: 'Flota',        icon: Package,     color: 'text-green-400',  bg: 'bg-green-400/10'  },
  lootbox:    { label: 'Skrzynki',     icon: Gift,        color: 'text-pink-400',   bg: 'bg-pink-400/10'   },
}

const RARITY_META: Record<string, { label: string; color: string; glow: string }> = {
  common:    { label: 'Zwykły',     color: 'text-zinc-400',   glow: ''                           },
  uncommon:  { label: 'Rzadki',     color: 'text-green-400',  glow: 'shadow-green-400/20'        },
  rare:      { label: 'Rzadki+',    color: 'text-blue-400',   glow: 'shadow-blue-400/20'         },
  epic:      { label: 'Epicki',     color: 'text-purple-400', glow: 'shadow-purple-400/20'       },
  legendary: { label: 'Legendarny', color: 'text-amber-400',  glow: 'shadow-amber-400/30'        },
  mystery:   { label: 'Tajemniczy', color: 'text-pink-400',   glow: 'shadow-pink-400/20'         },
}

// ─── Karta przedmiotu ──────────────────────────
function ItemCard({
  item, canAfford, owned, onBuy, buying,
}: {
  item:      ShopItem
  canAfford: boolean
  owned:     boolean
  onBuy:     (id: string) => void
  buying:    boolean
}) {
  const cat     = CATEGORY_META[item.category] ?? CATEGORY_META.badge
  const rarity  = RARITY_META[item.metadata?.rarity ?? 'common']
  const Icon    = cat.icon
  const outOfStock = item.stock !== null && item.stock <= 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      className={cn(
        'bg-zinc-900/60 border rounded-xl overflow-hidden flex flex-col',
        'transition-all duration-200 group',
        owned      && 'border-amber-500/30',
        !owned && canAfford && !outOfStock
                   && 'border-zinc-800 hover:border-zinc-600',
        !canAfford && !owned
                   && 'border-zinc-800/50 opacity-70',
        outOfStock && 'border-zinc-800/40 opacity-50',
        rarity.glow && `shadow-lg ${rarity.glow}`,
      )}
    >
      {/* Thumbnail / placeholder */}
      <div className={cn(
        'h-32 flex items-center justify-center relative overflow-hidden',
        cat.bg,
      )}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name}
            className="w-full h-full object-cover" />
        ) : (
          <Icon className={cn('w-12 h-12 opacity-40', cat.color)} />
        )}

        {/* Rarity badge */}
        <span className={cn(
          'absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5',
          'rounded-full bg-zinc-900/80 border border-zinc-700',
          rarity.color,
        )}>
          {rarity.label}
        </span>

        {/* Owned overlay */}
        {owned && (
          <div className="absolute inset-0 bg-amber-500/10 flex items-center
                          justify-center">
            <CheckCircle className="w-10 h-10 text-amber-400 drop-shadow-lg" />
          </div>
        )}

        {/* Stock badge */}
        {item.stock !== null && item.stock > 0 && item.stock <= 5 && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5
                           rounded-full bg-red-500/20 border border-red-500/30
                           text-red-400">
            Ostatnie {item.stock}!
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-2 mb-1">
          <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0', cat.bg)}>
            <Icon className={cn('w-3.5 h-3.5', cat.color)} />
          </div>
          <h3 className="text-sm font-bold text-zinc-100 leading-tight">
            {item.name}
          </h3>
        </div>

        {item.description && (
          <p className="text-xs text-zinc-600 mt-1 mb-3 flex-1">
            {item.description}
          </p>
        )}

        {/* Cena + przycisk */}
        <div className="flex items-center justify-between mt-auto pt-3
                        border-t border-zinc-800/60">
          <div>
            <p className={cn(
              'text-lg font-black',
              canAfford && !outOfStock ? 'text-amber-400' : 'text-zinc-600',
            )}>
              {item.price.toLocaleString('pl-PL')}
              <span className="text-xs font-semibold ml-1">VTC€</span>
            </p>
          </div>

          {owned ? (
            <span className="flex items-center gap-1 text-xs font-bold
                             text-amber-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Posiadasz
            </span>
          ) : outOfStock ? (
            <span className="text-xs text-zinc-600 font-semibold">
              Wyprzedany
            </span>
          ) : !canAfford ? (
            <span className="flex items-center gap-1 text-xs text-zinc-600">
              <Lock className="w-3.5 h-3.5" />
              Za mało VTC€
            </span>
          ) : (
            <button
              onClick={() => onBuy(item.id)}
              disabled={buying}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                'text-xs font-bold transition-all',
                'bg-amber-500 hover:bg-amber-400 text-black',
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

// ─── Confirm modal ─────────────────────────────
function ConfirmModal({
  item, balance, onConfirm, onCancel, loading,
}: {
  item:      ShopItem
  balance:   number
  onConfirm: () => void
  onCancel:  () => void
  loading:   boolean
}) {
  const cat = CATEGORY_META[item.category] ?? CATEGORY_META.badge
  const Icon = cat.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.95, opacity: 0         }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800
                   rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', cat.bg)}>
            <Icon className={cn('w-6 h-6', cat.color)} />
          </div>
          <div>
            <h3 className="font-black text-white">{item.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
          </div>
        </div>

        <div className="bg-zinc-800/60 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Cena</span>
            <span className="font-bold text-amber-400">
              {item.price.toLocaleString('pl-PL')} VTC€
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Saldo przed</span>
            <span className="text-zinc-300">{balance.toLocaleString('pl-PL')} VTC€</span>
          </div>
          <div className="flex justify-between text-sm border-t border-zinc-700 pt-2">
            <span className="text-zinc-500">Saldo po</span>
            <span className="font-bold text-white">
              {(balance - item.price).toLocaleString('pl-PL')} VTC€
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl
                       text-sm text-zinc-400 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 rounded-xl
                       text-sm font-black text-black transition-colors
                       disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ShoppingBag className="w-4 h-4" />
            }
            Potwierdź zakup
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Główny komponent ──────────────────────────
export function ShopClient({ items, balance: initialBalance, memberId, ownedItemIds }: Props) {
  const [balance,  setBalance]  = useState(initialBalance)
  const [owned,    setOwned]    = useState(new Set(ownedItemIds))
  const [category, setCategory] = useState<Category>('all')
  const [confirm,  setConfirm]  = useState<ShopItem | null>(null)
  const [buying,   setBuying]   = useState<string | null>(null)

  // Kategorie z licznikami
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach(i => counts.set(i.category, (counts.get(i.category) ?? 0) + 1))
    return counts
  }, [items])

  const filtered = useMemo(() =>
    category === 'all'
      ? items
      : items.filter(i => i.category === category),
  [items, category])

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
      toast.success(`Zakupiono: ${res.itemName}!`, {
        description: `Nowe saldo: ${(res.newBalance ?? 0).toLocaleString('pl-PL')} VTC€`,
      })
      setConfirm(null)
    } else {
      toast.error(res.error ?? 'Błąd zakupu')
    }

    setBuying(null)
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center
                            justify-center">
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
          <div className="flex items-center gap-2 bg-zinc-900/60 border
                          border-amber-500/20 rounded-xl px-4 py-2.5">
            <Wallet className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                Saldo
              </p>
              <p className="text-sm font-black text-amber-400">
                {balance.toLocaleString('pl-PL')} VTC€
              </p>
            </div>
          </div>
        </div>

        {/* Kategorie */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory('all')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold',
              'whitespace-nowrap transition-all border',
              category === 'all'
                ? 'bg-amber-500 text-black border-amber-500'
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
            const count  = categories.get(key) ?? 0
            if (!count) return null
            const Icon   = meta.icon
            const active = category === key
            return (
              <button
                key={key}
                onClick={() => setCategory(key as Category)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold',
                  'whitespace-nowrap transition-all border',
                  active
                    ? `${meta.bg} border-current ${meta.color}`
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
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

        {/* Grid */}
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

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-500">Brak przedmiotów w tej kategorii</p>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirm && (
          <ConfirmModal
            item={confirm}
            balance={balance}
            onConfirm={handleConfirm}
            onCancel={() => setConfirm(null)}
            loading={!!buying}
          />
        )}
      </AnimatePresence>
    </>
  )
}
