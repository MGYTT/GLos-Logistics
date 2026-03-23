'use client'

import { useState, useMemo }       from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast }                   from 'sonner'
import { format }                  from 'date-fns'
import { pl }                      from 'date-fns/locale'
import {
  Wallet, Search, ArrowUpRight, ArrowDownLeft,
  ArrowLeftRight, RotateCcw, Fuel, TrendingUp,
  TrendingDown, Users, Plus, Minus,
  Clock, Banknote, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { cn }     from '@/lib/utils/cn'
import {
  adjustBalance,
  transferBalance,
  resetWallet,
  setFuelPrice,
} from './actions'

// ─── Typy ──────────────────────────────────────────────────
interface WalletRow {
  member_id:    string
  balance:      number
  total_earned: number
  total_spent:  number
  updated_at:   string
  member: {
    id:         string
    username:   string
    avatar_url: string | null
    rank:       string
    is_banned:  boolean
  } | null
}

interface Transaction {
  id:            string
  member_id:     string
  type:          string
  amount:        number
  balance_after: number | null
  description:   string | null
  created_at:    string
  member: {
    username:   string
    avatar_url: string | null
    rank:       string
  } | null
}

interface FuelRow {
  price_per_liter: number
  valid_until:     string | null
}

interface Props {
  wallets:            WalletRow[]
  recentTransactions: Transaction[]
  stats: {
    totalBalance: number
    totalEarned:  number
    totalSpent:   number
  }
  currentFuel: FuelRow | null
  adminId:     string
}

type Tab   = 'wallets' | 'history' | 'tools'
type Modal = 'credit' | 'debit' | 'transfer' | 'reset' | 'fuel' | null

// ─── Helpers ───────────────────────────────────────────────
const TX_LABELS: Record<string, string> = {
  job_pay:       'Wypłata za job',
  weekly_bonus:  'Bonus tygodniowy',
  shop_purchase: 'Zakup w sklepie',
  fine:          'Mandat',
  loan_out:      'Pożyczka',
  loan_repay:    'Spłata pożyczki',
  deposit_in:    'Lokata',
  deposit_out:   'Wypłata lokaty',
  manual_credit: 'Kredyt manualny',
  manual_debit:  'Debet manualny',
}

function txColor(amount: number) {
  return amount >= 0 ? 'text-green-400' : 'text-red-400'
}

function Avatar({
  url, name, size = 8,
}: { url: string | null; name: string; size?: number }) {
  return (
    <div
      className={cn(
        `w-${size} h-${size} rounded-full bg-zinc-800 shrink-0 overflow-hidden`,
        'flex items-center justify-center text-amber-400 font-bold',
        size <= 8 ? 'text-sm' : 'text-base',
      )}
    >
      {url
        ? <img src={url} alt="" className="w-full h-full object-cover" />
        : (name[0] ?? '?').toUpperCase()
      }
    </div>
  )
}

// ─── Modal operacji ────────────────────────────────────────
function OperationModal({
  type,
  wallets,
  preselectedMemberId,
  onClose,
  onDone,
}: {
  type:                 NonNullable<Modal>
  wallets:             WalletRow[]
  preselectedMemberId?: string
  onClose:             () => void
  onDone:              () => void
}) {
  const [loading,     setLoading]     = useState(false)
  const [memberId,    setMemberId]    = useState(preselectedMemberId ?? '')
  const [toMemberId,  setToMemberId]  = useState('')
  const [amount,      setAmount]      = useState('')
  const [description, setDescription] = useState('')
  const [fuelDays,    setFuelDays]    = useState('7')

  const members = wallets.filter(w => w.member && !w.member.is_banned)

  async function handle() {
    // Walidacja
    if (type !== 'fuel' && !memberId) {
      toast.error('Wybierz kierowcę')
      return
    }
    if (type === 'transfer' && !toMemberId) {
      toast.error('Wybierz kierowcę docelowego')
      return
    }
    if (type !== 'reset' && !amount) {
      toast.error('Podaj kwotę')
      return
    }
    if (type !== 'reset' && Number(amount) <= 0) {
      toast.error('Kwota musi być większa od 0')
      return
    }

    setLoading(true)
    try {
      let result: { ok: boolean; error?: string }

      if (type === 'credit') {
        result = await adjustBalance(memberId, Number(amount), description)
      } else if (type === 'debit') {
        result = await adjustBalance(memberId, -Number(amount), description)
      } else if (type === 'transfer') {
        result = await transferBalance(memberId, toMemberId, Number(amount), description)
      } else if (type === 'reset') {
        result = await resetWallet(memberId, description)
      } else {
        result = await setFuelPrice(Number(amount), Number(fuelDays))
      }

      if (!result.ok) {
        toast.error(result.error ?? 'Błąd operacji')
      } else {
        toast.success('Operacja wykonana!')
        onDone()
        onClose()
      }
    } catch (e) {
      toast.error('Nieoczekiwany błąd — sprawdź konsolę')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const titles: Record<NonNullable<Modal>, string> = {
    credit:   '💰 Dodaj VTC€',
    debit:    '💸 Odejmij VTC€',
    transfer: '↔️ Transfer środków',
    reset:    '🔄 Reset portfela',
    fuel:     '⛽ Ustaw cenę paliwa',
  }

  const selectClass =
    'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 ' +
    'text-sm text-zinc-100 outline-none focus:border-amber-500/60 transition-colors'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{    opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1,    y: 0  }}
        exit={{    scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl
                   p-6 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-lg font-black mb-5">{titles[type]}</h2>

        <div className="space-y-3">
          {/* Kierowca (źródło) */}
          {type !== 'fuel' && (
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                {type === 'transfer' ? 'Skąd (źródło)' : 'Kierowca'}
              </label>
              <select
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
                className={selectClass}
              >
                <option value="">— wybierz kierowcę —</option>
                {members.map(w => (
                  <option key={w.member_id} value={w.member_id}>
                    {w.member?.username} — {w.balance.toLocaleString('pl-PL')} VTC€
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Transfer: cel */}
          {type === 'transfer' && (
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Dokąd (cel)
              </label>
              <select
                value={toMemberId}
                onChange={e => setToMemberId(e.target.value)}
                className={selectClass}
              >
                <option value="">— wybierz kierowcę —</option>
                {members
                  .filter(w => w.member_id !== memberId)
                  .map(w => (
                    <option key={w.member_id} value={w.member_id}>
                      {w.member?.username} — {w.balance.toLocaleString('pl-PL')} VTC€
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Kwota */}
          {type !== 'reset' && (
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                {type === 'fuel' ? 'Cena (VTC€/L)' : 'Kwota (VTC€)'}
              </label>
              <Input
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="np. 1000"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          )}

          {/* Czas ważności paliwa */}
          {type === 'fuel' && (
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Ważne przez (dni)
              </label>
              <select
                value={fuelDays}
                onChange={e => setFuelDays(e.target.value)}
                className={selectClass}
              >
                {[1, 3, 7, 14, 30].map(d => (
                  <option key={d} value={d}>
                    {d} {d === 1 ? 'dzień' : 'dni'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Opis */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
              {type === 'reset' ? 'Powód resetu' : 'Opis operacji'}
            </label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={
                type === 'reset'
                  ? 'np. Naruszenie regulaminu'
                  : 'np. Bonus za konwój'
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>

        {/* Ostrzeżenie reset */}
        {type === 'reset' && (
          <p className="mt-3 text-xs text-red-400 bg-red-500/10
                        border border-red-500/20 rounded-lg px-3 py-2">
            ⚠️ Ta operacja wyzeruje saldo kierowcy i jest nieodwracalna.
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 border-zinc-700"
          >
            Anuluj
          </Button>
          <Button
            onClick={handle}
            disabled={loading}
            className={cn(
              'flex-1 font-bold',
              type === 'reset'
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-black',
            )}
          >
            {loading ? 'Przetwarzam...' : 'Zatwierdź'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Główny komponent ──────────────────────────────────────
export function AdminWalletClient({
  wallets,
  recentTransactions,
  stats,
  currentFuel,
}: Props) {
  const [tab,        setTab]        = useState<Tab>('wallets')
  const [modal,      setModal]      = useState<Modal>(null)
  const [preselect,  setPreselect]  = useState<string | undefined>(undefined)
  const [search,     setSearch]     = useState('')
  const [txFilter,   setTxFilter]   = useState('all')
  const [data,       setData]       = useState({ wallets, recentTransactions, stats })

  function openModal(type: NonNullable<Modal>, memberId?: string) {
    setPreselect(memberId)
    setModal(type)
  }

  function closeModal() {
    setModal(null)
    setPreselect(undefined)
  }

  const filteredWallets = useMemo(() =>
    data.wallets.filter(w =>
      !search ||
      w.member?.username.toLowerCase().includes(search.toLowerCase()),
    ),
    [data.wallets, search],
  )

  const filteredTx = useMemo(() =>
    data.recentTransactions.filter(tx =>
      txFilter === 'all' || tx.type === txFilter,
    ),
    [data.recentTransactions, txFilter],
  )

  const tabs = [
    { id: 'wallets' as Tab, label: 'Portfele',   icon: Wallet         },
    { id: 'history' as Tab, label: 'Transakcje', icon: Clock          },
    { id: 'tools'   as Tab, label: 'Narzędzia',  icon: ArrowLeftRight },
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Nagłówek */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Portfele VTC</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Zarządzaj finansami kierowców
          </p>
        </div>
        {currentFuel && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20
                          rounded-xl px-3 py-2 text-xs text-amber-400 shrink-0">
            <Fuel className="w-3.5 h-3.5" />
            <span className="font-semibold">
              {currentFuel.price_per_liter.toLocaleString('pl-PL')} VTC€/L
            </span>
            {currentFuel.valid_until && (
              <span className="text-amber-600">
                do {format(new Date(currentFuel.valid_until), 'd MMM', { locale: pl })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Statystyki globalne */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Łączne saldo VTC',
            value: `${data.stats.totalBalance.toLocaleString('pl-PL')} VTC€`,
            icon:  Wallet,
            color: 'text-amber-400',
            bg:    'bg-amber-400/10',
          },
          {
            label: 'Łącznie zarobione',
            value: `${data.stats.totalEarned.toLocaleString('pl-PL')} VTC€`,
            icon:  TrendingUp,
            color: 'text-green-400',
            bg:    'bg-green-400/10',
          },
          {
            label: 'Łącznie wydane',
            value: `${data.stats.totalSpent.toLocaleString('pl-PL')} VTC€`,
            icon:  TrendingDown,
            color: 'text-red-400',
            bg:    'bg-red-400/10',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5
                       flex items-center gap-4"
          >
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', bg)}>
              <Icon className={cn('w-6 h-6', color)} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
              <p className={cn('text-xl font-black mt-0.5', color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg',
              'text-sm font-medium transition-all flex-1 justify-center',
              tab === id
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: PORTFELE ── */}
      {tab === 'wallets' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-zinc-600 pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj kierowcy..."
              className="pl-10 bg-zinc-900 border-zinc-700"
            />
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4
                            px-5 py-3 border-b border-zinc-800
                            text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              <span>Kierowca</span>
              <span className="text-right">Saldo</span>
              <span className="text-right hidden sm:block">Zarobione</span>
              <span className="text-right">Akcje</span>
            </div>

            <div className="divide-y divide-zinc-800/40">
              {filteredWallets.map(w => (
                <div
                  key={w.member_id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4
                             items-center px-5 py-3.5
                             hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar url={w.member?.avatar_url ?? null} name={w.member?.username ?? '?'} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {w.member?.username ?? '—'}
                      </p>
                      <p className="text-xs text-zinc-600">{w.member?.rank}</p>
                    </div>
                  </div>

                  <p className="text-sm font-black text-amber-400 text-right">
                    {w.balance.toLocaleString('pl-PL')} VTC€
                  </p>

                  <p className="text-xs text-green-400 text-right hidden sm:block">
                    +{w.total_earned.toLocaleString('pl-PL')}
                  </p>

                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => openModal('credit', w.member_id)}
                      title="Dodaj VTC€"
                      className="w-7 h-7 rounded-lg bg-green-500/10 text-green-400
                                 hover:bg-green-500/20 flex items-center justify-center
                                 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openModal('debit', w.member_id)}
                      title="Odejmij VTC€"
                      className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400
                                 hover:bg-red-500/20 flex items-center justify-center
                                 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredWallets.length === 0 && (
                <div className="py-12 text-center text-zinc-600">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Brak wyników</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: TRANSAKCJE ── */}
      {tab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
            {[
              'all', 'job_pay', 'manual_credit',
              'manual_debit', 'fine', 'shop_purchase',
            ].map(f => (
              <button
                key={f}
                onClick={() => setTxFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  txFilter === f
                    ? 'bg-amber-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200',
                )}
              >
                {f === 'all' ? 'Wszystkie' : (TX_LABELS[f] ?? f)}
              </button>
            ))}
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-zinc-800/40">
              {filteredTx.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-5 py-3.5
                             hover:bg-white/[0.02] transition-colors"
                >
                  <Avatar
                    url={tx.member?.avatar_url ?? null}
                    name={tx.member?.username ?? '?'}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-200">
                        {tx.member?.username ?? '—'}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {TX_LABELS[tx.type] ?? tx.type}
                      </span>
                    </div>
                    {tx.description && (
                      <p className="text-xs text-zinc-600 truncate mt-0.5">
                        {tx.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-black', txColor(tx.amount))}>
                      {tx.amount >= 0 ? '+' : ''}
                      {tx.amount.toLocaleString('pl-PL')} VTC€
                    </p>
                    <p className="text-[10px] text-zinc-700 mt-0.5">
                      {format(new Date(tx.created_at), 'd MMM yyyy, HH:mm', { locale: pl })}
                    </p>
                  </div>
                </div>
              ))}

              {filteredTx.length === 0 && (
                <div className="py-16 text-center text-zinc-600">
                  <Banknote className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Brak transakcji</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: NARZĘDZIA ── */}
      {tab === 'tools' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {([
            {
              modal:       'credit'   as Modal,
              icon:        ArrowUpRight,
              title:       'Dodaj VTC€',
              description: 'Dodaj środki do portfela kierowcy (bonus, nagroda, korekta)',
              color:       'text-green-400',
              bg:          'bg-green-400/10',
              border:      'hover:border-green-400/20',
            },
            {
              modal:       'debit'    as Modal,
              icon:        ArrowDownLeft,
              title:       'Odejmij VTC€',
              description: 'Odejmij środki z portfela (mandat, kara, korekta)',
              color:       'text-red-400',
              bg:          'bg-red-400/10',
              border:      'hover:border-red-400/20',
            },
            {
              modal:       'transfer' as Modal,
              icon:        ArrowLeftRight,
              title:       'Transfer',
              description: 'Przenieś środki między portfelami kierowców',
              color:       'text-blue-400',
              bg:          'bg-blue-400/10',
              border:      'hover:border-blue-400/20',
            },
            {
              modal:       'fuel'     as Modal,
              icon:        Fuel,
              title:       'Cena paliwa',
              description: 'Ustaw aktualną cenę paliwa VTC€/L widoczną w portfelu',
              color:       'text-amber-400',
              bg:          'bg-amber-400/10',
              border:      'hover:border-amber-400/20',
            },
            {
              modal:       'reset'    as Modal,
              icon:        RotateCcw,
              title:       'Reset portfela',
              description: 'Wyzeruj saldo kierowcy (nieodwracalne)',
              color:       'text-zinc-400',
              bg:          'bg-zinc-400/10',
              border:      'hover:border-zinc-400/20',
            },
          ] as const).map(({ modal, icon: Icon, title, description, color, bg, border }) => (
            <button
              key={modal}
              onClick={() => openModal(modal!)}
              className={cn(
                'bg-zinc-900/60 border border-zinc-800 rounded-xl p-5',
                'text-left transition-colors', border,
              )}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <p className="font-bold text-sm text-white">{title}</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <OperationModal
            type={modal}
            wallets={data.wallets}
            preselectedMemberId={preselect}
            onClose={closeModal}
            onDone={() => window.location.reload()}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
