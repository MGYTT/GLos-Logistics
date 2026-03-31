import type { Metadata } from 'next'
import Link from 'next/link'
import {
  FileText, Shield, AlertTriangle, Users,
  Ban, RefreshCw, Mail, ChevronRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title:       'Warunki Korzystania z Usługi — GLos Logistics',
  description: 'Warunki korzystania z platformy GLos Logistics VTC.',
}

const LAST_UPDATED = '31 marca 2026'
const CONTACT_EMAIL = 'admin@gloslogistics.pl'

const sections = [
  {
    id:    'general',
    icon:  FileText,
    title: '1. Postanowienia ogólne',
    color: 'text-amber-400',
    bg:    'bg-amber-400/10',
    content: [
      'Platforma GLos Logistics („Platforma", „Serwis") jest wirtualną firmą transportową (VTC) działającą w środowisku gier Euro Truck Simulator 2 i American Truck Simulator, udostępnianą nieodpłatnie przez jej założycieli.',
      'Korzystanie z Platformy — w tym panelu kierowcy, bota Discord oraz wszelkich powiązanych usług — oznacza akceptację niniejszych Warunków Korzystania z Usługi („Warunki").',
      'GLos Logistics jest projektem hobbystycznym, niekomercyjnym. Nie świadczymy usług w rozumieniu prawa konsumenckiego ani nie prowadzimy działalności gospodarczej.',
      'Jeśli nie akceptujesz Warunków, powinieneś zaprzestać korzystania z Platformy.',
    ],
  },
  {
    id:    'eligibility',
    icon:  Users,
    title: '2. Warunki uczestnictwa',
    color: 'text-blue-400',
    bg:    'bg-blue-400/10',
    content: [
      'Z Platformy mogą korzystać osoby, które ukończyły 13. rok życia. Osoby poniżej 16. roku życia powinny uzyskać zgodę rodzica lub opiekuna prawnego.',
      'Aby dołączyć do GLos Logistics jako kierowca, wymagane jest złożenie podania rekrutacyjnego i jego akceptacja przez administrację.',
      'Każdy kierowca może posiadać wyłącznie jedno konto w systemie. Zakładanie wielu kont jest zabronione.',
      'Konto Discord jest wymagane do korzystania z pełnej funkcjonalności Platformy, w tym bota i kanałów komunikacji.',
    ],
  },
  {
    id:    'rules',
    icon:  Shield,
    title: '3. Zasady korzystania',
    color: 'text-green-400',
    bg:    'bg-green-400/10',
    content: [
      'Użytkownik zobowiązuje się do korzystania z Platformy w sposób zgodny z prawem, Warunkami oraz ogólnymi zasadami netykiety.',
      'Zabrania się podawania nieprawdziwych informacji w formularzu rekrutacyjnym, profilu lub jakiejkolwiek komunikacji z administracją.',
      'Zabrania się manipulowania danymi w systemie, w tym próby ingerowania w mechanizmy punktacji, statystyk lub salda VTC€.',
      'Zabrania się działań zakłócających pracę Platformy, bota Discord, bazy danych lub innych komponentów technicznych.',
      'Wirtualna waluta VTC€ jest jednostką rozliczeniową wyłącznie na potrzeby gry i nie ma żadnej wartości pieniężnej w świecie rzeczywistym. Nie podlega wymianie, handlowi ani wypłacie.',
      'Zabrania się obrotu kontem, sprzedaży dostępu do Platformy ani udostępniania swoich danych logowania innym osobom.',
    ],
  },
  {
    id:    'content',
    icon:  FileText,
    title: '4. Treści i własność intelektualna',
    color: 'text-purple-400',
    bg:    'bg-purple-400/10',
    content: [
      'Wszelkie elementy Platformy — kod źródłowy, grafiki, logotypy, interfejs — są własnością twórców GLos Logistics i podlegają ochronie prawa autorskiego.',
      'Użytkownik nie ma prawa kopiować, modyfikować, rozpowszechniać ani tworzyć dzieł zależnych na podstawie zasobów Platformy bez pisemnej zgody administracji.',
      'Euro Truck Simulator 2 i American Truck Simulator są własnością SCS Software. GLos Logistics nie jest w żaden sposób powiązane z SCS Software.',
      'TruckersMP jest niezależną modyfikacją sieciową i nie jest oficjalnie powiązana z GLos Logistics.',
    ],
  },
  {
    id:    'bans',
    icon:  Ban,
    title: '5. Sankcje i bany',
    color: 'text-red-400',
    bg:    'bg-red-400/10',
    content: [
      'Administracja GLos Logistics zastrzega sobie prawo do ostrzeżenia, zawieszenia lub trwałego zbanowania konta użytkownika w przypadku naruszenia Warunków, zasad społeczności lub zachowania uznanego za szkodliwe.',
      'Decyzja o banie może zapaść bez wcześniejszego ostrzeżenia w przypadku poważnych naruszeń (np. oszustwo, manipulacja danymi, spam, zachowanie toksyczne).',
      'Zbanowany użytkownik traci dostęp do panelu kierowcy, bota Discord i wszystkich funkcji Platformy. Saldo VTC€ i zebrane punkty nie podlegają zwrotowi ani transferowi.',
      'Odwołanie od decyzji o banie można złożyć wyłącznie za pośrednictwem systemu ticketów na Discordzie lub na adres e-mail administracji. Decyzja administracji jest ostateczna.',
    ],
  },
  {
    id:    'support',
    icon:  RefreshCw,
    title: '6. Dostępność i wsparcie',
    color: 'text-teal-400',
    bg:    'bg-teal-400/10',
    content: [
      'Platforma jest udostępniana w stanie „takim, jakim jest" (as-is). Administracja dokłada starań, aby zapewnić ciągłość działania, jednak nie gwarantuje dostępności usługi 24/7.',
      'GLos Logistics zastrzega sobie prawo do przeprowadzania prac serwisowych, aktualizacji i zmian w funkcjonalności Platformy bez wcześniejszego powiadomienia.',
      'W przypadku problemów technicznych lub pytań skontaktuj się z administracją przez kanał #support na Discordzie lub drogą e-mailową.',
      'Dobrowolne wsparcie finansowe (Patreon) jest przeznaczone wyłącznie na pokrycie kosztów serwera i rozwoju Platformy. Nie jest traktowane jako zakup usługi i nie rodzi żadnych dodatkowych praw ani gwarancji poza opisanymi na stronie wsparcia.',
    ],
  },
  {
    id:    'changes',
    icon:  RefreshCw,
    title: '7. Zmiany Warunków',
    color: 'text-zinc-400',
    bg:    'bg-zinc-400/10',
    content: [
      'Administracja zastrzega sobie prawo do zmiany niniejszych Warunków w dowolnym momencie. O istotnych zmianach użytkownicy będą informowani przez ogłoszenie na Discordzie lub powiadomienie w panelu kierowcy.',
      'Dalsze korzystanie z Platformy po opublikowaniu zmian oznacza akceptację nowych Warunków.',
      'Archiwalne wersje dokumentu są dostępne na żądanie — skontaktuj się z administracją.',
    ],
  },
]

