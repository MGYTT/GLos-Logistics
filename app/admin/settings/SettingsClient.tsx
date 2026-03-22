'use client'

import { useState, useTransition } from 'react'
import { toast }                   from 'sonner'
import {
  saveVtcInfo, saveRecruitment,
  saveFinance, saveSystem,
} from './actions'
import {
  Building2, Users, Wallet,
  Settings, Save, Loader2,
  Globe, MessageSquare, ExternalLink,
  AlertTriangle, CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Typy ──────────────────────────────────────
interface Settings {
  vtc_name:             string
  vtc_tag:              string
  vtc_description:      string
  vtc_founded:          string | null
  vtc_website:          string | null
  vtc_discord:          string | null
  vtc_truckersmp:       string | null
  recruitment_open:     boolean
  recruitment_min_hours: number
  recruitment_message:  string
  starting_balance:     number
  max_loan:             number
  loan_interest_rate:   number
  maintenance_mode:     boolean
  maintenance_message:  string
}

// ─── Zakładki ──────────────────────────────────
const TABS = [
  { id: 'vtc',         icon: Building2,    label: 'Informacje o VTC'  },
  { id: 'recruitment', icon: Users,        label: 'Rekrutacja'        },
  { id: 'finance',     icon: Wallet,       label: 'Finanse'           },
  { id: 'system',      icon: Settings,     label: 'System'            },
] as const

type TabId = typeof TABS[number]['id']

// ─── Helper: pole formularza ───────────────────
function Field({
  label, hint, children,
}: {
  label:    string
  hint?:    string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  )
}

const inputCls = `
  w-full bg-zinc-900 border border-zinc-700 rounded-xl
  px-4 py-2.5 text-white placeholder-zinc-600 text-sm
  focus:outline-none focus:border-amber-500/50 transition-colors
`

// ─── Toggle ────────────────────────────────────
function Toggle({
  name, checked, onChange, labelOn, labelOff,
}: {
  name:     string
  checked:  boolean
  onChange: (v: boolean) => void
  labelOn:  string
  labelOff: string
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl
                    bg-zinc-900 border border-zinc-700">
      <div className="flex items-center gap-3">
        {checked
          ? <CheckCircle className="w-4 h-4 text-green-400" />
          : <AlertTriangle className="w-4 h-4 text-zinc-600" />
        }
        <span className={cn('text-sm font-medium',
          checked ? 'text-green-400' : 'text-zinc-500')}>
          {checked ? labelOn : labelOff}
        </span>
      </div>
      <input type="hidden" name={name} value={String(checked)} />
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-green-500' : 'bg-zinc-700',
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white',
          'transition-transform duration-200',
          checked && 'translate-x-5',
        )} />
      </button>
    </div>
  )
}

// ─── Przycisk zapisu ───────────────────────────
function SaveBtn({ pending }: { pending: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="submit"
        disabled={pending}
        className={cn(
          'flex items-center gap-2 px-6 py-2.5 rounded-xl',
          'font-bold text-sm transition-all',
          pending
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            : 'bg-amber-500 hover:bg-amber-400 text-black',
        )}
      >
        {pending
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Save className="w-4 h-4" />
        }
        {pending ? 'Zapisuję...' : 'Zapisz zmiany'}
      </button>
    </div>
  )
}

