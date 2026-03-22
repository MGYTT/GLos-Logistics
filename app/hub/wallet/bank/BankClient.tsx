'use client'

import { useState, useEffect }     from 'react'
import { motion, AnimatePresence }  from 'framer-motion'
import { toast }                    from 'sonner'
import { format }                   from 'date-fns'
import { pl }                       from 'date-fns/locale'
import {
  Landmark, PiggyBank, AlertCircle, CheckCircle,
  Clock, ChevronRight, Loader2, TrendingUp,
  Wallet, Info, X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { takeLoan, repayLoan, openDeposit, withdrawDeposit } from './actions'

// ─── Typy ──────────────────────────────────────
export interface Loan {
  id:            string
  principal:     number
  amount_due:    number
  interest_rate: number
  due_at:        string
  status:        'active' | 'repaid' | 'overdue'
  created_at:    string
}

export interface Deposit {
  id:            string
  amount:        number
  payout:        number        // GENERATED ALWAYS AS STORED — może być null z Supabase
  interest_rate: number
  matures_at:    string
  status:        'active' | 'matured' | 'withdrawn'
  created_at:    string
}

interface Props {
  balance:          number
  loans:            Loan[]
  deposits:         Deposit[]
  onBalanceChange:  (b: number)    => void
  onLoansChange:    (l: Loan[])    => void
  onDepositsChange: (d: Deposit[]) => void
}

// ─── Hook: bezpieczny czas po montażu ──────────
// Zapobiega SSR/client mismatch przy Date.now()
function useNow() {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => { setNow(Date.now()) }, [])
  return now
}

// ─── Helper: bezpieczne payout ────────────────
function safePayout(d: Deposit): number {
  if (d.payout != null && !isNaN(d.payout)) return d.payout
  // Fallback: oblicz lokalnie jeśli Supabase nie zwróciło GENERATED kolumny
  return Math.round(d.amount * (1 + d.interest_rate) * 100) / 100
}

