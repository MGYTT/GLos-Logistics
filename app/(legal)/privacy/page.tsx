import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Lock, Database, UserCheck, Eye,
  Trash2, Globe, Mail, ChevronRight,
  ShieldCheck, AlertTriangle,
} from 'lucide-react'

export const metadata: Metadata = {
  title:       'Polityka Prywatności — GLos Logistics',
  description: 'Polityka prywatności platformy GLos Logistics VTC. Dowiedz się, jak przetwarzamy Twoje dane.',
}

const LAST_UPDATED  = '31 marca 2026'
const CONTACT_EMAIL = 'admin@gloslogistics.pl'

const sections = [
  {
    id:    'controller',
    icon:  ShieldCheck,
    title: '1. Administrator danych',
    color: 'text-amber-400',
    bg:    'bg-amber-400/10',
    content: [
      'Administratorem Twoich danych osobowych jest organizator projektu GLos Logistics VTC — hobbystyczna społeczność kierowców wirtualnych, nieposiadająca formy prawnej ani statusu przedsiębiorcy.',
      'W sprawach związanych z prywatnością i przetwarzaniem danych możesz skontaktować się z nami pod adresem: admin@gloslogistics.pl lub przez kanał #support na serwerze Discord GLos Logistics.',
      'Niniejsza Polityka Prywatności opisuje, jakie dane zbieramy, w jakim celu, jak długo je przechowujemy oraz jakie prawa Ci przysługują.',
    ],
  },
  {
    id:    'collected',
    icon:  Database,
    title: '2. Jakie dane zbieramy',
    color: 'text-blue-400',
    bg:    'bg-blue-400/10',
    subsections: [
      {
        label: 'Dane podawane dobrowolnie przy rejestracji / rekrutacji',
        items: [
          'Nick w grze (pseudonim, nie imię i nazwisko)',
          'Identyfikator Discord (Discord ID i tag)',
          'Liczba godzin w ETS2/ATS (podawana samodzielnie)',
          'Opcjonalny identyfikator TruckersHub',
        ],
      },
      {
        label: 'Dane generowane automatycznie podczas korzystania z Platformy',
        items: [
          'Dane tras i zleceń: miasto wyjazdu, miasto docelowe, dystans, cargo, zarobki VTC€, zużycie paliwa, procent uszkodzeń, czas ukończenia',
          'Logi aktywności bota Discord (komendy, znaczniki czasu)',
          'Historia transakcji VTC€ (pożyczki, lokaty, wypłaty)',
          'Stan urlopów i wnioski urlopowe',
          'Dane audytowe: kto i kiedy wykonał akcję administracyjną',
        ],
      },
      {
        label: 'Dane techniczne (infrastruktura Supabase / Vercel)',
        items: [
          'Logi żądań HTTP (adres IP, user-agent) — przechowywane przez dostawcę infrastruktury zgodnie z ich własną polityką prywatności',
          'Tokeny sesji (przechowywane jako httpOnly cookie, nie dostępne dla JavaScriptu)',
        ],
      },
    ],
  },
  {
    id:    'purpose',
    icon:  Eye,
    title: '3. Cel i podstawa prawna przetwarzania',
    color: 'text-green-400',
    bg:    'bg-green-400/10',
    table: [
      { purpose: 'Prowadzenie konta kierowcy i wyświetlanie profilu',              basis: 'Zgoda (art. 6 ust. 1 lit. a RODO)' },
      { purpose: 'Synchronizacja tras z TruckersMP (bridge)',                      basis: 'Zgoda (art. 6 ust. 1 lit. a RODO)' },
      { purpose: 'Naliczanie punktów, rang, VTC€ i statystyk',                    basis: 'Uzasadniony interes administratora (lit. f)' },
      { purpose: 'Rozpatrywanie wniosków urlopowych i rekrutacyjnych',             basis: 'Uzasadniony interes administratora (lit. f)' },
      { purpose: 'Zapobieganie nadużyciom i obsługa banów',                       basis: 'Uzasadniony interes administratora (lit. f)' },
      { purpose: 'Wyświetlanie rankingów i statystyk publicznych',                basis: 'Uzasadniony interes administratora (lit. f)' },
      { purpose: 'Obsługa dobrowolnego wsparcia finansowego (Patreon)',            basis: 'Zgoda (art. 6 ust. 1 lit. a RODO)' },
    ],
  },
  {
    id:    'sharing',
    icon:  Globe,
    title: '4. Udostępnianie danych',
    color: 'text-purple-400',
    bg:    'bg-purple-400/10',
    content: [
      'Nie sprzedajemy ani nie wynajmujemy Twoich danych osobowych podmiotom trzecim.',
      'Dane są przetwarzane przez następujących podprocesatorów (dostawców infrastruktury): Supabase Inc. (baza danych i uwierzytelnienie — serwery w regionie EU West), Vercel Inc. (hosting aplikacji webowej — Edge Network), Discord Inc. (komunikacja przez bota).',
      'Dane tras kierowców mogą być publicznie widoczne w rankingach i profilach na Platformie — wyłącznie w zakresie pseudonimu i statystyk gry, bez ujawniania danych identyfikujących.',
      'Administracja GLos Logistics ma dostęp do danych kierowców wyłącznie w celach operacyjnych (rozpatrywanie zgłoszeń, moderacja, wsparcie techniczne).',
      'Możemy udostępnić dane, jeśli jest to wymagane przez obowiązujące prawo lub nakaz sądowy.',
    ],
  },
  {
    id:    'retention',
    icon:  Trash2,
    title: '5. Okres przechowywania danych',
    color: 'text-orange-400',
    bg:    'bg-orange-400/10',
    content: [
      'Dane konta kierowcy przechowujemy przez cały czas jego aktywności na Platformie oraz przez 12 miesięcy po ostatniej aktywności lub usunięciu konta.',
      'Dane tras i statystyk gry: przechowywane bezterminowo jako dane historyczne VTC — stanowią integralną część statystyk społeczności.',
      'Logi audytowe (akcje administracyjne, bany): przechowywane przez 24 miesiące.',
      'Wnioski rekrutacyjne odrzucone: usuwane po 90 dniach od odrzucenia.',
      'Po usunięciu konta dane osobowe (Discord ID, nick) zostają zanonimizowane. Zagregowane statystyki (dystans, liczba tras) mogą być zachowane w formie anonimowej.',
    ],
  },
  {
    id:    'rights',
    icon:  UserCheck,
    title: '6. Twoje prawa (RODO)',
    color: 'text-teal-400',
    bg:    'bg-teal-400/10',
    rights: [
      { name: 'Prawo dostępu',          desc: 'Możesz zażądać kopii danych, które przechowujemy na Twój temat.' },
      { name: 'Prawo do sprostowania',  desc: 'Możesz poprosić o korektę nieprawidłowych lub niekompletnych danych.' },
      { name: 'Prawo do usunięcia',     desc: '„Prawo do bycia zapomnianym" — możesz zażądać usunięcia swoich danych osobowych.' },
      { name: 'Prawo do ograniczenia',  desc: 'Możesz zażądać ograniczenia przetwarzania w określonych sytuacjach.' },
      { name: 'Prawo do sprzeciwu',     desc: 'Możesz sprzeciwić się przetwarzaniu opartemu na uzasadnionym interesie administratora.' },
      { name: 'Prawo do przenoszenia',  desc: 'Możesz otrzymać swoje dane w ustrukturyzowanym formacie (JSON/CSV).' },
      { name: 'Prawo do cofnięcia zgody', desc: 'Możesz w dowolnym momencie cofnąć zgodę na przetwarzanie bez wpływu na zgodność z prawem przetwarzania przed jej cofnięciem.' },
    ],
    footer: 'Aby skorzystać z powyższych praw, skontaktuj się z nami przez e-mail lub kanał #support na Discordzie. Odpowiemy w ciągu 30 dni. Masz również prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO, ul. Stawki 2, 00-193 Warszawa).',
  },
  {
    id:    'cookies',
    icon:  Lock,
    title: '7. Cookies i sesje',
    color: 'text-pink-400',
    bg:    'bg-pink-400/10',
    content: [
      'Platforma używa wyłącznie niezbędnych ciasteczek sesyjnych (httpOnly, Secure) do utrzymania zalogowanej sesji kierowcy. Nie używamy ciasteczek śledzących, reklamowych ani analitycznych.',
      'Sesja jest ważna przez czas określony przez dostawcę uwierzytelnienia (Supabase Auth). Po wygaśnięciu sesji ciasteczko jest automatycznie usuwane.',
      'Nie korzystamy z Google Analytics, Meta Pixel, ani żadnych zewnętrznych narzędzi śledzących zachowanie użytkowników.',
    ],
  },
  {
    id:    'changes',
    icon:  AlertTriangle,
    title: '8. Zmiany Polityki',
    color: 'text-zinc-400',
    bg:    'bg-zinc-400/10',
    content: [
      'Zastrzegamy sobie prawo do zmiany niniejszej Polityki Prywatności. O istotnych zmianach poinformujemy Cię przez ogłoszenie na serwerze Discord lub powiadomienie w panelu kierowcy.',
      'Data ostatniej aktualizacji jest zawsze widoczna na górze tego dokumentu.',
    ],
  },
]

