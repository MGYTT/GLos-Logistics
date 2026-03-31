import type { Metadata } from 'next'
import Link              from 'next/link'
import {
  Lock, Database, UserCheck, Eye,
  Trash2, Globe, Mail, ChevronRight,
  ShieldCheck, AlertTriangle, Server,
  Cookie, Scale, Check,
} from 'lucide-react'

export const metadata: Metadata = {
  title:       'Polityka Prywatności — GLos Logistics',
  description: 'Dowiedz się jak GLos Logistics VTC przetwarza Twoje dane osobowe zgodnie z RODO.',
}

const LAST_UPDATED  = '31 marca 2026'
const CONTACT_EMAIL = 'gloslogisticss@gmail.com'

// ─── Typy ─────────────────────────────────────────────────
interface ContentSection {
  id:          string
  icon:        React.ElementType
  title:       string
  color:       string
  bg:          string
  border:      string
  content?:    string[]
  subsections?: { label: string; items: string[] }[]
  table?:      { purpose: string; basis: string }[]
  rights?:     { name: string; desc: string; icon: React.ElementType }[]
  note?:       string
}

// ─── Dane ──────────────────────────────────────────────────
const SECTIONS: ContentSection[] = [
  {
    id:     'controller',
    icon:   ShieldCheck,
    title:  '1. Administrator danych',
    color:  'text-amber-400',
    bg:     'bg-amber-400/10',
    border: 'border-amber-400/20',
    content: [
      'Administratorem Twoich danych osobowych jest organizator projektu GLos Logistics VTC — hobbystyczna społeczność kierowców wirtualnych, nieposiadająca formy prawnej ani statusu przedsiębiorcy.',
      'Niniejsza Polityka Prywatności opisuje, jakie dane zbieramy, w jakim celu, jak długo je przechowujemy oraz jakie prawa Ci przysługują zgodnie z RODO (Rozporządzenie UE 2016/679).',
      'W sprawach związanych z prywatnością skontaktuj się z nami przez e-mail lub kanał #support na Discordzie.',
    ],
  },
  {
    id:     'collected',
    icon:   Database,
    title:  '2. Jakie dane zbieramy',
    color:  'text-blue-400',
    bg:     'bg-blue-400/10',
    border: 'border-blue-400/20',
    subsections: [
      {
        label: 'Dane podawane dobrowolnie (rekrutacja / rejestracja)',
        items: [
          'Nick w grze (pseudonim — nie imię i nazwisko)',
          'Identyfikator Discord (Discord ID i tag)',
          'Liczba godzin w ETS2 / ATS (podawana samodzielnie)',
          'Opcjonalny identyfikator TruckersHub',
        ],
      },
      {
        label: 'Dane generowane automatycznie podczas korzystania z Platformy',
        items: [
          'Dane tras: miasto wyjazdu, cel, dystans, cargo, zarobki VTC€, paliwo, uszkodzenia, czas',
          'Logi aktywności bota Discord (komendy, znaczniki czasu)',
          'Historia transakcji VTC€ (pożyczki, lokaty, wypłaty za joby)',
          'Wnioski urlopowe i historia urlopów',
          'Logi audytowe: kto i kiedy wykonał akcję administracyjną',
        ],
      },
      {
        label: 'Dane techniczne (infrastruktura)',
        items: [
          'Logi żądań HTTP (IP, user-agent) — przechowywane przez Supabase / Vercel wg ich polityk',
          'Tokeny sesji jako httpOnly cookie — niedostępne dla JavaScriptu',
        ],
      },
    ],
  },
  {
    id:     'purpose',
    icon:   Eye,
    title:  '3. Cel i podstawa prawna',
    color:  'text-green-400',
    bg:     'bg-green-400/10',
    border: 'border-green-400/20',
    table: [
      { purpose: 'Prowadzenie konta kierowcy i wyświetlanie profilu',         basis: 'Zgoda — art. 6 ust. 1 lit. a'       },
      { purpose: 'Synchronizacja tras z TruckersMP (bridge)',                 basis: 'Zgoda — art. 6 ust. 1 lit. a'       },
      { purpose: 'Naliczanie punktów, rang, VTC€ i statystyk',               basis: 'Uzasadniony interes — art. 6 lit. f' },
      { purpose: 'Rozpatrywanie wniosków urlopowych i rekrutacyjnych',        basis: 'Uzasadniony interes — art. 6 lit. f' },
      { purpose: 'Zapobieganie nadużyciom i obsługa banów',                  basis: 'Uzasadniony interes — art. 6 lit. f' },
      { purpose: 'Wyświetlanie rankingów i statystyk publicznych',           basis: 'Uzasadniony interes — art. 6 lit. f' },
      { purpose: 'Obsługa dobrowolnego wsparcia finansowego (Patreon)',      basis: 'Zgoda — art. 6 ust. 1 lit. a'       },
    ],
  },
  {
    id:     'sharing',
    icon:   Globe,
    title:  '4. Udostępnianie danych',
    color:  'text-purple-400',
    bg:     'bg-purple-400/10',
    border: 'border-purple-400/20',
    content: [
      'Nie sprzedajemy ani nie wynajmujemy Twoich danych osobowych podmiotom trzecim w celach marketingowych.',
      'Dane są przetwarzane przez następujących podprocesatorów: Supabase Inc. (baza danych i uwierzytelnienie — region EU West), Vercel Inc. (hosting aplikacji — Edge Network), Discord Inc. (komunikacja przez bota).',
      'Dane tras mogą być publicznie widoczne w rankingach i profilach — wyłącznie jako pseudonim i statystyki gry, bez danych identyfikujących.',
      'Dostęp administracyjny do danych kierowców jest ograniczony wyłącznie do celów operacyjnych: moderacja, wsparcie techniczne, rozpatrywanie zgłoszeń.',
      'Możemy ujawnić dane jeśli wymaga tego obowiązujące prawo lub nakaz sądowy.',
    ],
  },
  {
    id:     'retention',
    icon:   Trash2,
    title:  '5. Okres przechowywania',
    color:  'text-orange-400',
    bg:     'bg-orange-400/10',
    border: 'border-orange-400/20',
    content: [
      'Dane konta kierowcy: przez cały czas aktywności + 12 miesięcy po ostatniej aktywności lub usunięciu konta.',
      'Dane tras i statystyk gry: bezterminowo jako dane historyczne VTC — stanowią integralną część statystyk społeczności.',
      'Logi audytowe (akcje administracyjne, bany): 24 miesiące.',
      'Wnioski rekrutacyjne odrzucone: usuwane po 90 dniach od odrzucenia.',
      'Po usunięciu konta: dane osobowe (Discord ID, nick) zostają zanonimizowane. Zagregowane statystyki mogą być zachowane w formie anonimowej.',
    ],
  },
  {
    id:     'rights',
    icon:   UserCheck,
    title:  '6. Twoje prawa (RODO)',
    color:  'text-teal-400',
    bg:     'bg-teal-400/10',
    border: 'border-teal-400/20',
    rights: [
      { icon: Eye,          name: 'Prawo dostępu',          desc: 'Możesz zażądać kopii danych przechowywanych na Twój temat.' },
      { icon: Check,        name: 'Prawo do sprostowania',  desc: 'Możesz poprosić o korektę nieprawidłowych danych.' },
      { icon: Trash2,       name: 'Prawo do usunięcia',     desc: '„Prawo do bycia zapomnianym" — zażądaj usunięcia danych osobowych.' },
      { icon: Lock,         name: 'Prawo do ograniczenia',  desc: 'Możesz zażądać ograniczenia przetwarzania w określonych sytuacjach.' },
      { icon: Scale,        name: 'Prawo do sprzeciwu',     desc: 'Możesz sprzeciwić się przetwarzaniu opartemu na uzasadnionym interesie.' },
      { icon: Database,     name: 'Prawo do przenoszenia',  desc: 'Możesz otrzymać dane w ustrukturyzowanym formacie (JSON / CSV).' },
      { icon: ShieldCheck,  name: 'Cofnięcie zgody',        desc: 'Możesz cofnąć zgodę w dowolnym momencie — bez wpływu na wcześniejsze przetwarzanie.' },
    ],
    note: 'Aby skorzystać z powyższych praw, skontaktuj się przez e-mail lub kanał #support na Discordzie. Odpowiemy w ciągu 30 dni. Przysługuje Ci też prawo złożenia skargi do Prezesa UODO (ul. Stawki 2, 00-193 Warszawa, www.uodo.gov.pl).',
  },
  {
    id:     'cookies',
    icon:   Cookie,
    title:  '7. Cookies i sesje',
    color:  'text-pink-400',
    bg:     'bg-pink-400/10',
    border: 'border-pink-400/20',
    content: [
      'Używamy wyłącznie niezbędnych ciasteczek sesyjnych (httpOnly, Secure, SameSite=Lax) do utrzymania zalogowanej sesji. Nie stosujemy ciasteczek śledzących, reklamowych ani analitycznych.',
      'Sesja wygasa automatycznie po czasie określonym przez Supabase Auth. Po wylogowaniu ciasteczko jest natychmiast usuwane.',
      'Nie korzystamy z Google Analytics, Meta Pixel, Hotjar ani żadnych zewnętrznych narzędzi śledzących zachowanie użytkowników.',
    ],
  },
  {
    id:     'security',
    icon:   Server,
    title:  '8. Bezpieczeństwo danych',
    color:  'text-cyan-400',
    bg:     'bg-cyan-400/10',
    border: 'border-cyan-400/20',
    content: [
      'Dane są przechowywane na serwerach Supabase w regionie EU West (Frankfurt) z szyfrowaniem at-rest i in-transit (TLS 1.3).',
      'Dostęp do bazy danych jest ograniczony przez Row Level Security (RLS) — każdy kierowca widzi tylko swoje dane, chyba że statystyki są publiczne z definicji (rankingi).',
      'Klucze API i sekrety środowiskowe nie są nigdy przechowywane w repozytorium kodu ani ujawniane po stronie klienta.',
      'W przypadku wykrycia naruszenia bezpieczeństwa danych poinformujemy użytkowników przez Discord w ciągu 72 godzin, zgodnie z wymogami RODO.',
    ],
  },
  {
    id:     'changes',
    icon:   AlertTriangle,
    title:  '9. Zmiany Polityki',
    color:  'text-zinc-400',
    bg:     'bg-zinc-400/10',
    border: 'border-zinc-800',
    content: [
      'Zastrzegamy sobie prawo do zmiany niniejszej Polityki. O istotnych zmianach poinformujemy przez ogłoszenie na Discordzie lub powiadomienie w panelu kierowcy.',
      'Data ostatniej aktualizacji jest zawsze widoczna na górze tego dokumentu. Dalsze korzystanie z Platformy po opublikowaniu zmian oznacza ich akceptację.',
    ],
  },
]