// ─── Stałe ─────────────────────────────────────
const LOAN_PRESETS  = [500, 1000, 2000, 5000, 10000]
const DEPOSIT_PLANS = [
  { days:  7 as const, rate: 3, label: '7 dni',  color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  { days: 14 as const, rate: 5, label: '14 dni', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  { days: 30 as const, rate: 8, label: '30 dni', color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
]

// ─── Modal wrapper ─────────────────────────────
function Modal({ title, onClose, children }: {
  title:    string
  onClose:  () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{   opacity: 0  }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                 bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{   y: 40,  opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800
                   rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-zinc-800">
          <h3 className="font-black text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700
                       flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  )
}

// ─── Modal pożyczki ────────────────────────────
function LoanModal({ balance, onClose, onSuccess }: {
  balance:   number
  onClose:   () => void
  onSuccess: (newBalance: number, newLoan: Loan) => void
}) {
  const [amount,  setAmount]  = useState<number>(1000)
  const [custom,  setCustom]  = useState('')
  const [loading, setLoading] = useState(false)

  const finalAmount = custom ? Number(custom) : amount
  const amountDue   = Math.round(finalAmount * 1.08 * 100) / 100
  const valid       = finalAmount >= 500 && finalAmount <= 10000
    && !isNaN(finalAmount) && finalAmount > 0

  async function handleTake() {
    if (!valid) return
    setLoading(true)
    const res = await takeLoan(finalAmount)
    setLoading(false)
    if (!res.ok) { toast.error(res.error); return }

    const newLoan: Loan = {
      id:            res.data.loan_id ?? crypto.randomUUID(),
      principal:     finalAmount,
      amount_due:    res.data.amount_due,
      interest_rate: 0.08,
      due_at:        res.data.due_at,
      status:        'active',
      created_at:    new Date().toISOString(),
    }

    toast.success(`Pożyczka ${finalAmount.toLocaleString('pl-PL')} VTC€ przyznana!`, {
      description: `Do spłaty: ${amountDue.toLocaleString('pl-PL')} VTC€ w ciągu 30 dni`,
    })
    onSuccess(res.data.balance, newLoan)
    onClose()
  }

  return (
    <Modal title="Weź pożyczkę" onClose={onClose}>
      <div className="space-y-5">

        <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20
                        rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80">
            Oprocentowanie <strong>8%</strong> — do spłaty w ciągu
            <strong> 30 dni</strong>. Max 1 aktywna pożyczka.
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Wybierz kwotę
          </p>
          <div className="grid grid-cols-5 gap-2">
            {LOAN_PRESETS.map(p => (
              <button
                key={p}
                onClick={() => { setAmount(p); setCustom('') }}
                className={cn(
                  'py-2 rounded-xl text-xs font-bold transition-all border',
                  amount === p && !custom
                    ? 'bg-amber-500 border-amber-500 text-black'
                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200',
                )}
              >
                {p >= 1000 ? `${p / 1000}k` : p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Lub wpisz własną (500–10 000)
          </p>
          <div className="relative">
            <input
              type="number"
              min={500}
              max={10000}
              value={custom}
              onChange={e => { setCustom(e.target.value); setAmount(0) }}
              placeholder="np. 3500"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl
                         px-4 py-3 text-white placeholder-zinc-600 text-sm
                         focus:outline-none focus:border-amber-500/50
                         [appearance:textfield]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2
                             text-xs text-zinc-500 font-bold">VTC€</span>
          </div>
        </div>

        <div className="bg-zinc-800/60 rounded-xl p-4 space-y-2 text-sm">
          {[
            { label: 'Pożyczasz',    value: valid ? `${finalAmount.toLocaleString('pl-PL')} VTC€` : '—',                              color: 'text-white font-bold'       },
            { label: 'Odsetki (8%)', value: valid ? `+${Math.round(finalAmount * 0.08).toLocaleString('pl-PL')} VTC€` : '—',          color: 'text-red-400'               },
            { label: 'Do spłaty',    value: valid ? `${amountDue.toLocaleString('pl-PL')} VTC€` : '—',                                color: 'text-amber-400 font-black', divider: true },
            { label: 'Saldo po',     value: valid ? `${(balance + finalAmount).toLocaleString('pl-PL')} VTC€` : '—',                  color: 'text-green-400 font-bold'   },
          ].map(({ label, value, color, divider }) => (
            <div
              key={label}
              className={cn('flex justify-between', divider && 'border-t border-zinc-700 pt-2')}
            >
              <span className="text-zinc-500">{label}</span>
              <span className={color}>{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleTake}
          disabled={!valid || loading}
          className={cn(
            'w-full py-3.5 rounded-xl font-black text-sm transition-all',
            'flex items-center justify-center gap-2',
            valid && !loading
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
          )}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
          {loading ? 'Przetwarzanie...' : 'Potwierdź pożyczkę'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Modal lokaty ──────────────────────────────
function DepositModal({ balance, onClose, onSuccess }: {
  balance:   number
  onClose:   () => void
  onSuccess: (newBalance: number, newDeposit: Deposit) => void
}) {
  const [plan,    setPlan]    = useState(DEPOSIT_PLANS[1])
  const [amount,  setAmount]  = useState('')
  const [loading, setLoading] = useState(false)

  const num    = Number(amount)
  const valid  = num >= 100 && num <= 50000 && num <= balance && !isNaN(num) && num > 0
  const payout = valid ? Math.round(num * (1 + plan.rate / 100) * 100) / 100 : 0
  const profit = valid ? Math.round(num * plan.rate / 100 * 100) / 100 : 0

  async function handleOpen() {
    if (!valid) return
    setLoading(true)
    const res = await openDeposit(num, plan.days)
    setLoading(false)
    if (!res.ok) { toast.error(res.error); return }

    const newDeposit: Deposit = {
      id:            res.data.deposit_id ?? crypto.randomUUID(),
      amount:        num,
      payout,                        // ← obliczony lokalnie, nie z bazy
      interest_rate: plan.rate / 100,
      matures_at:    res.data.matures_at,
      status:        'active',
      created_at:    new Date().toISOString(),
    }

    toast.success(`Lokata ${num.toLocaleString('pl-PL')} VTC€ otwarta!`, {
      description: `Wypłata ${payout.toLocaleString('pl-PL')} VTC€ za ${plan.days} dni`,
    })
    onSuccess(res.data.balance, newDeposit)
    onClose()
  }

  return (
    <Modal title="Otwórz lokatę" onClose={onClose}>
      <div className="space-y-5">

        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Wybierz okres
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEPOSIT_PLANS.map(p => (
              <button
                key={p.days}
                onClick={() => setPlan(p)}
                className={cn(
                  'p-3 rounded-xl border transition-all text-center',
                  plan.days === p.days
                    ? `${p.bg} ${p.border} ${p.color}`
                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-500 hover:text-zinc-300',
                )}
              >
                <p className="text-lg font-black">{p.rate}%</p>
                <p className="text-xs mt-0.5">{p.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Kwota (100–50 000 VTC€)
          </p>
          <div className="relative">
            <input
              type="number"
              min={100}
              max={Math.min(50000, balance)}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Max: ${Math.min(50000, balance).toLocaleString('pl-PL')}`}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl
                         px-4 py-3 text-white placeholder-zinc-600 text-sm
                         focus:outline-none focus:border-amber-500/50
                         [appearance:textfield]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2
                             text-xs text-zinc-500 font-bold">VTC€</span>
          </div>
          {num > balance && num > 0 && (
            <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Niewystarczające saldo
            </p>
          )}
        </div>

        <AnimatePresence>
          {valid && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0   }}
              animate={{ opacity: 1, y: 0,  height: 'auto' }}
              exit={{   opacity: 0, y: -8,  height: 0   }}
              className="bg-zinc-800/60 rounded-xl p-4 space-y-2 text-sm overflow-hidden"
            >
              {[
                { label: 'Wpłacasz',                    value: `${num.toLocaleString('pl-PL')} VTC€`,    color: 'text-white font-bold'                },
                { label: `Zysk (${plan.rate}%)`,        value: `+${profit.toLocaleString('pl-PL')} VTC€`, color: `${plan.color} font-bold`            },
                { label: `Wypłata za ${plan.days} dni`, value: `${payout.toLocaleString('pl-PL')} VTC€`, color: 'text-green-400 font-black', divider: true },
                { label: 'Saldo po wpłacie',            value: `${(balance - num).toLocaleString('pl-PL')} VTC€`, color: 'text-zinc-300'         },
              ].map(({ label, value, color, divider }) => (
                <div
                  key={label}
                  className={cn('flex justify-between', divider && 'border-t border-zinc-700 pt-2')}
                >
                  <span className="text-zinc-500">{label}</span>
                  <span className={color}>{value}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleOpen}
          disabled={!valid || loading}
          className={cn(
            'w-full py-3.5 rounded-xl font-black text-sm transition-all',
            'flex items-center justify-center gap-2',
            valid && !loading
              ? 'bg-green-500 hover:bg-green-400 text-black'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
          )}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PiggyBank className="w-4 h-4" />}
          {loading ? 'Przetwarzanie...' : 'Potwierdź lokatę'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Wiersz lokaty — wyodrębniony, ma własny useNow ────
function DepositRow({
  d,
  loading,
  onWithdraw,
}: {
  d:          Deposit
  loading:    string | null
  onWithdraw: (id: string) => void
}) {
  // ← useNow() — Date.now() TYLKO po stronie klienta, po hydration
  const now     = useNow()
  const payout  = safePayout(d)
  const profit  = payout - (d.amount ?? 0)

  // Podczas SSR (now === null) nie renderujemy zależnych od czasu klas/tekstów
  const matured  = now !== null && now >= new Date(d.matures_at).getTime()
  const daysLeft = now !== null
    ? Math.max(0, Math.ceil((new Date(d.matures_at).getTime() - now) / 86_400_000))
    : null

  return (
    <div className="flex items-center gap-4 px-5 py-4
                    hover:bg-white/[0.02] transition-colors">
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        matured ? 'bg-green-400/10' : 'bg-teal-400/10',
      )}>
        <PiggyBank className={cn('w-4 h-4', matured ? 'text-green-400' : 'text-teal-400')} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-zinc-200">
            {(d.amount ?? 0).toLocaleString('pl-PL')} VTC€
          </p>
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
            matured ? 'bg-green-400/10 text-green-400' : 'bg-teal-400/10 text-teal-400',
          )}>
            +{((d.interest_rate ?? 0) * 100).toFixed(0)}%
          </span>
          {/* animate-pulse tylko po stronie klienta */}
          {matured && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full
                             bg-green-500/20 text-green-300 animate-pulse">
              Gotowa!
            </span>
          )}
        </div>
        {/* suppressHydrationWarning — tekst zależy od czasu */}
        <div className="flex items-center gap-1.5 mt-0.5" suppressHydrationWarning>
          <Clock className="w-3 h-3 text-zinc-700" />
          <p className="text-xs text-zinc-600" suppressHydrationWarning>
            {now === null
              ? '...'
              : matured
                ? 'Dojrzała — gotowa do wypłaty'
                : `${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'} do wypłaty`
            }
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-black text-green-400">
          {payout.toLocaleString('pl-PL')} VTC€
        </p>
        <p className="text-xs text-zinc-600">
          +{profit.toLocaleString('pl-PL')} zysku
        </p>
      </div>

      <button
        onClick={() => onWithdraw(d.id)}
        disabled={loading === d.id}
        className={cn(
          'px-3 py-2 rounded-lg text-xs font-bold shrink-0',
          'flex items-center gap-1.5 transition-all',
          matured
            ? 'bg-green-500 hover:bg-green-400 text-black'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700',
        )}
      >
        {loading === d.id
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : matured
            ? <CheckCircle className="w-3.5 h-3.5" />
            : <X className="w-3.5 h-3.5" />
        }
        {matured ? 'Wypłać' : 'Anuluj'}
      </button>
    </div>
  )
}

// ─── Główny komponent ──────────────────────────
export function BankClient({
  balance:          initBalance,
  loans:            initLoans,
  deposits:         initDeposits,
  onBalanceChange,
  onLoansChange,
  onDepositsChange,
}: Props) {
  const [balance,  setBalance]  = useState(initBalance)
  const [loans,    setLoans]    = useState(initLoans)
  const [deposits, setDeposits] = useState(initDeposits)
  const [modal,    setModal]    = useState<'loan' | 'deposit' | null>(null)
  const [loading,  setLoading]  = useState<string | null>(null)

  function applyBalance(b: number)    { setBalance(b);  onBalanceChange(b)  }
  function applyLoans(l: Loan[])      { setLoans(l);    onLoansChange(l)    }
  function applyDeposits(d: Deposit[]) { setDeposits(d); onDepositsChange(d) }

  const activeLoan     = loans.find(l => l.status === 'active' || l.status === 'overdue')
  const activeDeposits = deposits.filter(d => d.status !== 'withdrawn')

  async function handleRepay(loanId: string) {
    setLoading(loanId)
    const res = await repayLoan(loanId)
    setLoading(null)
    if (!res.ok) { toast.error(res.error); return }

    applyBalance(res.data.new_balance)
    applyLoans(loans.map(l =>
      l.id === loanId ? { ...l, status: 'repaid' as const } : l
    ))
    toast.success('Pożyczka spłacona!', {
      description: `Nowe saldo: ${res.data.new_balance.toLocaleString('pl-PL')} VTC€`,
    })
  }

  async function handleWithdraw(depositId: string) {
    setLoading(depositId)
    const res = await withdrawDeposit(depositId)
    setLoading(null)
    if (!res.ok) { toast.error(res.error); return }

    applyBalance(res.data.new_balance)
    applyDeposits(deposits.map(d =>
      d.id === depositId ? { ...d, status: 'withdrawn' as const } : d
    ))

    res.data.early
      ? toast.warning('Lokata wypłacona przed terminem', {
          description: 'Odsetki przepadły — otrzymałeś tylko kapitał',
        })
      : toast.success(`Wypłacono ${res.data.payout.toLocaleString('pl-PL')} VTC€!`, {
          description: 'Kapitał + odsetki trafiły na Twoje konto',
        })
  }

  function handleLoanSuccess(newBalance: number, newLoan: Loan) {
    applyBalance(newBalance)
    applyLoans([newLoan, ...loans])
  }

  function handleDepositSuccess(newBalance: number, newDeposit: Deposit) {
    applyBalance(newBalance)
    applyDeposits([newDeposit, ...deposits])
  }

  return (
    <>
      <div className="space-y-6">

        {/* Saldo */}
        <div className="flex items-center justify-between bg-zinc-900/60
                        border border-zinc-800 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center
                            justify-center">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider">
                Dostępne saldo
              </p>
              <p className="text-2xl font-black text-amber-400">
                {balance.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}
                <span className="text-sm font-semibold ml-1">VTC€</span>
              </p>
            </div>
          </div>
        </div>

        {/* Alert */}
        <AnimatePresence>
          {activeLoan?.status === 'overdue' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0  }}
              exit={{   opacity: 0, y: -8  }}
              className="flex gap-3 bg-red-500/10 border border-red-500/30
                         rounded-xl px-5 py-4"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-300">Pożyczka przeterminowana!</p>
                <p className="text-xs text-red-400/70 mt-0.5">
                  Spłać jak najszybciej — przeterminowanie wpływa na ranking
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Produkty bankowe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Pożyczka */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-black text-white">Pożyczka</h3>
                <p className="text-xs text-zinc-500">8% — 30 dni — max 10 000 VTC€</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-500">
              {[
                { label: 'Min. kwota',     value: '500 VTC€'    },
                { label: 'Max. kwota',     value: '10 000 VTC€' },
                { label: 'Oprocentowanie', value: '8%'          },
                { label: 'Okres spłaty',   value: '30 dni'      },
                { label: 'Limit',          value: '1 aktywna'   },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span>{label}</span>
                  <span className="text-zinc-300 font-medium">{value}</span>
                </div>
              ))}
            </div>

            {activeLoan ? (
              <div className={cn(
                'rounded-xl p-3 border text-xs space-y-3',
                activeLoan.status === 'overdue'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-zinc-800/60 border-zinc-700',
              )}>
                <div>
                  <p className="font-bold text-zinc-200 mb-2">Aktywna pożyczka</p>
                  <div className="space-y-1.5 text-zinc-500">
                    <div className="flex justify-between">
                      <span>Do spłaty</span>
                      <span className="text-red-400 font-bold">
                        {activeLoan.amount_due.toLocaleString('pl-PL')} VTC€
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Termin</span>
                      <span className={cn(
                        'font-medium',
                        activeLoan.status === 'overdue' ? 'text-red-400' : 'text-zinc-300',
                      )}>
                        {format(new Date(activeLoan.due_at), 'd MMM yyyy', { locale: pl })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saldo po spłacie</span>
                      <span className={cn(
                        'font-medium',
                        balance >= activeLoan.amount_due ? 'text-zinc-300' : 'text-red-400',
                      )}>
                        {(balance - activeLoan.amount_due).toLocaleString('pl-PL')} VTC€
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRepay(activeLoan.id)}
                  disabled={loading === activeLoan.id || balance < activeLoan.amount_due}
                  className={cn(
                    'w-full py-2.5 rounded-lg text-xs font-bold',
                    'flex items-center justify-center gap-2 transition-all',
                    balance >= activeLoan.amount_due
                      ? 'bg-green-500 hover:bg-green-400 text-black'
                      : 'bg-zinc-700 text-zinc-500 cursor-not-allowed',
                  )}
                >
                  {loading === activeLoan.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckCircle className="w-3.5 h-3.5" />
                  }
                  Spłać {activeLoan.amount_due.toLocaleString('pl-PL')} VTC€
                </button>
              </div>
            ) : (
              <button
                onClick={() => setModal('loan')}
                className="w-full py-3 bg-purple-500/10 hover:bg-purple-500/20
                           border border-purple-500/20 rounded-xl text-sm
                           font-bold text-purple-400 transition-all
                           flex items-center justify-center gap-2"
              >
                <Landmark className="w-4 h-4" />
                Weź pożyczkę
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            )}
          </div>

          {/* Lokata */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-400/10 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="font-black text-white">Lokata</h3>
                <p className="text-xs text-zinc-500">3–8% — 7 / 14 / 30 dni</p>
              </div>
            </div>

            <div className="space-y-2">
              {DEPOSIT_PLANS.map(p => (
                <div
                  key={p.days}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 border',
                    p.bg, p.border,
                  )}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className={cn('w-3.5 h-3.5', p.color)} />
                    <span className="text-xs text-zinc-300">{p.label}</span>
                  </div>
                  <span className={cn('text-sm font-black', p.color)}>+{p.rate}%</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setModal('deposit')}
              disabled={balance < 100}
              className={cn(
                'w-full py-3 rounded-xl text-sm font-bold transition-all',
                'flex items-center justify-center gap-2',
                balance >= 100
                  ? 'bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-600 cursor-not-allowed',
              )}
            >
              <PiggyBank className="w-4 h-4" />
              Otwórz lokatę
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          </div>
        </div>

        {/* Aktywne lokaty */}
        {activeDeposits.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-800">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Aktywne lokaty ({activeDeposits.length})
              </h3>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {activeDeposits.map(d => (
                <DepositRow
                  key={d.id}
                  d={d}
                  loading={loading}
                  onWithdraw={handleWithdraw}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modale */}
      <AnimatePresence>
        {modal === 'loan' && (
          <LoanModal
            balance={balance}
            onClose={() => setModal(null)}
            onSuccess={handleLoanSuccess}
          />
        )}
        {modal === 'deposit' && (
          <DepositModal
            balance={balance}
            onClose={() => setModal(null)}
            onSuccess={handleDepositSuccess}
          />
        )}
      </AnimatePresence>
    </>
  )
}
