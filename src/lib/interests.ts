// Interest catalog + a curated city dataset that powers the "Pick a city"
// discovery flow. Cities are scored 0–100 across interest dimensions; the
// finder ranks them against the three interests a traveller picks.
//
// This is a hand-tuned offline dataset so the feature is fully functional
// with no external API. services/discovery.ts can later swap in a live model.

export interface Interest {
  id: string
  label: string
  icon: string
}

export const INTERESTS: Interest[] = [
  { id: 'beaches', label: 'Beaches', icon: '🏖️' },
  { id: 'food', label: 'Food & drink', icon: '🍜' },
  { id: 'history', label: 'History', icon: '🏛️' },
  { id: 'art', label: 'Art & museums', icon: '🎨' },
  { id: 'nature', label: 'Nature & scenery', icon: '🏔️' },
  { id: 'adventure', label: 'Adventure', icon: '🧗' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'architecture', label: 'Architecture', icon: '🏰' },
  { id: 'romance', label: 'Romance', icon: '💞' },
  { id: 'wellness', label: 'Wellness & spas', icon: '🧘' },
  { id: 'culture', label: 'Local culture', icon: '🎭' },
]

export function interestLabel(id: string): string {
  return INTERESTS.find((i) => i.id === id)?.label ?? id
}

export function interestIcon(id: string): string {
  return INTERESTS.find((i) => i.id === id)?.icon ?? '•'
}

type Scores = Partial<Record<string, number>>

export interface City {
  city: string
  countryCode: string
  blurb: string
  costTier: 1 | 2 | 3 // $, $$, $$$
  scores: Scores
}

export interface Country {
  code: string
  name: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
]

export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code
}

export function countryFlag(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.flag ?? '📍'
}

// ---- City dataset -----------------------------------------------------------

