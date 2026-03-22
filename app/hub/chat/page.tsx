import { MessageSquare, Clock } from 'lucide-react'

export const metadata = { title: 'Czat VTC' }

export default function ChatPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-4rem)] p-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">

        {/* Ikona */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-blue-400" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Clock className="w-3 h-3 text-amber-400" />
          </div>
        </div>

        {/* Tekst */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Czat VTC</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Czat wewnętrzny VTC jest aktualnie w trakcie wdrożenia.
            Wkrótce będziesz mógł komunikować się z innymi kierowcami w czasie rzeczywistym.
          </p>
        </div>

        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Wkrótce dostępne
          </span>
        </div>

      </div>
    </div>
  )
}