export default function PrivacyPage() {
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
            <div className="w-12 h-12 rounded-xl bg-blue-400/10 border
                            border-blue-400/20 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Polityka Prywatności
              </h1>
              <p className="text-zinc-500 mt-1 text-sm">
                Ostatnia aktualizacja:{' '}
                <span className="text-zinc-400">{LAST_UPDATED}</span>
              </p>
            </div>
          </div>

          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl
                          px-5 py-4 text-sm text-blue-200/70 leading-relaxed">
            <strong className="text-blue-300">RODO / GDPR:</strong>{' '}
            Przetwarzamy Twoje dane zgodnie z Rozporządzeniem Parlamentu Europejskiego
            i Rady (UE) 2016/679. Używamy wyłącznie niezbędnych cookies sesyjnych
            — żadnych trackerów, żadnych reklam.
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
                  className="text-sm text-zinc-500 hover:text-blue-400
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
        <div className="space-y-12 sm:space-y-16">
          {sections.map(({ id, icon: Icon, title, color, bg, content, subsections, table, rights, footer: sFooter }) => (
            <section key={id} id={id} className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center
                                 justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">{title}</h2>
              </div>

              <div className="pl-12 space-y-5">

                {/* Paragrafy */}
                {content?.map((para, i) => (
                  <p key={i} className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                    {para}
                  </p>
                ))}

                {/* Podsekcje z listami */}
                {subsections?.map((sub, si) => (
                  <div key={si}>
                    <p className="text-sm font-bold text-zinc-300 mb-2">{sub.label}:</p>
                    <ul className="space-y-1.5">
                      {sub.items.map((item, ii) => (
                        <li key={ii} className="flex items-start gap-2.5 text-sm text-zinc-500">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full
                                           bg-blue-400/60 shrink-0`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Tabela celów */}
                {table && (
                  <div className="-ml-12 sm:ml-0 overflow-x-auto">
                    <div className="min-w-[500px] sm:min-w-0 border border-zinc-800
                                    rounded-xl overflow-hidden mx-4 sm:mx-0">
                      <div className="grid grid-cols-[1fr_auto] bg-zinc-800/40
                                      border-b border-zinc-800 text-xs
                                      text-zinc-500 uppercase tracking-wider">
                        <div className="px-4 py-3">Cel przetwarzania</div>
                        <div className="px-4 py-3 w-64">Podstawa prawna</div>
                      </div>
                      {table.map((row, i) => (
                        <div
                          key={i}
                          className={`grid grid-cols-[1fr_auto] border-b
                                     border-zinc-800/50 last:border-0
                                     ${i % 2 === 0 ? 'bg-zinc-900/20' : ''}`}
                        >
                          <div className="px-4 py-3 text-sm text-zinc-400 leading-snug">
                            {row.purpose}
                          </div>
                          <div className="px-4 py-3 text-xs text-zinc-500 w-64 leading-snug">
                            {row.basis}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prawa RODO */}
                {rights && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rights.map((r, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900/60 border border-zinc-800
                                   rounded-xl px-4 py-3.5"
                      >
                        <p className="font-bold text-teal-400 text-sm mb-1">{r.name}</p>
                        <p className="text-xs text-zinc-500 leading-relaxed">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
                {sFooter && (
                  <p className="text-sm text-zinc-500 leading-relaxed
                                bg-zinc-900/40 border border-zinc-800/60
                                rounded-xl px-4 py-3.5">
                    {sFooter}
                  </p>
                )}

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
              <p className="font-bold text-white mb-1">Kontakt w sprawie danych osobowych</p>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Wszelkie wnioski dotyczące Twoich danych (dostęp, usunięcie, sprostowanie)
                kieruj na:{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
                  {CONTACT_EMAIL}
                </a>
                {' '}lub przez kanał{' '}
                <span className="text-zinc-300 font-semibold">#support</span> na Discordzie.
                Czas odpowiedzi: do <strong className="text-zinc-300">30 dni</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* ── Nawigacja między dokumentami ────── */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/tos"
            className="flex items-center justify-between gap-3 flex-1
                       bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800
                       hover:border-zinc-700 rounded-xl px-5 py-4
                       transition-colors group"
          >
            <div>
              <p className="text-xs text-zinc-600 mb-0.5">Przeczytaj również</p>
              <p className="font-bold text-white text-sm">Warunki Korzystania z Usługi</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600
                                     group-hover:text-blue-400 transition-colors" />
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
                                     group-hover:text-blue-400 transition-colors" />
          </Link>
        </div>

      </div>
    </main>
  )
}