// ─── Komponenty pomocnicze ─────────────────────────────────
function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                      text-[10px] font-bold border ${color}`}>
      {children}
    </span>
  )
}

function SectionCard({ section }: { section: ContentSection }) {
  const { icon: Icon, title, color, bg, border, content,
          subsections, table, rights, note } = section

  return (
    <section id={section.id} className="scroll-mt-24">
      {/* Header karty */}
      <div className={`flex items-center gap-3 p-4 sm:p-5 rounded-t-2xl
                       border-x border-t ${border} ${bg}`}>
        <div className={`w-9 h-9 rounded-xl ${bg} border ${border}
                         flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <h2 className="text-base sm:text-lg font-black text-white">{title}</h2>
      </div>

      {/* Treść */}
      <div className={`border-x border-b ${border} rounded-b-2xl
                       bg-zinc-900/40 p-5 sm:p-6 space-y-5`}>

        {/* Paragrafy */}
        {content?.map((para, i) => (
          <p key={i} className="text-sm sm:text-[15px] text-zinc-400 leading-relaxed">
            {para}
          </p>
        ))}

        {/* Podsekcje z listami */}
        {subsections?.map((sub, si) => (
          <div key={si} className="space-y-2.5">
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              {sub.label}
            </p>
            <ul className="space-y-2">
              {sub.items.map((item, ii) => (
                <li key={ii} className="flex items-start gap-2.5 text-sm text-zinc-500">
                  <span className={`mt-[7px] w-1.5 h-1.5 rounded-full
                                    bg-blue-400/50 shrink-0`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Tabela celów */}
        {table && (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <div className="min-w-[480px] mx-5 sm:mx-0 rounded-xl border
                            border-zinc-800 overflow-hidden">
              {/* Nagłówek */}
              <div className="grid grid-cols-[1fr_240px] bg-zinc-800/60
                              border-b border-zinc-800">
                <div className="px-4 py-2.5 text-[10px] font-bold text-zinc-500
                                uppercase tracking-widest">
                  Cel przetwarzania
                </div>
                <div className="px-4 py-2.5 text-[10px] font-bold text-zinc-500
                                uppercase tracking-widest border-l border-zinc-800">
                  Podstawa prawna
                </div>
              </div>
              {/* Wiersze */}
              {table.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1fr_240px] border-b
                             border-zinc-800/50 last:border-0
                             ${i % 2 === 0 ? 'bg-zinc-900/20' : ''}`}
                >
                  <div className="px-4 py-3 text-sm text-zinc-400 leading-snug">
                    {row.purpose}
                  </div>
                  <div className="px-4 py-3 border-l border-zinc-800/50">
                    <Pill color="text-green-400 bg-green-400/10 border-green-400/20">
                      {row.basis}
                    </Pill>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prawa RODO — karty */}
        {rights && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rights.map((r) => {
              const RIcon = r.icon
              return (
                <div
                  key={r.name}
                  className="flex items-start gap-3 bg-zinc-900/60
                             border border-zinc-800 rounded-xl px-4 py-3.5
                             hover:border-teal-400/20 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-400/10 border
                                  border-teal-400/20 flex items-center
                                  justify-center shrink-0 mt-0.5">
                    <RIcon className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <div>
                    <p className="font-bold text-teal-400 text-sm mb-0.5">{r.name}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Notka pod prawami */}
        {note && (
          <div className="flex items-start gap-3 bg-zinc-800/40 border
                          border-zinc-700/50 rounded-xl px-4 py-3.5">
            <Scale className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-500 leading-relaxed">{note}</p>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Strona główna ─────────────────────────────────────────
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* ── Breadcrumb ──────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-600
                        mb-8 sm:mb-10">
          <Link href="/" className="hover:text-zinc-400 transition-colors">
            GLos Logistics
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-500">Polityka Prywatności</span>
        </nav>

        {/* ── Hero ────────────────────────────────────── */}
        <div className="mb-10 sm:mb-14">
          <div className="flex items-start gap-4 sm:gap-5 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border
                            border-blue-500/20 flex items-center
                            justify-center shrink-0">
              <Lock className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white
                             leading-tight mb-1.5">
                Polityka Prywatności
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-zinc-500">
                  Ostatnia aktualizacja:{' '}
                  <span className="text-zinc-300 font-medium">{LAST_UPDATED}</span>
                </span>
                <Pill color="text-green-400 bg-green-400/10 border-green-400/20">
                  ✓ Zgodna z RODO / GDPR
                </Pill>
                <Pill color="text-blue-400 bg-blue-400/10 border-blue-400/20">
                  ✓ Zero trackerów
                </Pill>
              </div>
            </div>
          </div>

          {/* Baner info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon:  ShieldCheck,
                color: 'text-green-400',
                bg:    'bg-green-400/8 border-green-400/15',
                title: 'RODO / GDPR',
                desc:  'Przetwarzamy dane zgodnie z Rozporządzeniem UE 2016/679',
              },
              {
                icon:  Cookie,
                color: 'text-blue-400',
                bg:    'bg-blue-400/8 border-blue-400/15',
                title: 'Tylko sesyjne cookies',
                desc:  'Brak Google Analytics, Meta Pixel ani innych trackerów',
              },
              {
                icon:  Server,
                color: 'text-purple-400',
                bg:    'bg-purple-400/8 border-purple-400/15',
                title: 'Serwery w EU',
                desc:  'Dane przechowywane na Supabase EU West (Frankfurt)',
              },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${bg}`}>
                <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                <div>
                  <p className={`text-xs font-bold ${color} mb-0.5`}>{title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Spis treści ─────────────────────────────── */}
        <nav className="bg-zinc-900/60 border border-zinc-800 rounded-2xl
                        p-5 mb-10 sm:mb-12">
          <p className="text-[10px] font-bold text-zinc-600 uppercase
                        tracking-widest mb-3.5">
            Spis treści
          </p>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center gap-2 text-sm text-zinc-500
                               hover:text-zinc-200 transition-colors group"
                  >
                    <Icon className={`w-3.5 h-3.5 ${s.color} shrink-0
                                      opacity-60 group-hover:opacity-100
                                      transition-opacity`} />
                    {s.title}
                  </a>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* ── Sekcje ──────────────────────────────────── */}
        <div className="space-y-6 sm:space-y-8">
          {SECTIONS.map(section => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>

        {/* ── Kontakt ─────────────────────────────────── */}
        <div className="mt-12 sm:mt-16 bg-zinc-900/60 border border-zinc-800
                        rounded-2xl p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-400/10 border
                            border-blue-400/20 flex items-center
                            justify-center shrink-0">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-black text-white mb-1">
                Kontakt w sprawie danych osobowych
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                Wszelkie wnioski dotyczące Twoich danych (dostęp, usunięcie,
                sprostowanie, przeniesienie) kieruj na:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5
                             rounded-xl bg-blue-500/10 hover:bg-blue-500/20
                             border border-blue-500/20 hover:border-blue-500/40
                             text-blue-400 text-sm font-semibold
                             transition-all"
                >
                  <Mail className="w-4 h-4" />
                  {CONTACT_EMAIL}
                </a>
                <span className="inline-flex items-center gap-2 px-4 py-2.5
                                 rounded-xl bg-zinc-800/60 border border-zinc-700
                                 text-zinc-400 text-sm">
                  <ShieldCheck className="w-4 h-4 text-zinc-600" />
                  Odpowiedź w ciągu 30 dni
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Nawigacja między dokumentami ────────────── */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/tos"
            className="flex items-center justify-between gap-3
                       bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800
                       hover:border-zinc-700 rounded-2xl px-5 py-4
                       transition-colors group"
          >
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">
                Przeczytaj również
              </p>
              <p className="font-bold text-white text-sm">
                Warunki Korzystania z Usługi
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600
                                     group-hover:text-blue-400 transition-colors
                                     shrink-0" />
          </Link>

          <Link
            href="/"
            className="flex items-center justify-between gap-3
                       bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800
                       hover:border-zinc-700 rounded-2xl px-5 py-4
                       transition-colors group"
          >
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">
                Nawigacja
              </p>
              <p className="font-bold text-white text-sm">
                Wróć do strony głównej
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600
                                     group-hover:text-blue-400 transition-colors
                                     shrink-0" />
          </Link>
        </div>

      </div>
    </main>
  )
}