// ─── Główny komponent ──────────────────────────
export function SettingsClient({ settings }: { settings: Settings | null }) {
  const [tab, setTab] = useState<TabId>('vtc')

  // Lokalne stany dla toggle'ów
  const [recruitmentOpen,  setRecruitmentOpen]  = useState(settings?.recruitment_open  ?? true)
  const [maintenanceMode,  setMaintenanceMode]  = useState(settings?.maintenance_mode  ?? false)

  const [pending, startTransition] = useTransition()

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
    action: (fd: FormData) => Promise<void>,
  ) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await action(fd)
        toast.success('Ustawienia zapisane!')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Błąd zapisu')
      }
    })
  }

  if (!settings) return (
    <div className="text-center py-20 text-zinc-600">
      <Settings className="w-10 h-10 mx-auto mb-3 opacity-20" />
      <p>Brak ustawień w bazie danych</p>
      <p className="text-sm mt-1">Uruchom SQL z dokumentacji aby utworzyć tabelę</p>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Zakładki ──────────────────────── */}
      <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800
                      rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
              'font-medium whitespace-nowrap transition-all flex-1',
              'justify-center',
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

      {/* ── Informacje o VTC ──────────────── */}
      {tab === 'vtc' && (
        <form
          onSubmit={e => handleSubmit(e, saveVtcInfo)}
          className="space-y-5 bg-zinc-900/40 border border-zinc-800
                     rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <h2 className="font-black text-sm uppercase tracking-wider text-zinc-300">
              Informacje o VTC
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nazwa VTC" hint="Wyświetlana w całym serwisie">
              <input
                name="vtc_name"
                defaultValue={settings.vtc_name}
                required
                className={inputCls}
                placeholder="np. Polish Truckers"
              />
            </Field>

            <Field label="Tag VTC" hint="Skrót widoczny przy nicku">
              <input
                name="vtc_tag"
                defaultValue={settings.vtc_tag}
                required
                className={inputCls}
                placeholder="np. [PT]"
              />
            </Field>
          </div>

          <Field label="Opis VTC">
            <textarea
              name="vtc_description"
              defaultValue={settings.vtc_description}
              rows={3}
              className={cn(inputCls, 'resize-none')}
              placeholder="Krótki opis wyświetlany na stronie głównej..."
            />
          </Field>

          <Field label="Data założenia">
            <input
              type="date"
              name="vtc_founded"
              defaultValue={settings.vtc_founded ?? ''}
              className={inputCls}
            />
          </Field>

          <div className="border-t border-zinc-800 pt-4 space-y-4">
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider
                          flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              Linki zewnętrzne
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Strona WWW">
                <div className="relative">
                  <input
                    name="vtc_website"
                    defaultValue={settings.vtc_website ?? ''}
                    className={cn(inputCls, 'pr-10')}
                    placeholder="https://..."
                  />
                  <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2
                                           w-3.5 h-3.5 text-zinc-600" />
                </div>
              </Field>

              <Field label="Serwer Discord">
                <div className="relative">
                  <input
                    name="vtc_discord"
                    defaultValue={settings.vtc_discord ?? ''}
                    className={cn(inputCls, 'pr-10')}
                    placeholder="https://discord.gg/..."
                  />
                  <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2
                                             w-3.5 h-3.5 text-zinc-600" />
                </div>
              </Field>

              <Field label="TruckersMP VTC ID / Link" hint="Link do profilu VTC na TruckersMP">
                <input
                  name="vtc_truckersmp"
                  defaultValue={settings.vtc_truckersmp ?? ''}
                  className={inputCls}
                  placeholder="https://truckersmp.com/vtc/..."
                />
              </Field>
            </div>
          </div>

          <SaveBtn pending={pending} />
        </form>
      )}

      {/* ── Rekrutacja ────────────────────── */}
      {tab === 'recruitment' && (
        <form
          onSubmit={e => handleSubmit(e, saveRecruitment)}
          className="space-y-5 bg-zinc-900/40 border border-zinc-800
                     rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="font-black text-sm uppercase tracking-wider text-zinc-300">
              Rekrutacja
            </h2>
          </div>

          <Toggle
            name="recruitment_open"
            checked={recruitmentOpen}
            onChange={setRecruitmentOpen}
            labelOn="Rekrutacja otwarta"
            labelOff="Rekrutacja zamknięta"
          />

          <Field
            label="Minimalna liczba godzin w ETS2"
            hint="Kandydaci z mniejszą liczbą godzin nie mogą składać podań"
          >
            <input
              type="number"
              name="recruitment_min_hours"
              defaultValue={settings.recruitment_min_hours}
              min={0}
              max={10000}
              className={inputCls}
            />
          </Field>

          <Field
            label="Wiadomość dla kandydatów"
            hint="Wyświetlana na stronie rekrutacji"
          >
            <textarea
              name="recruitment_message"
              defaultValue={settings.recruitment_message}
              rows={4}
              className={cn(inputCls, 'resize-none')}
              placeholder="Szukamy aktywnych kierowców..."
            />
          </Field>

          <SaveBtn pending={pending} />
        </form>
      )}

      {/* ── Finanse ───────────────────────── */}
      {tab === 'finance' && (
        <form
          onSubmit={e => handleSubmit(e, saveFinance)}
          className="space-y-5 bg-zinc-900/40 border border-zinc-800
                     rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            <h2 className="font-black text-sm uppercase tracking-wider text-zinc-300">
              Ustawienia finansowe
            </h2>
          </div>

          {/* Info box */}
          <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20
                          rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80">
              Zmiany wpływają tylko na <strong>nowych</strong> użytkowników
              i <strong>nowe</strong> pożyczki. Istniejące umowy pozostają bez zmian.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Saldo startowe (VTC€)"
              hint="Przyznawane przy rejestracji"
            >
              <div className="relative">
                <input
                  type="number"
                  name="starting_balance"
                  defaultValue={settings.starting_balance}
                  min={0}
                  className={cn(inputCls, 'pr-14')}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2
                                 text-xs text-zinc-500 font-bold">VTC€</span>
              </div>
            </Field>

            <Field
              label="Maks. kwota pożyczki (VTC€)"
            >
              <div className="relative">
                <input
                  type="number"
                  name="max_loan"
                  defaultValue={settings.max_loan}
                  min={0}
                  className={cn(inputCls, 'pr-14')}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2
                                 text-xs text-zinc-500 font-bold">VTC€</span>
              </div>
            </Field>

            <Field
              label="Oprocentowanie pożyczki (%)"
              hint="Wpisz np. 8 dla 8%"
            >
              <div className="relative">
                <input
                  type="number"
                  name="loan_interest_rate"
                  defaultValue={settings.loan_interest_rate * 100}
                  min={0}
                  max={100}
                  step={0.1}
                  className={cn(inputCls, 'pr-8')}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2
                                 text-xs text-zinc-500 font-bold">%</span>
              </div>
            </Field>
          </div>

          {/* Podgląd */}
          <div className="bg-zinc-800/60 rounded-xl p-4 space-y-2 text-sm">
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-3">
              Podgląd pożyczki 1000 VTC€
            </p>
            <div className="flex justify-between">
              <span className="text-zinc-500">Kwota</span>
              <span className="text-white font-bold">1 000 VTC€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">
                Odsetki ({settings.loan_interest_rate * 100}%)
              </span>
              <span className="text-red-400">
                +{(1000 * settings.loan_interest_rate).toFixed(2)} VTC€
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-700 pt-2">
              <span className="text-zinc-500">Do spłaty</span>
              <span className="text-amber-400 font-black">
                {(1000 * (1 + settings.loan_interest_rate)).toFixed(2)} VTC€
              </span>
            </div>
          </div>

          <SaveBtn pending={pending} />
        </form>
      )}

      {/* ── System ────────────────────────── */}
      {tab === 'system' && (
        <form
          onSubmit={e => handleSubmit(e, saveSystem)}
          className="space-y-5 bg-zinc-900/40 border border-zinc-800
                     rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <h2 className="font-black text-sm uppercase tracking-wider text-zinc-300">
              Ustawienia systemu
            </h2>
          </div>

          {/* Tryb konserwacji */}
          <div className="space-y-3">
            <Toggle
              name="maintenance_mode"
              checked={maintenanceMode}
              onChange={setMaintenanceMode}
              labelOn="Tryb konserwacji AKTYWNY — użytkownicy widzą komunikat"
              labelOff="Tryb konserwacji wyłączony"
            />

            {maintenanceMode && (
              <div className="flex gap-2 bg-red-500/10 border border-red-500/20
                              rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">
                  Użytkownicy nie będą mieli dostępu do panelu.
                  Tylko Owner może się zalogować.
                </p>
              </div>
            )}

            <Field
              label="Komunikat konserwacji"
              hint="Wyświetlany użytkownikom podczas przerwy technicznej"
            >
              <textarea
                name="maintenance_message"
                defaultValue={settings.maintenance_message}
                rows={3}
                className={cn(inputCls, 'resize-none')}
                placeholder="Trwają prace techniczne. Wróć za chwilę."
              />
            </Field>
          </div>

          {/* Wersja / info */}
          <div className="border-t border-zinc-800 pt-4 space-y-2">
            <p className="text-xs text-zinc-600 uppercase tracking-wider">
              Informacje techniczne
            </p>
            <div className="bg-zinc-900 rounded-xl p-4 space-y-2 text-xs font-mono">
              {[
                { label: 'Next.js',   value: '15.x' },
                { label: 'Supabase',  value: 'PostgreSQL 15' },
                { label: 'Autor',     value: 'mgyt' },
                { label: 'Kontakt',   value: 'Discord: mgyt' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-zinc-600">{label}</span>
                  <span className="text-zinc-400">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <SaveBtn pending={pending} />
        </form>
      )}
    </div>
  )
}
