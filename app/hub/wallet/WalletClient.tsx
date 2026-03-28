'use client'

import { useState, useMemo }        from 'react'
import { motion, AnimatePresence }   from 'framer-motion'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { pl }                        from 'date-fns/locale'
import {
  Wallet, ArrowUpRight, ArrowDownLeft,
  Package, Gift, AlertCircle, Fuel,
  Landmark, PiggyBank, Clock, ChevronRight,
  Banknote, ShieldCheck, TrendingUp,
  BarChart2, Filter, Download, X,
  ChevronDown,
} from 'lucide-react'
import { cn }         from '@/lib/utils/cn'
import { BankClient } from './bank/BankClient'
import type { Loan, Deposit } from './bank/BankClient'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'

// ─── Typy ──────────────────────────────────────────────────
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

type Tab        = 'overview' | 'history' | 'bank'
type FilterType = 'all' | 'job_pay' | 'shop_purchase' | 'weekly_bonus' |
                  'loan_out' | 'loan_repay' | 'deposit_in' | 'deposit_out' |
                  'fine' | 'manual_credit' | 'manual_debit'
type ChartMode  = 'area' | 'bar'

// ─── Stałe ─────────────────────────────────────────────────
const TX_META: Record<string, {
  label: string
  icon:  React.ElementType
  color: string
  bg:    string
}> = {
  job_pay:        { label: 'Wypłata za job',       icon: Package,       color: 'text-green-400',  bg: 'bg-green-400/10'  },
  weekly_bonus:   { label: 'Bonus tygodniowy',     icon: Gift,          color: 'text-amber-400',  bg: 'bg-amber-400/10'  },
  shop_purchase:  { label: 'Zakup w sklepie',      icon: ShieldCheck,   color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  fine:           { label: 'Mandat',               icon: AlertCircle,   color: 'text-red-400',    bg: 'bg-red-400/10'    },
  loan_out:       { label: 'Pożyczka',             icon: Landmark,      color: 'text-purple-400', bg: 'bg-purple-400/10' },
  loan_repay:     { label: 'Spłata pożyczki',      icon: Landmark,      color: 'text-green-400',  bg: 'bg-green-400/10'  },
  deposit_in:     { label: 'Lokata',               icon: PiggyBank,     color: 'text-teal-400',   bg: 'bg-teal-400/10'   },
  deposit_out:    { label: 'Wypłata lokaty',       icon: PiggyBank,     color: 'text-green-400',  bg: 'bg-green-400/10'  },
  manual_credit:  { label: 'Uznanie manualne',     icon: ArrowUpRight,  color: 'text-green-400',  bg: 'bg-green-400/10'  },
  manual_debit:   { label: 'Obciążenie manualne',  icon: ArrowDownLeft, color: 'text-red-400',    bg: 'bg-red-400/10'    },
  company_tax:    { label: 'Podatek firmowy',      icon: ArrowDownLeft, color: 'text-red-400',    bg: 'bg-red-400/10'    },
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all',           label: 'Wszystkie'         },
  { value: 'job_pay',       label: 'Wypłaty za joby'   },
  { value: 'weekly_bonus',  label: 'Bonusy'            },
  { value: 'shop_purchase', label: 'Zakupy w sklepie'  },
  { value: 'loan_out',      label: 'Pożyczki'          },
  { value: 'loan_repay',    label: 'Spłaty pożyczek'   },
  { value: 'deposit_in',    label: 'Lokaty'            },
  { value: 'deposit_out',   label: 'Wypłaty lokat'     },
  { value: 'fine',          label: 'Mandaty'           },
  { value: 'manual_credit', label: 'Uznania manualne'  },
  { value: 'manual_debit',  label: 'Obciążenia manualne'},
]

function txMeta(type: string) {
  return TX_META[type] ?? {
    label: type,
    icon:  Wallet,
    color: 'text-zinc-400',
    bg:    'bg-zinc-400/10',
  }
}

function dayLabel(date: Date): string {
  if (isToday(date))     return 'Dzisiaj'
  if (isYesterday(date)) return 'Wczoraj'
  return format(date, 'd MMMM yyyy', { locale: pl })
}

// ─── Export CSV ────────────────────────────────────────────
function exportCsv(transactions: Transaction[]) {
  const header = 'Data,Typ,Opis,Kwota,Saldo po\n'
  const rows   = transactions.map(tx => [
    format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm', { locale: pl }),
    txMeta(tx.type).label,
    (tx.description ?? '').replace(/,/g, ';'),
    tx.amount,
    tx.balance_after ?? '',
  ].join(',')).join('\n')

  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `transakcje-vtc-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Wykres ────────────────────────────────────────────────
function WalletChart({
  transactions,
}: {
  transactions: Transaction[]
}) {
  const [mode, setMode] = useState<ChartMode>('area')

  // Grupuj ostatnie 14 dni
  const data = useMemo(() => {
    const days: Record<string, { earned: number; spent: number; date: Date }> = {}

    for (let i = 13; i >= 0; i--) {
      const d   = new Date()
      d.setDate(d.getDate() - i)
      const key = format(d, 'dd.MM')
      days[key] = { earned: 0, spent: 0, date: d }
    }

    transactions.forEach(tx => {
      const key = format(new Date(tx.created_at), 'dd.MM')
      if (!days[key]) return
      if (tx.amount > 0) days[key].earned += tx.amount
      else               days[key].spent  += Math.abs(tx.amount)
    })

    return Object.entries(days).map(([label, v]) => ({
      label,
      Zarobki: Math.round(v.earned),
      Wydatki: Math.round(v.spent),
    }))
  }, [transactions])

  const hasData = data.some(d => d.Zarobki > 0 || d.Wydatki > 0)

  if (!hasData) return null

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-zinc-500" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Ostatnie 14 dni
          </span>
        </div>
        <div className="flex gap-1">
          {(['area', 'bar'] as ChartMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
                mode === m
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-600 hover:text-zinc-400',
              )}
            >
              {m === 'area' ? 'Obszar' : 'Słupki'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 py-4 h-52">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'area' ? (
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f87171" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#52525b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#52525b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#a1a1aa', marginBottom: 4 }}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString('pl-PL')} VTC€`, name
                ]}
              />
              <Area
                type="monotone" dataKey="Zarobki"
                stroke="#34d399" strokeWidth={2}
                fill="url(#colorEarned)"
              />
              <Area
                type="monotone" dataKey="Wydatki"
                stroke="#f87171" strokeWidth={2}
                fill="url(#colorSpent)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#52525b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#52525b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString('pl-PL')} VTC€`, name
                ]}
              />
              <Bar dataKey="Zarobki" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Wydatki" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 px-5 pb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-xs text-zinc-500">Zarobki</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-xs text-zinc-500">Wydatki</span>
        </div>
      </div>
    </div>
  )
}

