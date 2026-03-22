'use client'

import { useState }               from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format }                  from 'date-fns'
import { pl }                      from 'date-fns/locale'
import {
  Wallet, ArrowUpRight, ArrowDownLeft,
  Package, Gift, AlertCircle, Fuel,
  Landmark, PiggyBank, Clock, ChevronRight,
  Banknote, ShieldCheck,
} from 'lucide-react'
import { cn }          from '@/lib/utils/cn'
import { BankClient }  from './bank/BankClient'
import type { Loan, Deposit } from './bank/BankClient'

// ─── Typy ──────────────────────────────────────
interface WalletRow {
  balance:      number
  total_earned: number
  total_spent:  number
  updated_at:   string
}

interface Transaction {
  id:            string
  type:          string
  amount:        number
  balance_after: number | null
  description:   string | null
  metadata:      Record<string, any> | null
  created_at:    string
  job_id:        string | null
}

interface FuelPrice {
  price:       number
  valid_until: string
}

interface Props {
  wallet:       WalletRow | null
  transactions: Transaction[]
  fuelPrice:    FuelPrice | null
  loans:        Loan[]
  deposits:     Deposit[]
}

type Tab = 'overview' | 'history' | 'bank'

// ─── Helpers ───────────────────────────────────
function txIcon(type: string) {
  switch (type) {
    case 'job_pay':       return { icon: Package,       color: 'text-green-400',  bg: 'bg-green-400/10'  }
    case 'weekly_bonus':  return { icon: Gift,          color: 'text-amber-400',  bg: 'bg-amber-400/10'  }
    case 'shop_purchase': return { icon: ShieldCheck,   color: 'text-blue-400',   bg: 'bg-blue-400/10'   }
    case 'fine':          return { icon: AlertCircle,   color: 'text-red-400',    bg: 'bg-red-400/10'    }
    case 'loan_out':      return { icon: Landmark,      color: 'text-purple-400', bg: 'bg-purple-400/10' }
    case 'loan_repay':    return { icon: Landmark,      color: 'text-green-400',  bg: 'bg-green-400/10'  }
    case 'deposit_in':    return { icon: PiggyBank,     color: 'text-teal-400',   bg: 'bg-teal-400/10'   }
    case 'deposit_out':   return { icon: PiggyBank,     color: 'text-green-400',  bg: 'bg-green-400/10'  }
    case 'manual_credit': return { icon: ArrowUpRight,  color: 'text-green-400',  bg: 'bg-green-400/10'  }
    case 'manual_debit':  return { icon: ArrowDownLeft, color: 'text-red-400',    bg: 'bg-red-400/10'    }
    default:              return { icon: Wallet,        color: 'text-zinc-400',   bg: 'bg-zinc-400/10'   }
  }
}

function txLabel(type: string) {
  const map: Record<string, string> = {
    job_pay:       'Wypłata za job',
    company_tax:   'Podatek firmowy',
    weekly_bonus:  'Bonus tygodniowy',
    shop_purchase: 'Zakup w sklepie',
    fine:          'Mandat',
    loan_out:      'Pożyczka',
    loan_repay:    'Spłata pożyczki',
    deposit_in:    'Lokata',
    deposit_out:   'Wypłata lokaty',
    manual_credit: 'Uznanie manualne',
    manual_debit:  'Obciążenie manualne',
  }
  return map[type] ?? type
}

