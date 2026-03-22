export interface ETS2City {
  name:    string
  country: string
  flag:    string
}

export const ETS2_CITIES: ETS2City[] = [
  // Polska
  { name: 'Warszawa',     country: 'Polska',      flag: '🇵🇱' },
  { name: 'Kraków',       country: 'Polska',      flag: '🇵🇱' },
  { name: 'Gdańsk',       country: 'Polska',      flag: '🇵🇱' },
  { name: 'Poznań',       country: 'Polska',      flag: '🇵🇱' },
  { name: 'Wrocław',      country: 'Polska',      flag: '🇵🇱' },
  { name: 'Łódź',         country: 'Polska',      flag: '🇵🇱' },
  { name: 'Szczecin',     country: 'Polska',      flag: '🇵🇱' },
  { name: 'Lublin',       country: 'Polska',      flag: '🇵🇱' },
  { name: 'Białystok',    country: 'Polska',      flag: '🇵🇱' },
  { name: 'Rzeszów',      country: 'Polska',      flag: '🇵🇱' },
  // Niemcy
  { name: 'Berlin',       country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Hamburg',      country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'München',      country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Köln',         country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Frankfurt',    country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Stuttgart',    country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Dortmund',     country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Düsseldorf',   country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Hannover',     country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Dresden',      country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Leipzig',      country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Nürnberg',     country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Rostock',      country: 'Niemcy',      flag: '🇩🇪' },
  { name: 'Mannheim',     country: 'Niemcy',      flag: '🇩🇪' },
  // Czechy
  { name: 'Praha',        country: 'Czechy',      flag: '🇨🇿' },
  { name: 'Brno',         country: 'Czechy',      flag: '🇨🇿' },
  { name: 'Ostrava',      country: 'Czechy',      flag: '🇨🇿' },
  { name: 'Plzeň',        country: 'Czechy',      flag: '🇨🇿' },
  // Austria
  { name: 'Wien',         country: 'Austria',     flag: '🇦🇹' },
  { name: 'Graz',         country: 'Austria',     flag: '🇦🇹' },
  { name: 'Salzburg',     country: 'Austria',     flag: '🇦🇹' },
  { name: 'Innsbruck',    country: 'Austria',     flag: '🇦🇹' },
  // Francja
  { name: 'Paris',        country: 'Francja',     flag: '🇫🇷' },
  { name: 'Lyon',         country: 'Francja',     flag: '🇫🇷' },
  { name: 'Marseille',    country: 'Francja',     flag: '🇫🇷' },
  { name: 'Strasbourg',   country: 'Francja',     flag: '🇫🇷' },
  { name: 'Calais',       country: 'Francja',     flag: '🇫🇷' },
  { name: 'Bordeaux',     country: 'Francja',     flag: '🇫🇷' },
  { name: 'Toulouse',     country: 'Francja',     flag: '🇫🇷' },
  { name: 'Lille',        country: 'Francja',     flag: '🇫🇷' },
  // Holandia
  { name: 'Amsterdam',    country: 'Holandia',    flag: '🇳🇱' },
  { name: 'Rotterdam',    country: 'Holandia',    flag: '🇳🇱' },
  { name: 'Utrecht',      country: 'Holandia',    flag: '🇳🇱' },
  // Belgia
  { name: 'Bruxelles',    country: 'Belgia',      flag: '🇧🇪' },
  { name: 'Liège',        country: 'Belgia',      flag: '🇧🇪' },
  { name: 'Antwerpen',    country: 'Belgia',      flag: '🇧🇪' },
  // UK
  { name: 'London',       country: 'UK',          flag: '🇬🇧' },
  { name: 'Birmingham',   country: 'UK',          flag: '🇬🇧' },
  { name: 'Manchester',   country: 'UK',          flag: '🇬🇧' },
  { name: 'Edinburgh',    country: 'UK',          flag: '🇬🇧' },
  { name: 'Glasgow',      country: 'UK',          flag: '🇬🇧' },
  { name: 'Bristol',      country: 'UK',          flag: '🇬🇧' },
  { name: 'Liverpool',    country: 'UK',          flag: '🇬🇧' },
  { name: 'Cardiff',      country: 'UK',          flag: '🇬🇧' },
  // Szwecja
  { name: 'Stockholm',    country: 'Szwecja',     flag: '🇸🇪' },
  { name: 'Göteborg',     country: 'Szwecja',     flag: '🇸🇪' },
  { name: 'Malmö',        country: 'Szwecja',     flag: '🇸🇪' },
  { name: 'Örebro',       country: 'Szwecja',     flag: '🇸🇪' },
  // Norwegia
  { name: 'Oslo',         country: 'Norwegia',    flag: '🇳🇴' },
  { name: 'Bergen',       country: 'Norwegia',    flag: '🇳🇴' },
  { name: 'Stavanger',    country: 'Norwegia',    flag: '🇳🇴' },
  // Dania
  { name: 'København',    country: 'Dania',       flag: '🇩🇰' },
  { name: 'Odense',       country: 'Dania',       flag: '🇩🇰' },
  { name: 'Esbjerg',      country: 'Dania',       flag: '🇩🇰' },
  // Finlandia
  { name: 'Helsinki',     country: 'Finlandia',   flag: '🇫🇮' },
  { name: 'Tampere',      country: 'Finlandia',   flag: '🇫🇮' },
  { name: 'Turku',        country: 'Finlandia',   flag: '🇫🇮' },
  // Kraje Bałtyckie
  { name: 'Tallinn',      country: 'Estonia',     flag: '🇪🇪' },
  { name: 'Riga',         country: 'Łotwa',       flag: '🇱🇻' },
  { name: 'Vilnius',      country: 'Litwa',       flag: '🇱🇹' },
  // Szwajcaria
  { name: 'Zürich',       country: 'Szwajcaria',  flag: '🇨🇭' },
  { name: 'Bern',         country: 'Szwajcaria',  flag: '🇨🇭' },
  { name: 'Basel',        country: 'Szwajcaria',  flag: '🇨🇭' },
  // Włochy
  { name: 'Milano',       country: 'Włochy',      flag: '🇮🇹' },
  { name: 'Roma',         country: 'Włochy',      flag: '🇮🇹' },
  { name: 'Torino',       country: 'Włochy',      flag: '🇮🇹' },
  { name: 'Venezia',      country: 'Włochy',      flag: '🇮🇹' },
  { name: 'Napoli',       country: 'Włochy',      flag: '🇮🇹' },
  { name: 'Bologna',      country: 'Włochy',      flag: '🇮🇹' },
  // Hiszpania
  { name: 'Madrid',       country: 'Hiszpania',   flag: '🇪🇸' },
  { name: 'Barcelona',    country: 'Hiszpania',   flag: '🇪🇸' },
  { name: 'Valencia',     country: 'Hiszpania',   flag: '🇪🇸' },
  { name: 'Bilbao',       country: 'Hiszpania',   flag: '🇪🇸' },
  { name: 'Sevilla',      country: 'Hiszpania',   flag: '🇪🇸' },
  // Portugalia
  { name: 'Lisboa',       country: 'Portugalia',  flag: '🇵🇹' },
  { name: 'Porto',        country: 'Portugalia',  flag: '🇵🇹' },
  // Węgry
  { name: 'Budapest',     country: 'Węgry',       flag: '🇭🇺' },
  { name: 'Debrecen',     country: 'Węgry',       flag: '🇭🇺' },
  // Rumunia
  { name: 'București',    country: 'Rumunia',     flag: '🇷🇴' },
  { name: 'Cluj-Napoca',  country: 'Rumunia',     flag: '🇷🇴' },
  { name: 'Constanța',    country: 'Rumunia',     flag: '🇷🇴' },
  // Bułgaria
  { name: 'Sofia',        country: 'Bułgaria',    flag: '🇧🇬' },
  // Grecja
  { name: 'Athína',       country: 'Grecja',      flag: '🇬🇷' },
  { name: 'Thessaloníki', country: 'Grecja',      flag: '🇬🇷' },
  // Rosja
  { name: 'Moskva',       country: 'Rosja',       flag: '🇷🇺' },
  { name: 'Sankt-Peterburg', country: 'Rosja',    flag: '🇷🇺' },
  { name: 'Kaliningrad',  country: 'Rosja',       flag: '🇷🇺' },
  // Ukraina
  { name: 'Kyiv',         country: 'Ukraina',     flag: '🇺🇦' },
  { name: 'Lviv',         country: 'Ukraina',     flag: '🇺🇦' },
  // Turcja
  { name: 'İstanbul',     country: 'Turcja',      flag: '🇹🇷' },
  { name: 'Ankara',       country: 'Turcja',      flag: '🇹🇷' },
]

export const ETS2_CARGO: { name: string; category: string; weight: number; trailer: string }[] = [
  // Płyny / Chemia
  { name: 'Paliwo',              category: 'Płyny',     weight: 25, trailer: 'Cysterna paliwowa'     },
  { name: 'Mleko',               category: 'Płyny',     weight: 20, trailer: 'Cysterna spożywcza'    },
  { name: 'Cement',              category: 'Masowy',    weight: 27, trailer: 'Silos'                 },
  { name: 'Kwas siarkowy',       category: 'Chemia',    weight: 22, trailer: 'Cysterna chemiczna'    },
  // Spożywcze
  { name: 'Mrożona żywność',     category: 'Chłodnia',  weight: 18, trailer: 'Chłodnia'              },
  { name: 'Mięso',               category: 'Chłodnia',  weight: 20, trailer: 'Chłodnia'              },
  { name: 'Owoce i warzywa',     category: 'Chłodnia',  weight: 15, trailer: 'Chłodnia'              },
  { name: 'Lody',                category: 'Chłodnia',  weight: 14, trailer: 'Chłodnia'              },
  { name: 'Piwo',                category: 'Spożywcze', weight: 22, trailer: 'Firanka'               },
  { name: 'Wino',                category: 'Spożywcze', weight: 20, trailer: 'Firanka'               },
  // Przemysłowe
  { name: 'Stal w rolkach',      category: 'Przemysł',  weight: 27, trailer: 'Platforma'             },
  { name: 'Rury stalowe',        category: 'Przemysł',  weight: 24, trailer: 'Platforma'             },
  { name: 'Kable przemysłowe',   category: 'Przemysł',  weight: 34, trailer: 'Niskopodłogowa'        },
  { name: 'Silniki',             category: 'Przemysł',  weight: 20, trailer: 'Firanka'               },
  { name: 'Części maszyn',       category: 'Przemysł',  weight: 18, trailer: 'Firanka'               },
  { name: 'Profile aluminiowe',  category: 'Przemysł',  weight: 22, trailer: 'Platforma'             },
  // Budowlane
  { name: 'Materiały budowlane', category: 'Budowlane', weight: 25, trailer: 'Firanka'               },
  { name: 'Cegły',               category: 'Budowlane', weight: 20, trailer: 'Platforma (cegły)'     },
  { name: 'Drewno',              category: 'Budowlane', weight: 24, trailer: 'Przyczepa kłodowa'     },
  { name: 'Beton prefabrykowany',category: 'Budowlane', weight: 26, trailer: 'Platforma'             },
  // Elektronika
  { name: 'Elektronika użytkowa',category: 'Elektronika',weight:16, trailer: 'Firanka'              },
  { name: 'Sprzęt AGD',          category: 'Elektronika',weight:18, trailer: 'Firanka'              },
  { name: 'Serwery',             category: 'Elektronika',weight:12, trailer: 'Firanka'              },
  // Motoryzacja
  { name: 'Samochody osobowe',   category: 'Auto',      weight: 16, trailer: 'Laweta'                },
  { name: 'Maszyny rolnicze',    category: 'Ponadgab.', weight: 35, trailer: 'Niskopodłogowa'        },
  { name: 'Koparki',             category: 'Ponadgab.', weight: 39, trailer: 'Rozciągliwa platforma' },
  // Medyczne
  { name: 'Sprzęt medyczny',     category: 'Medyczne',  weight: 12, trailer: 'Firanka'               },
  { name: 'Odpad medyczny',      category: 'Medyczne',  weight: 8,  trailer: 'Kontener'              },
  // Inne
  { name: 'Meble',               category: 'Inne',      weight: 14, trailer: 'Firanka'               },
  { name: 'Papier',              category: 'Inne',      weight: 22, trailer: 'Firanka'               },
  { name: 'Amunicja',            category: 'Wojskowe',  weight: 20, trailer: 'Firanka'               },
]

export const ETS2_TRUCKS = [
  { brand: 'DAF',       model: 'XF105'     },
  { brand: 'DAF',       model: 'XF Euro 6' },
  { brand: 'DAF',       model: 'XG'        },
  { brand: 'DAF',       model: 'XG+'       },
  { brand: 'DAF',       model: 'XD'        },
  { brand: 'Iveco',     model: 'Stralis'   },
  { brand: 'Iveco',     model: 'Hi-Way'    },
  { brand: 'Iveco',     model: 'S-Way'     },
  { brand: 'MAN',       model: 'TGX Euro 5'},
  { brand: 'MAN',       model: 'TGX Euro 6'},
  { brand: 'MAN',       model: 'TGX 2020'  },
  { brand: 'Mercedes',  model: 'Actros MP3'},
  { brand: 'Mercedes',  model: 'Actros MP4'},
  { brand: 'Mercedes',  model: 'New Actros'},
  { brand: 'Renault',   model: 'Magnum'    },
  { brand: 'Renault',   model: 'Premium'   },
  { brand: 'Renault',   model: 'T'         },
  { brand: 'Scania',    model: 'R Series'  },
  { brand: 'Scania',    model: 'S Series'  },
  { brand: 'Scania',    model: 'Next Gen R'},
  { brand: 'Scania',    model: 'Next Gen S'},
  { brand: 'Volvo',     model: 'FH Classic'},
  { brand: 'Volvo',     model: 'FH16'      },
  { brand: 'Volvo',     model: 'FH Series 3'},
  { brand: 'Volvo',     model: 'FH5'       },
]

export const ETS2_SERVERS = ['EU1', 'EU2', 'EU3 Arcade', 'US', 'Asia']

export const PRIORITY_CONFIG = {
  low:    { label: 'Niski',    color: 'text-zinc-400',  bg: 'bg-zinc-400/10  border-zinc-400/20',  pay: 0.8  },
  normal: { label: 'Normalny', color: 'text-blue-400',  bg: 'bg-blue-400/10  border-blue-400/20',  pay: 1.0  },
  high:   { label: 'Wysoki',   color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', pay: 1.3  },
  urgent: { label: 'Pilny',    color: 'text-red-400',   bg: 'bg-red-400/10   border-red-400/20',   pay: 1.7  },
} as const

export const STATUS_CONFIG = {
  open:        { label: 'Dostępne',   color: 'text-green-400',  bg: 'bg-green-400/10  border-green-400/20'  },
  taken:       { label: 'Zajęte',     color: 'text-amber-400',  bg: 'bg-amber-400/10  border-amber-400/20'  },
  in_progress: { label: 'W trakcie',  color: 'text-blue-400',   bg: 'bg-blue-400/10   border-blue-400/20'   },
  completed:   { label: 'Ukończone',  color: 'text-zinc-400',   bg: 'bg-zinc-400/10   border-zinc-400/20'   },
  cancelled:   { label: 'Anulowane',  color: 'text-red-400',    bg: 'bg-red-400/10    border-red-400/20'    },
} as const

// Szacowanie odległości (uproszczone ale realistyczne)
export function estimateDistance(from: string, to: string): number {
  // Bazowa odległość losowa 100-2500 km (w pełnej wersji użyj prawdziwej tabeli)
  const hash = (from + to).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return 100 + (hash % 2400)
}

// Szacowanie wynagrodzenia
export function estimatePay(distanceKm: number, weightT: number, priority: keyof typeof PRIORITY_CONFIG): number {
  const base = distanceKm * 2.5 + weightT * 50
  return Math.round(base * PRIORITY_CONFIG[priority].pay / 100) * 100
}