const CITIES: City[] = [
  // France
  { city: 'Paris', countryCode: 'FR', costTier: 3, blurb: 'Boulevards, grand museums, and candle-lit bistros.', scores: { art: 95, romance: 95, food: 88, architecture: 92, shopping: 88, history: 85, nightlife: 75, culture: 80 } },
  { city: 'Nice', countryCode: 'FR', costTier: 3, blurb: 'Riviera promenades and turquoise Mediterranean coves.', scores: { beaches: 88, romance: 82, food: 78, wellness: 70, nightlife: 65 } },
  { city: 'Lyon', countryCode: 'FR', costTier: 2, blurb: 'France’s gastronomic capital, old-town alleys and bouchons.', scores: { food: 95, history: 78, architecture: 75, culture: 72 } },
  { city: 'Chamonix', countryCode: 'FR', costTier: 2, blurb: 'Alpine basecamp beneath Mont Blanc.', scores: { nature: 95, adventure: 92, wellness: 60 } },

  // Italy
  { city: 'Rome', countryCode: 'IT', costTier: 2, blurb: 'Ancient ruins, baroque squares, and trattoria nights.', scores: { history: 98, architecture: 92, food: 88, art: 85, culture: 82, romance: 78 } },
  { city: 'Florence', countryCode: 'IT', costTier: 2, blurb: 'Renaissance art and Tuscan hillside light.', scores: { art: 96, history: 88, architecture: 88, romance: 82, food: 80, shopping: 72 } },
  { city: 'Venice', countryCode: 'IT', costTier: 3, blurb: 'Canal mornings and gondola-laced romance.', scores: { romance: 96, architecture: 90, art: 80, history: 82, culture: 75 } },
  { city: 'Amalfi', countryCode: 'IT', costTier: 3, blurb: 'Cliffside lemon groves over the Tyrrhenian Sea.', scores: { beaches: 88, romance: 90, wellness: 72, food: 82, nature: 78 } },
  { city: 'Milan', countryCode: 'IT', costTier: 3, blurb: 'Fashion ateliers, aperitivo bars, design districts.', scores: { shopping: 95, nightlife: 82, art: 78, food: 80, architecture: 75 } },

  // Spain
  { city: 'Barcelona', countryCode: 'ES', costTier: 2, blurb: 'Gaudí surrealism, tapas crawls, and city beaches.', scores: { architecture: 95, beaches: 78, nightlife: 88, food: 85, art: 82, culture: 80 } },
  { city: 'Madrid', countryCode: 'ES', costTier: 2, blurb: 'World-class art, late nights, and grand plazas.', scores: { art: 90, nightlife: 90, food: 84, history: 78, shopping: 78, culture: 80 } },
  { city: 'Seville', countryCode: 'ES', costTier: 2, blurb: 'Flamenco courtyards and Moorish palaces.', scores: { culture: 92, history: 85, architecture: 86, romance: 80, food: 78 } },
  { city: 'San Sebastián', countryCode: 'ES', costTier: 2, blurb: 'Pintxos bars on a perfect crescent bay.', scores: { food: 96, beaches: 82, wellness: 70 } },

  // Portugal
  { city: 'Lisbon', countryCode: 'PT', costTier: 2, blurb: 'Tiled hills, fado, and golden light over the Tagus.', scores: { culture: 88, food: 85, nightlife: 82, history: 80, architecture: 80, beaches: 65 } },
  { city: 'Porto', countryCode: 'PT', costTier: 1, blurb: 'Riverside port-wine cellars and azulejo facades.', scores: { food: 86, culture: 82, romance: 78, architecture: 80, history: 75 } },
  { city: 'Lagos', countryCode: 'PT', costTier: 1, blurb: 'Golden cliffs and grottoes on the Algarve.', scores: { beaches: 94, nature: 80, adventure: 72, nightlife: 68 } },

  // Greece
  { city: 'Santorini', countryCode: 'GR', costTier: 3, blurb: 'Whitewashed caldera villages and sunset cliffs.', scores: { romance: 96, beaches: 80, wellness: 78, food: 75 } },
  { city: 'Athens', countryCode: 'GR', costTier: 2, blurb: 'The Acropolis above a buzzing modern capital.', scores: { history: 96, architecture: 88, culture: 80, food: 78, nightlife: 72 } },
  { city: 'Crete', countryCode: 'GR', costTier: 2, blurb: 'Wild gorges, ruins, and long sandy beaches.', scores: { beaches: 90, nature: 85, adventure: 78, history: 75, food: 78 } },

  // Germany
  { city: 'Berlin', countryCode: 'DE', costTier: 2, blurb: 'Underground clubs, galleries, and living history.', scores: { nightlife: 96, art: 88, culture: 85, history: 84, shopping: 72 } },
  { city: 'Munich', countryCode: 'DE', costTier: 2, blurb: 'Beer halls, baroque churches, and the Alps nearby.', scores: { culture: 82, food: 78, history: 78, architecture: 78, nature: 70 } },

  // UK
  { city: 'London', countryCode: 'GB', costTier: 3, blurb: 'Free museums, theatre, markets, and global food.', scores: { art: 92, history: 88, shopping: 90, nightlife: 85, culture: 88, food: 82 } },
  { city: 'Edinburgh', countryCode: 'GB', costTier: 2, blurb: 'A medieval skyline and misty Highland gateways.', scores: { history: 90, architecture: 85, culture: 82, nature: 75, romance: 72 } },

  // Netherlands
  { city: 'Amsterdam', countryCode: 'NL', costTier: 3, blurb: 'Canal rings, masters’ art, and bike-friendly nights.', scores: { art: 90, nightlife: 86, architecture: 82, culture: 82, romance: 75, shopping: 72 } },

  // Switzerland
  { city: 'Interlaken', countryCode: 'CH', costTier: 3, blurb: 'Paragliding and peaks between two alpine lakes.', scores: { nature: 96, adventure: 95, wellness: 72 } },
  { city: 'Lucerne', countryCode: 'CH', costTier: 3, blurb: 'A storybook lake town under snowcapped peaks.', scores: { nature: 90, romance: 82, architecture: 78, wellness: 75 } },

  // Czech Republic
  { city: 'Prague', countryCode: 'CZ', costTier: 1, blurb: 'Gothic spires, beer gardens, and cobbled romance.', scores: { architecture: 92, history: 88, romance: 82, nightlife: 80, food: 72, culture: 78 } },

  // Croatia
  { city: 'Dubrovnik', countryCode: 'HR', costTier: 2, blurb: 'Walled old town above the glittering Adriatic.', scores: { history: 88, beaches: 82, architecture: 85, romance: 80, nature: 75 } },
  { city: 'Split', countryCode: 'HR', costTier: 2, blurb: 'A Roman palace city and island-hopping hub.', scores: { history: 84, beaches: 84, nightlife: 75, adventure: 72 } },

  // Iceland
  { city: 'Reykjavík', countryCode: 'IS', costTier: 3, blurb: 'Geothermal lagoons, auroras, and volcanic road trips.', scores: { nature: 98, adventure: 90, wellness: 85 } },

  // Turkey
  { city: 'Istanbul', countryCode: 'TR', costTier: 1, blurb: 'Where continents, bazaars, and empires meet.', scores: { history: 95, culture: 92, food: 88, architecture: 90, shopping: 85 } },
  { city: 'Cappadocia', countryCode: 'TR', costTier: 1, blurb: 'Balloon-dotted dawns over fairy-chimney valleys.', scores: { adventure: 88, nature: 88, romance: 88, history: 78 } },

  // Morocco
  { city: 'Marrakech', countryCode: 'MA', costTier: 1, blurb: 'Souks, riads, and spice-scented medina nights.', scores: { culture: 92, shopping: 90, food: 82, architecture: 82, wellness: 75 } },
  { city: 'Fes', countryCode: 'MA', costTier: 1, blurb: 'The world’s great living medieval medina.', scores: { culture: 90, history: 88, shopping: 82, architecture: 80 } },

  // Japan
  { city: 'Tokyo', countryCode: 'JP', costTier: 3, blurb: 'Neon districts, temples, and the planet’s best food scene.', scores: { food: 96, shopping: 92, nightlife: 90, culture: 88, art: 80 } },
  { city: 'Kyoto', countryCode: 'JP', costTier: 2, blurb: 'Zen gardens, geisha lanes, and golden temples.', scores: { culture: 96, history: 92, wellness: 82, romance: 80, architecture: 85 } },
  { city: 'Hakone', countryCode: 'JP', costTier: 2, blurb: 'Hot-spring ryokans with Mt. Fuji views.', scores: { wellness: 95, nature: 85, romance: 80 } },

  // Thailand
  { city: 'Bangkok', countryCode: 'TH', costTier: 1, blurb: 'Street-food temples and electric night markets.', scores: { food: 92, nightlife: 90, shopping: 88, culture: 82, history: 72 } },
  { city: 'Chiang Mai', countryCode: 'TH', costTier: 1, blurb: 'Mountain temples, lantern festivals, and jungle treks.', scores: { culture: 90, nature: 82, wellness: 85, adventure: 78, food: 82 } },
  { city: 'Phuket', countryCode: 'TH', costTier: 1, blurb: 'Andaman beaches and limestone-island day trips.', scores: { beaches: 94, nightlife: 82, wellness: 80, adventure: 72 } },

  // Vietnam
  { city: 'Hanoi', countryCode: 'VN', costTier: 1, blurb: 'Old-quarter chaos, lake-side calm, and pho dawns.', scores: { food: 90, culture: 88, history: 82, shopping: 75 } },
  { city: 'Hoi An', countryCode: 'VN', costTier: 1, blurb: 'Lantern-lit riverside tailoring and beaches.', scores: { culture: 88, romance: 85, food: 84, beaches: 75, shopping: 80 } },

  // Indonesia
  { city: 'Bali', countryCode: 'ID', costTier: 1, blurb: 'Rice-terrace temples, surf, and wellness retreats.', scores: { wellness: 95, beaches: 88, nature: 85, culture: 82, adventure: 75, romance: 80 } },

  // India
  { city: 'Jaipur', countryCode: 'IN', costTier: 1, blurb: 'Pink-city palaces, forts, and bazaars.', scores: { history: 92, culture: 92, architecture: 90, shopping: 85, food: 80 } },
  { city: 'Goa', countryCode: 'IN', costTier: 1, blurb: 'Palm-fringed beaches and Portuguese-era charm.', scores: { beaches: 90, nightlife: 82, wellness: 75, food: 78 } },

  // UAE
  { city: 'Dubai', countryCode: 'AE', costTier: 3, blurb: 'Sky-high architecture, desert safaris, and mega-malls.', scores: { shopping: 96, architecture: 90, nightlife: 82, adventure: 78, beaches: 75, wellness: 78 } },

  // USA
  { city: 'New York', countryCode: 'US', costTier: 3, blurb: 'Museums, Broadway, and a 24-hour appetite.', scores: { art: 92, shopping: 92, nightlife: 92, food: 90, culture: 90 } },
  { city: 'San Francisco', countryCode: 'US', costTier: 3, blurb: 'Bay fog, hills, and gateway to wine country.', scores: { food: 86, nature: 80, culture: 80, art: 78 } },
  { city: 'New Orleans', countryCode: 'US', costTier: 2, blurb: 'Jazz, Creole kitchens, and French Quarter nights.', scores: { nightlife: 92, food: 90, culture: 92, history: 80 } },
  { city: 'Honolulu', countryCode: 'US', costTier: 3, blurb: 'Surf breaks, volcanoes, and Pacific sunsets.', scores: { beaches: 95, nature: 85, adventure: 80, wellness: 78 } },

  // Mexico
  { city: 'Mexico City', countryCode: 'MX', costTier: 1, blurb: 'Murals, markets, and a thunderous food scene.', scores: { food: 92, culture: 90, art: 88, history: 85, nightlife: 80 } },
  { city: 'Tulum', countryCode: 'MX', costTier: 2, blurb: 'Cenotes, Maya ruins, and barefoot beach clubs.', scores: { beaches: 92, wellness: 88, romance: 82, adventure: 75, nightlife: 75 } },
  { city: 'Oaxaca', countryCode: 'MX', costTier: 1, blurb: 'Mezcal, mole, and vivid craft traditions.', scores: { food: 94, culture: 92, art: 82, history: 78 } },

  // Peru
  { city: 'Cusco', countryCode: 'PE', costTier: 1, blurb: 'Inca capital and the trailhead to Machu Picchu.', scores: { history: 95, adventure: 88, culture: 88, nature: 82 } },
  { city: 'Lima', countryCode: 'PE', costTier: 1, blurb: 'Cliff-top dining capital of South America.', scores: { food: 95, culture: 80, art: 75, nightlife: 75 } },

  // Brazil
  { city: 'Rio de Janeiro', countryCode: 'BR', costTier: 2, blurb: 'Beaches, mountains, and samba between them.', scores: { beaches: 92, nightlife: 90, nature: 85, adventure: 80, culture: 82 } },

  // Australia
  { city: 'Sydney', countryCode: 'AU', costTier: 3, blurb: 'Harbour icons, surf beaches, and coastal walks.', scores: { beaches: 88, nature: 80, food: 82, nightlife: 80, architecture: 78 } },
  { city: 'Cairns', countryCode: 'AU', costTier: 2, blurb: 'Gateway to the Great Barrier Reef and rainforest.', scores: { nature: 92, adventure: 90, beaches: 80, wellness: 70 } },
]

export interface CityMatch extends City {
  matchScore: number // 0–100
  matchedInterests: string[] // interest ids this city is strong in
}

// Rank a country's cities against up to three chosen interests.
// Score = average of the city's scores for the selected interests
// (missing dimensions count as a low baseline so off-theme cities sink).
export function findCities(countryCode: string, interests: string[]): CityMatch[] {
  const pool = CITIES.filter((c) => c.countryCode === countryCode)
  const picks = interests.slice(0, 3)
  if (picks.length === 0) return []

  return pool
    .map((c) => {
      const raw = picks.map((i) => c.scores[i] ?? 25)
      const avg = raw.reduce((a, b) => a + b, 0) / picks.length
      const matched = picks.filter((i) => (c.scores[i] ?? 0) >= 70)
      return { ...c, matchScore: Math.round(avg), matchedInterests: matched }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function hasCitiesFor(countryCode: string): boolean {
  return CITIES.some((c) => c.countryCode === countryCode)
}