// ─── Breakdown tooltip ─────────────────────────
function BreakdownTooltip({
  items,
}: {
  items: { label: string; amount: number }[]
}) {
  return (
    <div className="absolute bottom-full right-0 mb-2 w-64 bg-zinc-900
                    border border-zinc-700 rounded-xl p-3 shadow-2xl z-50
                    text-xs space-y-1.5 pointer-events-none">
      {items.map((item, i) => (
        <div key={i} className="flex justify-between gap-4">
          <span className="text-zinc-400">{item.label}</span>
          <span className={cn(
            'font-bold shrink-0',
            item.amount >= 0 ? 'text-green-400' : 'text-red-400',
          )}>
            {item.amount >= 0 ? '+' : ''}{item.amount} VTC€
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Wiersz transakcji (wyodrębniony) ──────────
function TxRow({
  tx,
  showBalance = false,
}: {
  tx:          Transaction
  showBalance?: boolean
}) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { icon: Icon, color, bg }         = txIcon(tx.type)
  const breakdown = tx.metadata?.breakdown as
    { label: string; amount: number }[] | undefined

  return (
    <div className="flex items-center gap-3 px-5 py-3.5
                    hover:bg-white/[0.02] transition-colors">
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        bg,
      )}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-200">
          {txLabel(tx.type)}
        </p>
        {tx.description && (
          <p className="text-xs text-zinc-600 truncate mt-0.5">
            {tx.description}
          </p>
        )}
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-center gap-1.5 justify-end">
          <p className={cn(
            'text-sm font-black',
            tx.amount >= 0 ? 'text-green-400' : 'text-red-400',
          )}>
            {tx.amount >= 0 ? '+' : ''}
            {tx.amount.toLocaleString('pl-PL')} VTC€
          </p>

          {/* Breakdown button */}
          {breakdown && breakdown.length > 0 && (
            <div className="relative">
              <button
                onMouseEnter={() => setShowBreakdown(true)}
                onMouseLeave={() => setShowBreakdown(false)}
                className="text-zinc-700 hover:text-zinc-400 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showBreakdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{  opacity: 0, y: 4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <BreakdownTooltip items={breakdown} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {showBalance && tx.balance_after != null && (
          <p className="text-[10px] text-zinc-700 mt-0.5">
            Saldo: {tx.balance_after.toLocaleString('pl-PL')} VTC€
          </p>
        )}
        <p className="text-[10px] text-zinc-700 mt-0.5">
          {format(
            new Date(tx.created_at),
            showBalance ? 'd MMM yyyy, HH:mm' : 'd MMM, HH:mm',
            { locale: pl },
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Główny komponent ──────────────────────────
export function WalletClient({
  wallet, transactions, fuelPrice, loans, deposits,
}: Props) {
  const [tab,     setTab]     = useState<Tab>('overview')
  const [balance, setBalance] = useState(wallet?.balance      ?? 0)
  const [myLoans, setLoans]   = useState<Loan[]>(loans)
  const [myDeps,  setDeps]    = useState<Deposit[]>(deposits)

  const totalEarned = wallet?.total_earned ?? 0
  const totalSpent  = wallet?.total_spent  ?? 0

  const activeLoan = myLoans.find(
    l => l.status === 'active' || l.status === 'overdue'
  )

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Portfel',  icon: Wallet   },
    { id: 'history',  label: 'Historia', icon: Clock    },
    { id: 'bank',     label: 'Bank',     icon: Landmark },
  ]

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">

      {/* ── Hero saldo ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0  }}
        className="relative bg-gradient-to-br from-amber-500/20 via-zinc-900
                   to-zinc-900 border border-amber-500/20 rounded-2xl p-6
                   overflow-hidden"
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-amber-500/10
                        rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              Saldo firmowe
            </span>
          </div>

          <p className="text-5xl font-black text-white mt-2 mb-1">
            {balance.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}
            <span className="text-xl text-amber-400 ml-2">VTC€</span>
          </p>

          <div className="flex flex-wrap items-center gap-6 mt-4 pt-4
                          border-t border-zinc-800">
            <div>
              <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
                Łącznie zarobione
              </p>
              <p className="text-sm font-bold text-green-400 mt-0.5">
                +{totalEarned.toLocaleString('pl-PL')} VTC€
              </p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
                Łącznie wydane
              </p>
              <p className="text-sm font-bold text-red-400 mt-0.5">
                -{totalSpent.toLocaleString('pl-PL')} VTC€
              </p>
            </div>
            {fuelPrice && (
              <div className="ml-auto">
                <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
                  Cena paliwa
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Fuel className="w-3 h-3 text-blue-400" />
                  <p className="text-sm font-bold text-blue-400">
                    {fuelPrice.price} VTC€/L
                  </p>
                </div>
                <p className="text-[10px] text-zinc-700 mt-0.5">
                  do {format(new Date(fuelPrice.valid_until), 'd MMM', { locale: pl })}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Alert pożyczka ───────────────────── */}
      <AnimatePresence>
        {activeLoan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{   opacity: 0, height: 0      }}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 border',
              activeLoan.status === 'overdue'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-amber-500/10 border-amber-500/20',
            )}
          >
            <AlertCircle className={cn(
              'w-4 h-4 shrink-0',
              activeLoan.status === 'overdue' ? 'text-red-400' : 'text-amber-400',
            )} />
            <p className={cn(
              'text-sm',
              activeLoan.status === 'overdue' ? 'text-red-300' : 'text-amber-200',
            )}>
              {activeLoan.status === 'overdue'
                ? '⚠️ Pożyczka przeterminowana! '
                : 'Masz aktywną pożyczkę — spłata do '}
              <span className="font-bold">
                {format(new Date(activeLoan.due_at), 'd MMM yyyy', { locale: pl })}
              </span>
              {' '}— do spłaty{' '}
              <span className="font-bold text-red-400">
                {activeLoan.amount_due.toLocaleString('pl-PL')} VTC€
              </span>
            </p>
            <button
              onClick={() => setTab('bank')}
              className="ml-auto text-xs font-bold text-amber-400
                         hover:text-amber-300 whitespace-nowrap"
            >
              Spłać →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ─────────────────────────────── */}
      <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800
                      rounded-xl p-1">
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

      {/* ── TAB: Przegląd ────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4 pb-8">

          {/* Mini statsy */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Transakcji',
                value: transactions.length,
                color: 'text-zinc-200',
              },
              {
                label: 'Joby',
                value: transactions.filter(t => t.type === 'job_pay').length,
                color: 'text-green-400',
              },
              {
                label: 'Zakupy',
                value: transactions.filter(t => t.type === 'shop_purchase').length,
                color: 'text-blue-400',
              },
            ].map(({ label, value, color }) => (
              <div key={label}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl
                           p-3 text-center">
                <p className={cn('text-xl font-black', color)}>{value}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Ostatnie transakcje */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl
                          overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5
                            border-b border-zinc-800">
              <span className="text-xs text-zinc-500 uppercase tracking-wider
                               font-medium">
                Ostatnie transakcje
              </span>
              <button
                onClick={() => setTab('history')}
                className="text-xs text-amber-400 hover:text-amber-300
                           transition-colors"
              >
                Zobacz wszystkie →
              </button>
            </div>

            <div className="divide-y divide-zinc-800/40">
              {transactions.slice(0, 8).map(tx => (
                <TxRow key={tx.id} tx={tx} />
              ))}
              {transactions.length === 0 && (
                <div className="py-12 text-center text-zinc-600">
                  <Banknote className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Brak transakcji</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Historia ─────────────────────── */}
      {tab === 'history' && (
        <div className="pb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl
                          overflow-hidden">
            {transactions.length > 0 ? (
              <div className="divide-y divide-zinc-800/40">
                {transactions.map(tx => (
                  <TxRow key={tx.id} tx={tx} showBalance />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-600">
                <Banknote className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Brak historii transakcji</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Bank ─────────────────────────── */}
      {tab === 'bank' && (
        <div className="pb-8">
          <BankClient
            balance={balance}
            loans={myLoans}
            deposits={myDeps}
            onBalanceChange={setBalance}
            onLoansChange={setLoans}
            onDepositsChange={setDeps}
          />
        </div>
      )}
    </div>
  )
}
