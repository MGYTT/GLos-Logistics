'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { toast } from 'sonner'
import {
  Download, Copy, CheckCircle2,
  Plug, Monitor, KeyRound, Play,
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const BRIDGE_DOWNLOAD_URL =
  'https://github.com/MGYTT/GLos-Logistics/releases/download/Glos/GLos-Logistics-Bridge-Setup-v6.1.0.exe'

const FUNBIT_DOWNLOAD_URL =
  'https://github.com/Funbit/ets2-telemetry-server.git'

interface Props {
  member: { id: string; username: string; api_key: string }
}

function FaqItem({ q, a, code }: { q: string; a?: string | null; code?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setOpen(o => !o)}
      className="w-full text-left bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-300">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-zinc-600 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-zinc-600 flex-shrink-0" />
        }
      </div>
      {open && (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          {a && <p className="text-xs text-zinc-500 leading-relaxed">{a}</p>}
          {code && (
            <code className="block text-[11px] font-mono text-amber-400 bg-zinc-800 px-3 py-2.5 rounded-lg mt-2 whitespace-pre">
              {code}
            </code>
          )}
        </div>
      )}
    </button>
  )
}

export function BridgeDownload({ member }: Props) {
  const [copied, setCopied] = useState(false)

  function copyKey() {
    navigator.clipboard.writeText(member.api_key)
    setCopied(true)
    toast.success('Klucz API skopiowany!')
    setTimeout(() => setCopied(false), 2000)
  }

  const steps: {
    icon: React.ElementType
    iconColor: string
    iconBg: string
    label: string
    title: string
    desc: string
    action?: React.ReactNode
    note?: React.ReactNode
  }[] = [
    {
      icon:      Plug,
      iconColor: 'text-blue-400',
      iconBg:    'bg-blue-400/10',
      label:     'Krok 1',
      title:     'Zainstaluj Funbit Telemetry Server',
      desc:      'Pobierz i zainstaluj serwer telemetrii Funbit — wymagany do komunikacji między grą a Bridge.',
      action: (
        <a
          href={FUNBIT_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            size="sm"
            variant="outline"
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-1.5 h-8 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Pobierz Funbit
          </Button>
        </a>
      ),
      note: (
        <div className="mt-3 space-y-1.5">
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Po pobraniu: rozpakuj ZIP → uruchom <span className="text-zinc-300 font-mono">server\Ets2Telemetry.exe</span> → kliknij <span className="text-blue-400 font-semibold">Install</span>.
          </p>
          <code className="text-[11px] bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg block break-all leading-relaxed">
            📁 Domyślny port: http://localhost:25555
          </code>
        </div>
      ),
    },
    {
      icon:      Download,
      iconColor: 'text-amber-400',
      iconBg:    'bg-amber-400/10',
      label:     'Krok 2',
      title:     'Pobierz GLos Logistics Bridge',
      desc:      'Aplikacja desktopowa która automatycznie synchronizuje Twoje zlecenia i telemetrię ze stroną VTC.',
      action: (
        <a href={BRIDGE_DOWNLOAD_URL} download>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-1.5 h-8 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Pobierz Bridge v6.1.0
          </Button>
        </a>
      ),
      note: (
        <div className="flex items-start gap-2 mt-3 text-[11px] text-zinc-500 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Pobierze się plik <span className="font-mono text-zinc-300">GLos-Logistics-Bridge-Setup-v6.1.0.exe</span> — uruchom go aby zainstalować aplikację.
          </span>
        </div>
      ),
    },
    {
      icon:      KeyRound,
      iconColor: 'text-green-400',
      iconBg:    'bg-green-400/10',
      label:     'Krok 3',
      title:     'Skonfiguruj klucz API w aplikacji',
      desc:      'Przy pierwszym uruchomieniu Bridge poprosi o adres serwera i klucz API.',
      note: (
        <div className="mt-3 space-y-2">
          <div className="bg-zinc-800/80 rounded-lg px-3 py-2.5 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-zinc-500 w-28 shrink-0">Adres serwera:</span>
              <code className="text-blue-400 font-mono">https://glos-logistics.vercel.app</code>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-zinc-500 w-28 shrink-0">Klucz API:</span>
              <span className="text-zinc-300">skopiuj z sekcji poniżej</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-600">
            Klucz znajdziesz w{' '}
            <a href="/hub/profile" className="text-amber-400 hover:underline">
              Profil → zakładka API Bridge
            </a>
          </p>
        </div>
      ),
    },
    {
      icon:      Monitor,
      iconColor: 'text-purple-400',
      iconBg:    'bg-purple-400/10',
      label:     'Krok 4',
      title:     'Uruchom Funbit przed grą',
      desc:      'Serwer Funbit musi być aktywny zanim uruchomisz ETS2 i Bridge.',
      note: (
        <code className="text-[11px] font-mono bg-zinc-800 text-amber-400 px-3 py-2.5 rounded-lg block mt-3">
          📁 server\Ets2Telemetry.exe → musi pokazywać "Connected to simulator"
        </code>
      ),
    },
    {
      icon:      Play,
      iconColor: 'text-green-400',
      iconBg:    'bg-green-400/10',
      label:     'Krok 5',
      title:     'Uruchom Bridge i graj!',
      desc:      'Otwórz GLos Logistics Bridge, kliknij ▶ Start — wszystko synchronizuje się automatycznie.',
      note: (
        <div className="mt-3 bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2.5 text-[11px] text-green-400 leading-relaxed">
          ✅ Zlecenia, dystans, ładunek, zarobek — wszystko automatycznie pojawia się na Twoim dashboardzie!
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">

      {/* Header */}
      <PageHeader
        title="GLos Logistics Bridge"
        description="Połącz ETS2 ze stroną VTC — telemetria i zlecenia synchronizowane automatycznie"
        icon={Plug}
        iconColor="text-amber-400"
      />

      {/* Przycisk szybkiego pobrania */}
      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-black text-white">GLos Logistics Bridge</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Wersja 6.1.0 • Windows x64 • Installer
          </p>
        </div>
        <a href={BRIDGE_DOWNLOAD_URL} download>
          <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2">
            <Download className="w-4 h-4" />
            Pobierz teraz
          </Button>
        </a>
      </div>

      {/* Kroki instalacji */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider px-1 mb-3">
          Instrukcja instalacji
        </p>

        {steps.map(({ icon: Icon, iconColor, iconBg, label, title, desc, action, note }, i) => (
          <div
            key={i}
            className="flex gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
          >
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
                <Icon className={cn('w-4.5 h-4.5', iconColor)} />
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-zinc-800 min-h-[16px]" />
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                    {label}
                  </span>
                  <h3 className="text-sm font-black text-white mt-0.5">{title}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
                {action && <div className="shrink-0">{action}</div>}
              </div>
              {note}
            </div>
          </div>
        ))}
      </div>

      {/* Klucz API */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-sm font-black text-white">Twój klucz API</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={copyKey}
            className={cn(
              'gap-1.5 h-8 text-xs border transition-colors',
              copied
                ? 'border-green-500/40 text-green-400 bg-green-500/5'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
            )}
          >
            {copied
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Skopiowano!</>
              : <><Copy className="w-3.5 h-3.5" /> Kopiuj</>
            }
          </Button>
        </div>

        <code className="block font-mono text-xs text-amber-400 bg-zinc-800/80 border border-zinc-700/50 px-3 py-3 rounded-lg break-all select-all leading-relaxed">
          {member.api_key}
        </code>

        <p className="text-[11px] text-zinc-600">
          Wklej ten klucz w aplikacji Bridge w polu <span className="text-zinc-400">Klucz API Bridge</span> podczas pierwszej konfiguracji.
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider px-1 mb-3">
          Najczęstsze pytania
        </p>
        <FaqItem
          q="Czy muszę uruchamiać Bridge za każdym razem?"
          a="Tak — uruchamiaj go przed każdą sesją. Bridge minimalizuje się do tray (pasek zadań) więc możesz zostawić go włączonego na stałe podczas grania."
        />
        <FaqItem
          q="Bridge nie łączy się z ETS2"
          a="Upewnij się że Funbit Telemetry Server jest uruchomiony i pokazuje 'Connected to simulator'. ETS2 musi być załadowane — nie w menu głównym."
        />
        <FaqItem
          q="Czy Bridge działa na TruckersMP?"
          a="Tak! Funbit Telemetry Server działa zarówno w trybie single-player jak i na TruckersMP."
        />
        <FaqItem
          q="Gdzie znajdę swój klucz API?"
          a="Wejdź w Profil (górny pasek → Twój nick) → zakładka API Bridge. Klucz jest widoczny i możesz go skopiować bezpośrednio z tej strony."
        />
        <FaqItem
          q="Aplikacja znika po kliknięciu X"
          a="Bridge minimalizuje się do tray systemowego (prawy dolny róg paska zadań) zamiast się zamykać. Kliknij ikonę 🚛 w trayu aby ją przywrócić. Aby zamknąć całkowicie — kliknij prawym na ikonę w trayu → Zamknij."
        />
        <FaqItem
          q="Jak zresetować konfigurację Bridge?"
          a="W aplikacji Bridge kliknij przycisk ↩ Reset w prawym górnym rogu dashboardu. Możesz wtedy wpisać nowy klucz API lub adres serwera."
        />
      </div>

    </div>
  )
}