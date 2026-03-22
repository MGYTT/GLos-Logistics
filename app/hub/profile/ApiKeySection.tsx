'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Key, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react'

interface Props { apiKey: string; memberId: string }

export function ApiKeySection({ apiKey: initial, memberId }: Props) {
  const [apiKey, setApiKey]   = useState(initial)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function regenerate() {
    setLoading(true)
    const newKey = crypto.randomUUID()
    const { error } = await supabase
      .from('members')
      .update({ api_key: newKey })
      .eq('id', memberId)

    if (error) toast.error('Błąd regeneracji klucza')
    else { setApiKey(newKey); toast.success('Nowy klucz wygenerowany!') }
    setLoading(false)
  }

  function copyKey() {
    navigator.clipboard.writeText(apiKey)
    toast.success('Klucz skopiowany!')
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Key className="w-5 h-5 text-amber-400" />
        <h3 className="font-bold">Klucz API — ETS2 Bridge</h3>
      </div>

      <p className="text-sm text-zinc-500">
        Użyj tego klucza w skrypcie <code className="text-amber-400 bg-zinc-800 px-1 rounded">vtc-bridge.js</code>,
        aby automatycznie synchronizować zlecenia z gry.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={visible ? apiKey : '•'.repeat(36)}
            readOnly
            className="font-mono text-xs bg-zinc-800 border-zinc-700 pr-10"
          />
          <button
            onClick={() => setVisible(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button
          size="sm" variant="outline"
          onClick={copyKey}
          className="border-zinc-700 gap-1.5"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          size="sm" variant="outline"
          onClick={regenerate}
          disabled={loading}
          className="border-zinc-700 gap-1.5 text-red-400 hover:text-red-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Instrukcja */}
      <div className="bg-zinc-800/60 rounded-lg p-4 text-xs space-y-2 text-zinc-400">
        <div className="font-bold text-zinc-300 mb-2">📋 Instrukcja (30 sekund):</div>
        <div className="space-y-1.5">
          {[
            { n: '1', text: 'Pobierz plugin:', link: 'github.com/RenCloud/scs-sdk-plugin', href: 'https://github.com/RenCloud/scs-sdk-plugin/releases' },
            { n: '2', text: 'Skopiuj .dll do: Documents\\ETS2\\plugins\\' },
            { n: '3', text: 'Pobierz vtc-bridge.js z panelu i wstaw klucz API' },
            { n: '4', text: 'Uruchom: node vtc-bridge.js przed grą' },
          ].map(({ n, text, link, href }) => (
            <div key={n} className="flex gap-2">
              <span className="w-5 h-5 bg-amber-500/20 text-amber-400 rounded-full
                               flex items-center justify-center text-[10px] font-bold shrink-0">
                {n}
              </span>
              <span>
                {text}
                {link && (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="text-amber-400 hover:underline ml-1">
                    {link}
                  </a>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
