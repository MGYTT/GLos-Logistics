// app/(legal)/tos/page.tsx
import type { Metadata } from 'next'
import Link              from 'next/link'
import {
  Scale, ShieldCheck, AlertTriangle, Truck,
  Users, Ban, Gavel, Mail, ChevronRight,
  FileText, Clock, Coins, Wifi, Star,
  MessageSquare, HelpCircle, Check, X,
} from 'lucide-react'

export const metadata: Metadata = {
  title:       'Regulamin — GLos Logistics VTC',
  description: 'Regulamin korzystania z platformy GLos Logistics VTC. Zapoznaj się z zasadami przed dołączeniem.',
}

const LAST_UPDATED  = '31 marca 2026'
const CONTACT_EMAIL = 'gloslogisticss@gmail.com'
const DISCORD_URL   = 'https://discord.gg/WyEU3Kp8JF'

// ─── Typy ─────────────────────────────────────────────────
interface TosSection {
  id:      string
  icon:    React.ElementType
  title:   string
  color:   string
  bg:      string
  border:  string
  content: React.ReactNode
}

// ─── Utility ──────────────────────────────────────────────
function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-zinc-400 leading-relaxed">
      <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  )
}

function Forbidden({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-zinc-400 leading-relaxed">
      <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  )
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-400 leading-relaxed">{children}</p>
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-wider font-bold text-zinc-500 mt-5 mb-2">
      {children}
    </p>
  )
}