export default function TosPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* ── Hero ────────────────────────────── */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-2 text-xs text-zinc-600
                          uppercase tracking-widest mb-4">
            <Link href="/" className="hover:text-zinc-400 transition-colors">
              GLos Logistics
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span>Dokumenty prawne</span>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border
                            border-amber-400/20 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Warunki Korzystania z Usługi
              </h1>
              <p className="text-zinc-500 mt-1 text-sm">
                Ostatnia aktualizacja: <span className="text-zinc-400">{LAST_UPDATED}</span>
              </p>
            </div>
          </div>

          <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl
                          px-5 py-4 text-sm text-amber-200/70 leading-relaxed">
            <strong className="text-amber-300">Ważne:</strong>{' '}
            GLos Logistics jest projektem hobbystycznym, niekomercyjnym. Niniejsze
            Warunki regulują korzystanie z platformy VTC, bota Discord i panelu
            kierowcy. Wirtualna waluta VTC€ nie ma wartości pieniężnej.
          </div>
        </div>

        {/* ── Spis treści ─────────────────────── */}
        <nav className="bg-zinc-900/60 border border-zinc-800 rounded-xl
                        p-5 mb-10 sm:mb-14">
          <p className="text-xs text-zinc-600 uppercase tracking-wider
                        font-semibold mb-3">
            Spis treści
          </p>
          <ol className="space-y-1.5">
            {sections.map(s => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-zinc-500 hover:text-amber-400
                             transition-colors flex items-center gap-2"
                >
                  <ChevronRight className="w-3 h-3 shrink-0" />
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── Sekcje ──────────────────────────── */}
        <div className="space-y-10 sm:space-y-14">
          {sections.map(({ id, icon: Icon, title, color, bg, content }) => (
            <section key={id} id={id} className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center
                                 justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {title}
                </h2>
              </div>

              <div className="space-y-3 pl-12">
                {content.map((para, i) => (
                  <p key={i} className="text-sm sm:text-base text-zinc-400
                                        leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Kontakt ─────────────────────────── */}
        <div className="mt-14 sm:mt-20 border-t border-zinc-800/60 pt-10">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-blue-400/10 flex items-center
                            justify-center shrink-0 mt-0.5">
              <Mail className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-white mb-1">Kontakt z administracją</p>
              <p className="text-sm text-zinc-500 leading-relaxed">
                W sprawach dotyczących Warunków, banów lub reklamacji skontaktuj
                się z nami przez:{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-amber-400 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                {' '}lub kanał <span className="text-zinc-300 font-semibold">#support</span> na
                naszym serwerze Discord.
              </p>
            </div>
          </div>
        </div>

        {/* ── Nawigacja między dokumentami ────── */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/privacy"
            className="flex items-center justify-between gap-3 flex-1
                       bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800
                       hover:border-zinc-700 rounded-xl px-5 py-4
                       transition-colors group"
          >
            <div>
              <p className="text-xs text-zinc-600 mb-0.5">Przeczytaj również</p>
              <p className="font-bold text-white text-sm">Polityka Prywatności</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600
                                     group-hover:text-amber-400 transition-colors" />
          </Link>

          <Link
            href="/"
            className="flex items-center justify-between gap-3
                       bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800
                       hover:border-zinc-700 rounded-xl px-5 py-4
                       transition-colors group sm:w-48"
          >
            <p className="font-semibold text-zinc-400 text-sm">
              Wróć do strony głównej
            </p>
            <ChevronRight className="w-4 h-4 text-zinc-600
                                     group-hover:text-amber-400 transition-colors" />
          </Link>
        </div>

      </div>
    </main>
  )
}