// ─── Breakdown tooltip ─────────────────────────────────────
function BreakdownTooltip({ items }: { items: { label: string; amount: number }[] }) {
  return (
    <div className="absolute bottom-full right-0 mb-2 w-64 bg-zinc-900
                    border border-zinc-700 rounded-xl p-3 shadow-2xl z-50
                    text-xs space-y-1.5 pointer-events-none">
      {items.map((item, i) => (
        <div key={i} className="flex justify-between gap-4">
          <span className="text-zinc-400">{item.label}</span>
          <span className={cn('font-bold shrink-0', item.amount >= 0 ? 'text-green-400' : 'text-red-400')}>
            {item.amount >= 0 ? '+' : ''}{item.amount.toLocaleString('pl-PL')} VTC€
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Wiersz transakcji ─────────────────────────────────────
function TxRow({ tx, showBalance = false }: { tx: Transaction; showBalance?: boolean }) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { icon: Icon, color, bg }         = txMeta(tx.type)
  const breakdown = tx.metadata?.breakdown as { label: string; amount: number }[] | undefined

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-200">{txMeta(tx.type).label}</p>
        {tx.description && (
          <p className="text-xs text-zinc-600 truncate mt-0.5">{tx.description}</p>
        )}
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-center gap-1.5 justify-end">
          <p className={cn('text-sm font-black', tx.amount >= 0 ? 'text-green-400' : 'text-red-400')}>
            {tx.amount >= 0 ? '+' : ''}
            {tx.amount.toLocaleString('pl-PL')} VTC€
          </p>
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
                    exit={{ opacity: 0, y: 4 }}
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
          {format(new Date(tx.created_at), showBalance ? 'd MMM yyyy, HH:mm' : 'HH:mm', { locale: pl })}
        </p>
      </div>
    </div>
  )
}

// ─── Historia z grupowaniem po dniach ─────────────────────
function GroupedHistory({ transactions }: { transactions: Transaction[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    transactions.forEach(tx => {
      const key = format(new Date(tx.created_at), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(tx)
    })
    return Array.from(map.entries()).map(([key, txs]) => ({
      key,
      date:  new Date(key),
      txs,
      total: txs.reduce((s, t) => s + t.amount, 0),
    }))
  }, [transactions])

  if (groups.length === 0) return (
    <div className="py-16 text-center text-zinc-600">
      <Banknote className="w-10 h-10 mx-auto mb-3 opacity-20" />
      <p className="text-sm">Brak historii transakcji</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {groups.map(({ key, date, txs, total }) => (
        <div key={key} className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Nagłówek dnia */}
          <div className="flex items-center justify-between px-4 py-2.5
                          bg-zinc-800/40 border-b border-zinc-800">
            <span className="text-xs font-bold text-zinc-400">
              {dayLabel(date)}
            </span>
            <span className={cn(
              'text-xs font-black',
              total >= 0 ? 'text-green-400' : 'text-red-400',
            )}>
              {total >= 0 ? '+' : ''}{total.toLocaleString('pl-PL')} VTC€
            </span>
          </div>

          <div className="divide-y divide-zinc-800/40">
            {txs.map(tx => <TxRow key={tx.id} tx={tx} showBalance />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Wskaźnik oszczędności ─────────────────────────────────
function SavingsIndicator({ balance, totalEarned }: { balance: number; totalEarned: number }) {
  if (totalEarned <= 0) return null
  const pct = Math.min(100, Math.round((balance / totalEarned) * 100))
  const color = pct >= 50 ? 'bg-green-500'
              : pct >= 25 ? 'bg-amber-500'
              : 'bg-red-500'

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Wskaźnik oszczędności
          </span>
        </div>
        <span className={cn('text-sm font-black', pct >= 50 ? 'text-green-400' : pct >= 25 ? 'text-amber-400' : 'text-red-400')}>
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
      <p className="text-[11px] text-zinc-600 mt-2">
        {pct >= 50
          ? '✅ Świetna gospodarka finansami!'
          : pct >= 25
            ? '⚡ Masz jeszcze pole do oszczędzania'
            : '⚠️ Większość zarobków już wydana'}
      </p>
    </div>
  )
}

// ─── Główny komponent ──────────────────────────────────────
export function WalletClient({ wallet, transactions, fuelPrice, loans, deposits }: Props) {
  const [tab,        setTab]        = useState<Tab>('overview')
  const [balance,    setBalance]    = useState(wallet?.balance      ?? 0)
  const [myLoans,    setLoans]      = useState<Loan[]>(loans)
  const [myDeps,     setDeps]       = useState<Deposit[]>(deposits)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const totalEarned = wallet?.total_earned ?? 0
  const totalSpent  = wallet?.total_spent  ?? 0

  const activeLoan = myLoans.find(l => l.status === 'active' || l.status === 'overdue')

  // Transakcje przefiltrowane
  const filteredTx = useMemo(() =>
    filterType === 'all'
      ? transactions
      : transactions.filter(t => t.type === filterType),
  [transactions, filterType])

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Portfel',  icon: Wallet   },
    { id: 'history',  label: 'Historia', icon: Clock    },
    { id: 'bank',     label: 'Bank',     icon: Landmark },
  ]

  const filterLabel = FILTER_OPTIONS.find(o => o.value === filterType)?.label ?? 'Filtruj'

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-5">

      {/* ── Hero saldo ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        className="relative bg-gradient-to-br from-amber-500/15 via-zinc-900
                   to-zinc-900 border border-amber-500/20 rounded-2xl p-6 overflow-hidden"
      >
        {/* Glow blob */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/10
                        rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Saldo firmowe
            </span>
          </div>

          <motion.p
            key={balance}
            initial={{ scale: 1.02 }}
            animate={{ scale: 1 }}
            className="text-5xl font-black text-white mt-1 mb-1 tabular-nums"
          >
            {balance.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}
            <span className="text-xl text-amber-400 ml-2 font-bold">VTC€</span>
          </motion.p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-4
                          border-t border-zinc-800/60">
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Zarobione</p>
              <p className="text-sm font-bold text-green-400 mt-0.5">
                +{totalEarned.toLocaleString('pl-PL')} VTC€
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Wydane</p>
              <p className="text-sm font-bold text-red-400 mt-0.5">
                -{totalSpent.toLocaleString('pl-PL')} VTC€
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Transakcji</p>
              <p className="text-sm font-bold text-zinc-300 mt-0.5">
                {transactions.length}
              </p>
            </div>
            {fuelPrice && (
              <div className="ml-auto text-right">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Cena paliwa</p>
                <div className="flex items-center gap-1 mt-0.5 justify-end">
                  <Fuel className="w-3 h-3 text-blue-400" />
                  <p className="text-sm font-bold text-blue-400">{fuelPrice.price} VTC€/L</p>
                </div>
                <p className="text-[10px] text-zinc-700 mt-0.5">
                  do {format(new Date(fuelPrice.valid_until), 'd MMM', { locale: pl })}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Alert pożyczka ─────────────────────────────────── */}
      <AnimatePresence>
        {activeLoan && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{   opacity: 0, height: 0, marginTop: 0 }}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 border overflow-hidden',
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
              'text-sm flex-1',
              activeLoan.status === 'overdue' ? 'text-red-300' : 'text-amber-200',
            )}>
              {activeLoan.status === 'overdue' ? '⚠️ Pożyczka przeterminowana! Termin: ' : 'Aktywna pożyczka — spłata do '}
              <span className="font-bold">
                {format(new Date(activeLoan.due_at), 'd MMM yyyy', { locale: pl })}
              </span>
              {' — '}
              <span className="font-black text-red-400">
                {activeLoan.amount_due.toLocaleString('pl-PL')} VTC€
              </span>
            </p>
            <button
              onClick={() => setTab('bank')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300
                         whitespace-nowrap shrink-0"
            >
              Spłać →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
              'transition-all flex-1 justify-center relative',
              tab === id
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            {/* Dot dla banku gdy jest aktywna pożyczka */}
            {id === 'bank' && activeLoan && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full
                               bg-red-500 border-2 border-zinc-900" />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Przegląd ──────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4 pb-8">

          {/* Mini statsy */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Joby opłacone',  value: transactions.filter(t => t.type === 'job_pay').length,      color: 'text-green-400'  },
              { label: 'Bonusy',         value: transactions.filter(t => t.type === 'weekly_bonus').length, color: 'text-amber-400'  },
              { label: 'Zakupy',         value: transactions.filter(t => t.type === 'shop_purchase').length, color: 'text-blue-400'  },
              { label: 'Wszystkie tx',   value: transactions.length,                                        color: 'text-zinc-300'   },
            ].map(({ label, value, color }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center"
              >
                <p className={cn('text-2xl font-black', color)}>{value}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Wskaźnik oszczędności */}
          <SavingsIndicator balance={balance} totalEarned={totalEarned} />

          {/* Wykres */}
          <WalletChart transactions={transactions} />

          {/* Ostatnie transakcje */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Ostatnie transakcje
              </span>
              <button
                onClick={() => setTab('history')}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Historia →
              </button>
            </div>
            <div className="divide-y divide-zinc-800/40">
              {transactions.slice(0, 6).map(tx => <TxRow key={tx.id} tx={tx} />)}
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

      {/* ── TAB: Historia ──────────────────────────────────── */}
      {tab === 'history' && (
        <div className="space-y-4 pb-8">

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Filtr typ */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(v => !v)}
                className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800
                           hover:border-zinc-700 rounded-xl px-3 py-2 text-sm
                           text-zinc-400 transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                {filterLabel}
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', filterOpen && 'rotate-180')} />
                {filterType !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
                )}
              </button>

              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={{    opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 top-full mt-1 w-52 bg-zinc-900 border
                               border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden"
                  >
                    {FILTER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setFilterType(opt.value); setFilterOpen(false) }}
                        className={cn(
                          'w-full text-left px-4 py-2.5 text-sm transition-colors',
                          filterType === opt.value
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                        )}
                      >
                        {filterType === opt.value && <span className="mr-2 text-amber-400">✓</span>}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reset filtra */}
            {filterType !== 'all' && (
              <button
                onClick={() => setFilterType('all')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs
                           text-zinc-500 hover:text-zinc-300 bg-zinc-800/60
                           border border-zinc-700 transition-colors"
              >
                <X className="w-3 h-3" />
                Wyczyść
              </button>
            )}

            {/* Licznik */}
            <span className="text-xs text-zinc-600 ml-1">
              {filteredTx.length} transakcji
            </span>

            {/* Export CSV */}
            <button
              onClick={() => exportCsv(filteredTx)}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs
                         text-zinc-400 hover:text-white bg-zinc-800/60 border border-zinc-700
                         hover:border-zinc-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Eksport CSV
            </button>
          </div>

          {/* Grupowane transakcje */}
          <GroupedHistory transactions={filteredTx} />
        </div>
      )}

      {/* ── TAB: Bank ──────────────────────────────────────── */}
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