// ─── Dane sekcji ──────────────────────────────────────────
function buildSections(): TosSection[] {
  return [
    // ── 1. Postanowienia ogólne
    {
      id:     'general',
      icon:   FileText,
      title:  '1. Postanowienia ogólne',
      color:  'text-amber-400',
      bg:     'bg-amber-400/8',
      border: 'border-amber-400/20',
      content: (
        <div className="space-y-3">
          <Para>
            Niniejszy Regulamin określa zasady korzystania z platformy GLos Logistics VTC
            (dalej: „Platforma"), stanowiącej hobbystyczną społeczność wirtualnych kierowców
            ciężarówek. Platforma nie prowadzi działalności gospodarczej ani nie generuje
            dochodów na rzecz jej organizatora.
          </Para>
          <Para>
            Rejestracja na Platformie lub korzystanie z jej funkcji (w tym serwera Discord)
            jest dobrowolne i równoznaczne z akceptacją niniejszego Regulaminu w całości.
          </Para>
          <Para>
            Wszelkie waluty, rangi, zarobki i punkty wymieniane w Regulaminie mają charakter
            wyłącznie wirtualny i nie posiadają wartości pieniężnej ani prawnej.
          </Para>
          <div className="bg-amber-400/8 border border-amber-400/20 rounded-xl p-4 mt-2">
            <p className="text-xs text-amber-300/80 leading-relaxed">
              <span className="font-bold">Ważne:</span> Niniejszy Regulamin może ulec zmianie.
              O istotnych zmianach informujemy na kanale <span className="font-semibold">#ogłoszenia</span> na
              Discordzie z co najmniej 7-dniowym wyprzedzeniem. Dalsze korzystanie z Platformy
              po tym terminie oznacza akceptację zmian.
            </p>
          </div>
        </div>
      ),
    },

    // ── 2. Konto i rejestracja
    {
      id:     'account',
      icon:   Users,
      title:  '2. Konto i rejestracja',
      color:  'text-blue-400',
      bg:     'bg-blue-400/8',
      border: 'border-blue-400/20',
      content: (
        <div className="space-y-3">
          <SubTitle>Wymagania</SubTitle>
          <ul className="space-y-2">
            <Rule>Musisz posiadać aktywne konto Discord i TruckersMP.</Rule>
            <Rule>Możesz posiadać tylko jedno konto na Platformie — duplikaty są usuwane.</Rule>
            <Rule>Konto jest osobiste i niezbywalne — nie możesz go przekazać innej osobie.</Rule>
            <Rule>Minimalny wymagany wiek to 16 lat.</Rule>
          </ul>

          <SubTitle>Bezpieczeństwo konta</SubTitle>
          <ul className="space-y-2">
            <Rule>Jesteś odpowiedzialny za bezpieczeństwo danych dostępowych do swojego konta Discord.</Rule>
            <Rule>W przypadku podejrzenia przejęcia konta zgłoś to niezwłocznie administracji.</Rule>
            <Forbidden>Nie wolno udostępniać dostępu do konta innym osobom.</Forbidden>
            <Forbidden>Nie wolno korzystać z cudzego konta ani w jego imieniu.</Forbidden>
          </ul>
        </div>
      ),
    },

    // ── 3. Zasady gry i joby
    {
      id:     'gameplay',
      icon:   Truck,
      title:  '3. Zasady gry i joby',
      color:  'text-green-400',
      bg:     'bg-green-400/8',
      border: 'border-green-400/20',
      content: (
        <div className="space-y-3">
          <SubTitle>Wymagania aktywności</SubTitle>
          <ul className="space-y-2">
            <Rule>Każdy kierowca zobowiązany jest wykonać minimum <strong className="text-zinc-200">2 joby w miesiącu</strong>, aby zachować aktywny status.</Rule>
            <Rule>Joby muszą być raportowane przez oficjalną integrację Platformy lub komendę bota.</Rule>
            <Rule>Wymagane są własnoręcznie wykonane screenshoty jako dowód ukończenia jobu.</Rule>
          </ul>

          <SubTitle>Zasady bezpieczeństwa na serwerze</SubTitle>
          <ul className="space-y-2">
            <Rule>Przestrzegaj przepisów ruchu drogowego i ogólnych zasad TruckersMP.</Rule>
            <Rule>Jazda z włączonymi sygnałami ostrzegawczymi podczas konwojów jest obowiązkowa.</Rule>
            <Forbidden>Zakaz celowego taranowania, blokowania ruchu lub zachowań mających na celu utrudnienie gry innym.</Forbidden>
            <Forbidden>Zakaz używania modów wpływających negatywnie na innych graczy (speed hacks, cheaty).</Forbidden>
            <Forbidden>Zakaz raportowania fałszywych danych tras, dystansów lub ładunków.</Forbidden>
          </ul>

          <SubTitle>System ekonomii VTC (VTC€)</SubTitle>
          <Para>
            Wirtualna waluta VTC€ służy wyłącznie do rozliczeń wewnątrz Platformy. Nie posiada
            wartości prawnej i nie podlega wymianie na pieniądze ani inne wartości poza Platformą.
          </Para>
          <ul className="space-y-2 mt-2">
            <Rule>Saldo VTC€ może być modyfikowane przez administrację w uzasadnionych przypadkach (korekty, sankcje).</Rule>
            <Rule>System pożyczek i lokat podlega oddzielnym zasadom opisanym w Panelu Banku.</Rule>
            <Forbidden>Manipulacja systemem ekonomii (np. wielokrotne raportowanie tego samego jobu) jest surowo zakazana i skutkuje banem konta.</Forbidden>
          </ul>
        </div>
      ),
    },

    // ── 4. Zasady społeczności
    {
      id:     'community',
      icon:   MessageSquare,
      title:  '4. Zasady społeczności i komunikacji',
      color:  'text-purple-400',
      bg:     'bg-purple-400/8',
      border: 'border-purple-400/20',
      content: (
        <div className="space-y-3">
          <Para>
            GLos Logistics VTC to społeczność oparta na wzajemnym szacunku.
            Poniższe zasady obowiązują na wszystkich kanałach Discord, w czacie
            podczas jazdy oraz w formularzach i aplikacji.
          </Para>

          <SubTitle>Wymagane zachowania</SubTitle>
          <ul className="space-y-2">
            <Rule>Traktuj innych kierowców z szacunkiem, bez względu na poziom doświadczenia.</Rule>
            <Rule>Konstruktywna krytyka i feedback dotyczące Platformy są mile widziane na kanale #sugestie.</Rule>
            <Rule>Zgłaszaj nieodpowiednie zachowania przez kanał #support lub ticket.</Rule>
          </ul>

          <SubTitle>Zakazane zachowania</SubTitle>
          <ul className="space-y-2">
            <Forbidden>Mowa nienawiści, dyskryminacja, rasizm, seksizm.</Forbidden>
            <Forbidden>Nękanie, zastraszanie lub trollowanie innych członków.</Forbidden>
            <Forbidden>Spam, rozsyłanie reklam i linków bez zgody administracji.</Forbidden>
            <Forbidden>Udostępnianie treści dla dorosłych, przemocy lub nielegalnych materiałów.</Forbidden>
            <Forbidden>Podszywanie się pod administrację lub innych użytkowników.</Forbidden>
            <Forbidden>Publiczne omawianie kar, banów lub wewnętrznych decyzji administracyjnych.</Forbidden>
          </ul>
        </div>
      ),
    },

    // ── 5. System rang i awansów
    {
      id:     'ranks',
      icon:   Star,
      title:  '5. Rangi, awanse i nagrody',
      color:  'text-yellow-400',
      bg:     'bg-yellow-400/8',
      border: 'border-yellow-400/20',
      content: (
        <div className="space-y-3">
          <Para>
            System rang jest odzwierciedleniem aktywności i zaangażowania kierowcy.
            Rangi mają charakter wyłącznie prestiżowy i nie dają żadnych praw cywilnoprawnych.
          </Para>
          <ul className="space-y-2">
            <Rule>Awans następuje automatycznie po spełnieniu ustalonych progów (kilometry, joby, obecność na konwojach).</Rule>
            <Rule>Administracja może przyznać rangę honorową za szczególny wkład w społeczność.</Rule>
            <Rule>Rangi mogą być cofnięte w przypadku naruszenia Regulaminu.</Rule>
            <Forbidden>Manipulowanie statystykami w celu sztucznego podwyższenia rangi jest zakazane i skutkuje degradacją oraz banem.</Forbidden>
          </ul>

          <SubTitle>Tygodniowy bonus VTC€</SubTitle>
          <Para>
            Bonus tygodniowy jest naliczany automatycznie w każdy poniedziałek dla kierowców,
            którzy w poprzednim tygodniu wykonali minimum wymagany próg aktywności.
            Administracja zastrzega sobie prawo do zmiany wysokości i zasad naliczania bonusu.
          </Para>
        </div>
      ),
    },

    // ── 6. Urlopy i nieobecności
    {
      id:     'absence',
      icon:   Clock,
      title:  '6. Urlopy i nieobecności',
      color:  'text-teal-400',
      bg:     'bg-teal-400/8',
      border: 'border-teal-400/20',
      content: (
        <div className="space-y-3">
          <ul className="space-y-2">
            <Rule>Nieobecność dłuższa niż 14 dni musi być zgłoszona przez formularz urlopowy w Panelu Kierowcy.</Rule>
            <Rule>Urlopy są zatwierdzane przez administrację w ciągu 48 godzin od złożenia wniosku.</Rule>
            <Rule>Podczas zatwierdzonego urlopu wymagania aktywności są zawieszane.</Rule>
            <Rule>Maksymalny czas urlopu bez konsultacji z administracją to 60 dni.</Rule>
            <Forbidden>Urlopy z datą wsteczną (obejmujące miniony okres inaktywności) nie są rozpatrywane pozytywnie.</Forbidden>
          </ul>
          <Para>
            Nieusprawiedliwiona inaktywność przekraczająca 30 dni skutkuje automatycznym
            usunięciem z VTC z możliwością ponownej rekrutacji po upływie 14 dni.
          </Para>
        </div>
      ),
    },

    // ── 7. Systemy finansowe (pożyczki / lokaty)
    {
      id:     'finance',
      icon:   Coins,
      title:  '7. System pożyczek i lokat',
      color:  'text-orange-400',
      bg:     'bg-orange-400/8',
      border: 'border-orange-400/20',
      content: (
        <div className="space-y-3">
          <Para>
            System bankowy Platformy (pożyczki VTC€, lokaty terminowe) jest narzędziem
            rozrywkowym o charakterze czysto wirtualnym. Nie stanowi oferty finansowej
            w rozumieniu prawa bankowego.
          </Para>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {[
              {
                title: 'Pożyczki',
                items: [
                  'Max kwota: 10 000 VTC€',
                  'Oprocentowanie: 8%',
                  'Termin spłaty: 30 dni',
                  'Limit: 1 aktywna pożyczka',
                  'Niespłacona → status „overdue" i wpływ na ranking',
                ],
              },
              {
                title: 'Lokaty',
                items: [
                  '7 dni: +3%',
                  '14 dni: +5%',
                  '30 dni: +8%',
                  'Wcześniejsze zerwanie: odsetki przepadają',
                  'Min. kwota: 100 VTC€',
                ],
              },
            ].map(({ title, items }) => (
              <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {title}
                </p>
                <ul className="space-y-1.5">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-zinc-500">
                      <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Para>
            Administracja zastrzega sobie prawo do zmiany warunków systemu bankowego
            (oprocentowania, limitów, dostępności) w dowolnym momencie.
          </Para>
        </div>
      ),
    },

    // ── 8. Wsparcie finansowe (Patreon)
    {
      id:     'support',
      icon:   Wifi,
      title:  '8. Dobrowolne wsparcie finansowe',
      color:  'text-red-400',
      bg:     'bg-red-400/8',
      border: 'border-red-400/20',
      content: (
        <div className="space-y-3">
          <Para>
            Wsparcie finansowe poprzez Patreon jest całkowicie dobrowolne. Środki przeznaczane
            są wyłącznie na koszty utrzymania serwerów i rozwój Platformy.
          </Para>
          <ul className="space-y-2">
            <Rule>Korzyści dla wspierających (bonus VTC€, rola Discord, badge) mają charakter wyłącznie prestiżowy i nie tworzą żadnego stosunku prawnego.</Rule>
            <Rule>Subskrypcję można anulować w dowolnym momencie przez panel Patreon. Korzyści zachowujesz do końca opłaconego okresu.</Rule>
            <Rule>Bonus VTC€ jest naliczany zgodnie z opisem na stronie wsparcia. Administracja zastrzega sobie prawo do jego zmiany z 7-dniowym wyprzedzeniem.</Rule>
            <Forbidden>Wsparcie finansowe nie daje prawa do omijania zasad Regulaminu ani wpływu na decyzje administracyjne.</Forbidden>
            <Forbidden>Zwroty płatności są regulowane wyłącznie polityką Patreon — Platforma nie przetwarza samodzielnie płatności.</Forbidden>
          </ul>
        </div>
      ),
    },

    // ── 9. Sankcje
    {
      id:     'sanctions',
      icon:   Ban,
      title:  '9. Sankcje i kary',
      color:  'text-rose-400',
      bg:     'bg-rose-400/8',
      border: 'border-rose-400/20',
      content: (
        <div className="space-y-3">
          <Para>
            Administracja stosuje gradację kar proporcjonalną do ciężkości naruszenia.
          </Para>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[360px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-500 font-semibold pb-2 pr-4">Naruszenie</th>
                  <th className="text-left text-zinc-500 font-semibold pb-2 pr-4">Pierwsza kara</th>
                  <th className="text-left text-zinc-500 font-semibold pb-2">Ponowne</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {[
                  ['Niekulturalne zachowanie',         'Ostrzeżenie',         'Wyciszenie (3 dni)'      ],
                  ['Spam / nieodpowiednie treści',     'Wyciszenie (1–7 dni)', 'Kick z VTC'             ],
                  ['Fałszywe raporty tras',            'Kick + reset VTC€',   'Permanentny ban'         ],
                  ['Nękanie / zastraszanie',           'Kick z VTC',          'Permanentny ban'         ],
                  ['Cheaty / manipulacja systemu',     'Permanentny ban',     '—'                       ],
                  ['Nieuprawniony dostęp do systemu',  'Permanentny ban',     '—'                       ],
                ].map(([violation, first, repeat]) => (
                  <tr key={violation} className="text-zinc-500">
                    <td className="py-2.5 pr-4 text-zinc-400">{violation}</td>
                    <td className="py-2.5 pr-4">{first}</td>
                    <td className="py-2.5">{repeat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubTitle>Procedura odwoławcza</SubTitle>
          <ul className="space-y-2">
            <Rule>Od każdej decyzji karnej (z wyjątkiem permanentnego banu za cheaty) przysługuje odwołanie przez ticket Discord w ciągu 7 dni od nałożenia kary.</Rule>
            <Rule>Odwołanie rozpatrują co najmniej dwaj administratorzy nie zaangażowani w pierwotną decyzję.</Rule>
            <Rule>Decyzja odwoławcza jest ostateczna.</Rule>
          </ul>
        </div>
      ),
    },

    // ── 10. Prawa i obowiązki administracji
    {
      id:     'admin',
      icon:   ShieldCheck,
      title:  '10. Prawa i obowiązki administracji',
      color:  'text-cyan-400',
      bg:     'bg-cyan-400/8',
      border: 'border-cyan-400/20',
      content: (
        <div className="space-y-3">
          <Para>
            Administracja GLos Logistics VTC zobowiązuje się do przejrzystego i
            sprawiedliwego zarządzania Platformą, z poszanowaniem wszystkich kierowców.
          </Para>
          <ul className="space-y-2">
            <Rule>Administracja ma prawo do modyfikacji Regulaminu, systemu rang, ekonomii i funkcji Platformy z zachowaniem okresu powiadomień.</Rule>
            <Rule>Administracja może zawiesić lub usunąć konto naruszające Regulamin bez obowiązku zwrotu wirtualnych zasobów.</Rule>
            <Rule>Administracja zobowiązuje się do rozpatrywania zgłoszeń i ticketów w ciągu 48 godzin (dni robocze).</Rule>
            <Rule>Decyzje administracyjne są dokumentowane wewnętrznie w logach audytowych.</Rule>
            <Forbidden>Administracja nie ma prawa do dyskryminacji kierowców ze względu na wiek, płeć, narodowość lub inne cechy osobiste.</Forbidden>
            <Forbidden>Administracja nie może korzystać z uprawnień w celach prywatnych (np. faworyzowania znajomych w rankingach).</Forbidden>
          </ul>
        </div>
      ),
    },

    // ── 11. Prywatność i dane
    {
      id:     'privacy',
      icon:   Gavel,
      title:  '11. Prywatność i ochrona danych',
      color:  'text-violet-400',
      bg:     'bg-violet-400/8',
      border: 'border-violet-400/20',
      content: (
        <div className="space-y-3">
          <Para>
            Przetwarzanie danych osobowych kierowców reguluje odrębna
            Polityka Prywatności dostępna pod adresem{' '}
            <Link
              href="/privacy"
              className="text-violet-400 hover:text-violet-300 underline
                         underline-offset-2 transition-colors"
            >
              /privacy
            </Link>
            .
          </Para>
          <ul className="space-y-2">
            <Rule>Gromadzone dane obejmują nick Discord, ID Discord, dane tras i historię aktywności na Platformie.</Rule>
            <Rule>Dane nie są udostępniane podmiotom trzecim, z wyjątkiem usług infrastrukturalnych (Supabase, Vercel) zgodnie z ich politykami prywatności.</Rule>
            <Rule>Na żądanie kierowcy administracja może usunąć jego dane osobowe. Dane anonimowe (statystyki zbiorcze) mogą być zachowane.</Rule>
            <Rule>Prawo dostępu, sprostowania i usunięcia danych możesz wykonywać pisząc na adres: <span className="text-violet-400">{CONTACT_EMAIL}</span></Rule>
          </ul>
        </div>
      ),
    },

    // ── 12. Postanowienia końcowe
    {
      id:     'final',
      icon:   Scale,
      title:  '12. Postanowienia końcowe',
      color:  'text-zinc-400',
      bg:     'bg-zinc-400/8',
      border: 'border-zinc-800',
      content: (
        <div className="space-y-3">
          <Para>
            Niniejszy Regulamin podlega prawu polskiemu. Wszelkie spory wynikające z
            korzystania z Platformy strony będą starały się rozwiązywać polubownie,
            a w razie braku porozumienia — przed sądem właściwym dla siedziby organizatora.
          </Para>
          <Para>
            W kwestiach nieuregulowanych Regulaminem zastosowanie mają przepisy
            Kodeksu Cywilnego RP oraz RODO.
          </Para>
          <Para>
            Nieważność jakiegokolwiek postanowienia Regulaminu nie wpływa na ważność
            pozostałych postanowień.
          </Para>
          <Para>
            Pytania i sugestie dotyczące Regulaminu kieruj na adres{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-amber-400 hover:text-amber-300 underline
                         underline-offset-2 transition-colors"
            >
              {CONTACT_EMAIL}
            </a>{' '}
            lub przez kanał <span className="text-amber-400">#support</span> na Discordzie.
          </Para>
        </div>
      ),
    },
  ]
}

// ─── Spis treści ───────────────────────────────────────────
function TableOfContents({ sections }: { sections: TosSection[] }) {
  return (
    <nav
      aria-label="Spis treści"
      className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5
                 sticky top-6 self-start"
    >
      <p className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-3">
        Spis treści
      </p>
      <ol className="space-y-1">
        {sections.map(s => {
          const Icon = s.icon
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg
                           text-xs text-zinc-500 hover:text-zinc-200
                           hover:bg-zinc-800/60 transition-all group"
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${s.color} opacity-70
                                  group-hover:opacity-100 transition-opacity`} />
                <span className="leading-snug">{s.title}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ─── Sekcja regulaminu ────────────────────────────────────
function TosSection({ section }: { section: TosSection }) {
  const Icon = section.icon
  return (
    <section
      id={section.id}
      aria-labelledby={`heading-${section.id}`}
      className={`rounded-2xl border p-5 sm:p-7 scroll-mt-8 ${section.bg} ${section.border}`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${section.bg} border ${section.border}`}>
          <Icon className={`w-4 h-4 ${section.color}`} />
        </div>
        <h2
          id={`heading-${section.id}`}
          className={`font-black text-base sm:text-lg ${section.color}`}
        >
          {section.title}
        </h2>
      </div>
      {section.content}
    </section>
  )
}

// ─── Główna strona ─────────────────────────────────────────
export default function TosPage() {
  const sections = buildSections()

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* ── Hero ──────────────────────────────────────── */}
        <div className="mb-10 sm:mb-14">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-6 text-xs text-zinc-600">
            <Link href="/" className="hover:text-zinc-400 transition-colors">
              Strona główna
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-zinc-500">Regulamin</span>
          </nav>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                          border border-amber-500/25 bg-amber-500/8
                          text-amber-400 text-xs font-semibold mb-4">
            <Scale className="w-3.5 h-3.5" />
            Dokument prawny
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            Regulamin GLos Logistics VTC
          </h1>
          <p className="text-base text-zinc-500 max-w-2xl leading-relaxed mb-6">
            Przeczytaj uważnie przed dołączeniem do społeczności. Korzystanie z Platformy
            oznacza akceptację wszystkich poniższych zasad.
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                            bg-zinc-900 border border-zinc-800 text-xs text-zinc-500">
              <Clock className="w-3.5 h-3.5 text-zinc-700" />
              Ostatnia aktualizacja: <span className="text-zinc-300 font-medium ml-1">{LAST_UPDATED}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                            bg-zinc-900 border border-zinc-800 text-xs text-zinc-500">
              <FileText className="w-3.5 h-3.5 text-zinc-700" />
              <span className="text-zinc-300 font-medium">{sections.length}</span> sekcji
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                            bg-green-400/8 border border-green-400/20 text-xs text-green-400 font-semibold">
              <Check className="w-3.5 h-3.5" />
              Wersja aktualna
            </div>
          </div>
        </div>

        {/* ── Alert RODO ────────────────────────────────── */}
        <div className="flex gap-3 bg-violet-400/8 border border-violet-400/20
                        rounded-2xl px-5 py-4 mb-8 sm:mb-10">
          <AlertTriangle className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-violet-300 mb-0.5">
              Platforma przetwarza dane osobowe
            </p>
            <p className="text-xs text-violet-400/70 leading-relaxed">
              Korzystając z Platformy zgadzasz się na przetwarzanie danych zgodnie z RODO.
              Szczegóły w{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-violet-300 transition-colors"
              >
                Polityce Prywatności
              </Link>
              .
            </p>
          </div>
        </div>

        {/* ── Layout: treść + spis ──────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

          {/* Treść */}
          <div className="flex-1 min-w-0 space-y-5">
            {sections.map(s => (
              <TosSection key={s.id} section={s} />
            ))}
          </div>

          {/* Spis treści — tylko desktop (sticky) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <TableOfContents sections={sections} />
          </aside>
        </div>

        {/* ── Mobilny spis treści (accordion) ──────────── */}
        <details className="lg:hidden mt-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-4
                              cursor-pointer text-sm font-bold text-zinc-400
                              list-none select-none">
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-zinc-600" />
              Szybka nawigacja
            </span>
            <ChevronRight className="w-4 h-4 transition-transform
                                     [details[open]_&]:rotate-90" />
          </summary>
          <div className="px-4 pb-4">
            <ol className="space-y-1">
              {sections.map(s => {
                const Icon = s.icon
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg
                                 text-xs text-zinc-500 hover:text-zinc-200
                                 hover:bg-zinc-800/60 transition-all"
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${s.color}`} />
                      {s.title}
                    </a>
                  </li>
                )
              })}
            </ol>
          </div>
        </details>

        {/* ── Stopka dokumentu ─────────────────────────── */}
        <footer className="mt-12 sm:mt-16 pt-8 border-t border-zinc-800/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center
                          justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-zinc-300 mb-1">
                Pytania dot. Regulaminu?
              </p>
              <p className="text-xs text-zinc-600 max-w-sm leading-relaxed">
                Skontaktuj się z administracją przez e-mail lub kanał #support na Discordzie.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs
                           font-bold text-zinc-400 bg-zinc-900 border border-zinc-800
                           hover:text-white hover:border-zinc-700 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                {CONTACT_EMAIL}
              </a>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs
                           font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white
                           transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Discord
              </a>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs
                           font-bold text-violet-400 bg-violet-400/8 border border-violet-400/20
                           hover:bg-violet-400/15 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Polityka prywatności
              </Link>
            </div>
          </div>

          <p className="text-xs text-zinc-700 mt-8 text-center">
            © {new Date().getFullYear()} GLos Logistics VTC — Dokument nie stanowi umowy w rozumieniu prawa cywilnego.
            Obowiązuje od {LAST_UPDATED}.
          </p>
        </footer>

      </div>
    </div>
  )
}