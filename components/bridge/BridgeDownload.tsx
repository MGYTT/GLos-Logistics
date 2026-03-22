'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { toast } from 'sonner'
import {
  Download, Copy, CheckCircle2, Terminal,
  Plug, FolderOpen, Play, AlertCircle,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  member: { id: string; username: string; api_key: string }
}

// FAQ item z rozwijaniem
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

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://twoja-strona.com'

  const bridgeScript = `// ============================================
//  VTC Bridge — ETS2 Auto-Sync
//  Kierowca: ${member.username}
//  ⚠️  Nie udostępniaj tego pliku nikomu!
// ============================================

const API_KEY  = '${member.api_key}'
const VTC_URL  = '${APP_URL}/api/telemetry/submit'
const ETS2_URL = 'http://localhost:25555/api/ets2/telemetry'
const INTERVAL = 10_000  // co 10 sekund

let lastStatus = null

async function sync() {
  try {
    const ets2Res = await fetch(ETS2_URL, { signal: AbortSignal.timeout(5000) })
    if (!ets2Res.ok) throw new Error('ETS2 nie odpowiada')
    const data = await ets2Res.json()

    const vtcRes = await fetch(VTC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(8000),
    })

    if (!vtcRes.ok) {
      const err = await vtcRes.json()
      throw new Error(err.error ?? 'Błąd serwera VTC')
    }

    const result = await vtcRes.json()
    const status = result.hasJob
      ? '🚛 W trasie: ' + (result.route ?? '')
      : '⏸️  Brak aktywnego zlecenia'

    if (status !== lastStatus) { console.log('[Bridge]', status); lastStatus = status }
    process.stdout.write('\\r[Bridge] ✅ ' + new Date().toLocaleTimeString('pl-PL') + ' | ' + status + '          ')
  } catch (e) {
    const msg = e.message ?? 'Nieznany błąd'
    if (msg.includes('ETS2')) {
      process.stdout.write('\\r[Bridge] ⏳ Czekam na ETS2...                    ')
    } else {
      process.stdout.write('\\r[Bridge] ❌ ' + msg + '                           ')
    }
  }
}

console.log('╔══════════════════════════════════════╗')
console.log('║       VTC Bridge — ETS2 Sync         ║')
console.log('╠══════════════════════════════════════╣')
console.log('║  Kierowca : ${member.username.padEnd(24)}║')
console.log('║  Interval : co 10 sekund             ║')
console.log('║  Naciśnij CTRL+C aby zatrzymać       ║')
console.log('╚══════════════════════════════════════╝')
console.log('')

setInterval(sync, INTERVAL)
sync()
`

  function downloadScript() {
    const blob = new Blob([bridgeScript], { type: 'text/javascript' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'vtc-bridge.js'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Skrypt pobrany! Postępuj zgodnie z instrukcją poniżej.')
  }

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
      title:     'Zainstaluj plugin ETS2',
      desc:      'Pobierz scs-telemetry.dll i wrzuć do folderu plugins gry.',
      action: (
        <a
          href="https://github.com/RenCloud/scs-sdk-plugin/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            size="sm"
            variant="outline"
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-1.5 h-8 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Pobierz plugin
          </Button>
        </a>
      ),
      note: (
        <code className="text-[11px] bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg block mt-3 break-all leading-relaxed">
          📁 Documents\Euro Truck Simulator 2\plugins\scs-telemetry.dll
        </code>
      ),
    },
    {
      icon:      Download,
      iconColor: 'text-amber-400',
      iconBg:    'bg-amber-400/10',
      label:     'Krok 2',
      title:     'Pobierz VTC Bridge',
      desc:      'Spersonalizowany skrypt z wbudowanym kluczem API — gotowy do użycia od razu.',
      action: (
        <Button
          size="sm"
          onClick={downloadScript}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-1.5 h-8 text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Pobierz vtc-bridge.js
        </Button>
      ),
      note: (
        <div className="flex items-start gap-2 mt-3 text-[11px] text-zinc-500 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>Nie udostępniaj tego pliku — zawiera Twój unikalny klucz API.</span>
        </div>
      ),
    },
    {
      icon:      FolderOpen,
      iconColor: 'text-green-400',
      iconBg:    'bg-green-400/10',
      label:     'Krok 3',
      title:     'Umieść skrypt w wygodnym miejscu',
      desc:      'Możesz wrzucić go na Pulpit lub do folderu z grą.',
      note: (
        <code className="text-[11px] bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg block mt-3">
          📁 Pulpit\vtc-bridge.js
        </code>
      ),
    },
    {
      icon:      Terminal,
      iconColor: 'text-purple-400',
      iconBg:    'bg-purple-400/10',
      label:     'Krok 4',
      title:     'Uruchom Bridge przed grą',
      desc:      'Otwórz PowerShell lub CMD w folderze ze skryptem i wpisz:',
      note: (
        <code className="text-[11px] font-mono bg-zinc-800 text-amber-400 px-3 py-2.5 rounded-lg block mt-3">
          node vtc-bridge.js
        </code>
      ),
    },
    {
      icon:      Play,
      iconColor: 'text-green-400',
      iconBg:    'bg-green-400/10',
      label:     'Krok 5',
      title:     'Uruchom ETS2 i graj!',
      desc:      'Bridge automatycznie wykryje zlecenie i zsynchronizuje dane.',
      note: (
        <div className="mt-3 bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2.5 text-[11px] text-green-400 leading-relaxed">
          ✅ Zlecenia, dystans, ładunek, zarobek — wszystko automatycznie na Twoim dashboardzie!
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">

      {/* Header */}
      <PageHeader
        title="ETS2 Bridge"
        description="Połącz grę ze stroną VTC — 5 minut ustawień, potem wszystko automatycznie"
        icon={Plug}
        iconColor="text-amber-400"
      />

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
            {/* Linia kroków */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
                <Icon className={cn('w-4.5 h-4.5', iconColor)} />
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-zinc-800 min-h-[16px]" />
              )}
            </div>

            {/* Treść */}
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
              <span className="text-sm">🔑</span>
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
          Klucz jest już wbudowany w pobrany skrypt. Kopiuj tylko jeśli konfigurujesz Bridge ręcznie.
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider px-1 mb-3">
          Najczęstsze pytania
        </p>
        <FaqItem
          q="Czy muszę uruchamiać Bridge za każdym razem?"
          a="Tak — uruchamiaj go przed każdą sesją grania. Możesz stworzyć skrót .bat na pulpicie żeby ułatwić sobie start."
        />
        <FaqItem
          q="Bridge nie łączy się z ETS2"
          a="Upewnij się że plugin .dll jest w folderze plugins i ETS2 jest uruchomione. Gra musi być załadowana (nie w menu głównym)."
        />
        <FaqItem
          q="Czy Bridge działa na TruckersMP?"
          a="Tak! Plugin scs-telemetry działa zarówno w trybie single-player jak i na TruckersMP."
        />
        <FaqItem
          q="Skrypt .bat do szybkiego uruchamiania"
          a="Stwórz plik START_VTC.bat w tym samym folderze co vtc-bridge.js:"
          code={'@echo off\ncd /d "%~dp0"\nnode vtc-bridge.js\npause'}
        />
        <FaqItem
          q="Nie mam zainstalowanego Node.js"
          a="Bridge wymaga Node.js. Pobierz bezpłatnie ze strony nodejs.org (wersja LTS)."
        />
      </div>

    </div>
  )
}
