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

  // ---- Expanded atlas: more cities, including lesser-known gems ----

  // France
  { city: 'Bordeaux', countryCode: 'FR', costTier: 2, blurb: 'Wine country elegance and 18th-century stone facades.', scores: { food: 90, architecture: 80, culture: 75, history: 74, romance: 72 } },
  { city: 'Strasbourg', countryCode: 'FR', costTier: 2, blurb: 'Half-timbered lanes where France meets Germany.', scores: { architecture: 86, history: 80, romance: 76, culture: 74, food: 76 } },
  { city: 'Annecy', countryCode: 'FR', costTier: 2, blurb: 'A canal-laced “Alpine Venice” on a turquoise lake.', scores: { nature: 88, romance: 84, wellness: 70, adventure: 66 } },
  { city: 'Colmar', countryCode: 'FR', costTier: 2, blurb: 'Storybook Alsace canals and flower-decked houses.', scores: { romance: 86, architecture: 84, food: 74, culture: 70 } },

  // Italy
  { city: 'Bologna', countryCode: 'IT', costTier: 2, blurb: 'Porticoed streets and Italy’s richest food tradition.', scores: { food: 96, history: 80, architecture: 80, culture: 80, nightlife: 72 } },
  { city: 'Naples', countryCode: 'IT', costTier: 1, blurb: 'Raucous, soulful birthplace of pizza beside Vesuvius.', scores: { food: 94, history: 86, culture: 88, art: 76 } },
  { city: 'Verona', countryCode: 'IT', costTier: 2, blurb: 'Roman arena and the city of Romeo & Juliet.', scores: { romance: 90, history: 84, architecture: 82, culture: 74 } },
  { city: 'Palermo', countryCode: 'IT', costTier: 1, blurb: 'Sicilian markets, mosaics, and layered empires.', scores: { food: 90, culture: 88, history: 86, architecture: 82 } },
  { city: 'Turin', countryCode: 'IT', costTier: 2, blurb: 'Baroque arcades, chocolate cafés, and Alpine views.', scores: { architecture: 84, art: 80, food: 82, history: 76, culture: 74 } },

  // Spain
  { city: 'Granada', countryCode: 'ES', costTier: 1, blurb: 'The Alhambra crowning Moorish Andalusia.', scores: { history: 92, architecture: 92, culture: 84, food: 78, romance: 76 } },
  { city: 'Valencia', countryCode: 'ES', costTier: 2, blurb: 'Futuristic architecture, paella, and city beaches.', scores: { architecture: 84, food: 86, beaches: 78, culture: 76, nightlife: 74 } },
  { city: 'Bilbao', countryCode: 'ES', costTier: 2, blurb: 'The Guggenheim and Basque pintxos reinvention.', scores: { art: 90, food: 88, architecture: 82, culture: 78 } },
  { city: 'Málaga', countryCode: 'ES', costTier: 2, blurb: 'Costa del Sol beaches and Picasso’s birthplace.', scores: { beaches: 86, art: 80, food: 78, culture: 74, nightlife: 74 } },

  // Portugal
  { city: 'Sintra', countryCode: 'PT', costTier: 2, blurb: 'Fairytale palaces in misty forested hills.', scores: { romance: 86, history: 84, architecture: 86, nature: 78 } },
  { city: 'Funchal', countryCode: 'PT', costTier: 2, blurb: 'Madeira’s flower-filled island capital.', scores: { nature: 88, wellness: 78, food: 76, beaches: 66 } },
  { city: 'Coimbra', countryCode: 'PT', costTier: 1, blurb: 'A medieval university town above the Mondego.', scores: { history: 84, culture: 82, architecture: 78 } },

  // Greece
  { city: 'Mykonos', countryCode: 'GR', costTier: 3, blurb: 'Whitewashed windmills and the Aegean’s party island.', scores: { nightlife: 92, beaches: 86, romance: 76, food: 74 } },
  { city: 'Naxos', countryCode: 'GR', costTier: 1, blurb: 'Long sandy beaches and unspoiled mountain villages.', scores: { beaches: 88, nature: 80, food: 78, culture: 72 } },
  { city: 'Thessaloniki', countryCode: 'GR', costTier: 1, blurb: 'Byzantine walls and Greece’s liveliest food scene.', scores: { food: 88, nightlife: 84, culture: 82, history: 80 } },

  // Germany
  { city: 'Hamburg', countryCode: 'DE', costTier: 2, blurb: 'Harbour warehouses, canals, and the Reeperbahn.', scores: { nightlife: 86, culture: 80, architecture: 78, food: 74 } },
  { city: 'Dresden', countryCode: 'DE', costTier: 1, blurb: 'Rebuilt baroque splendour on the Elbe.', scores: { architecture: 88, art: 84, history: 84, culture: 76 } },
  { city: 'Heidelberg', countryCode: 'DE', costTier: 2, blurb: 'A romantic castle above a riverside old town.', scores: { romance: 84, history: 82, architecture: 80, culture: 72 } },

  // UK
  { city: 'Bath', countryCode: 'GB', costTier: 2, blurb: 'Georgian crescents and steaming Roman baths.', scores: { history: 88, architecture: 88, wellness: 76, romance: 74 } },
  { city: 'Glasgow', countryCode: 'GB', costTier: 2, blurb: 'Victorian grandeur and a roaring music scene.', scores: { nightlife: 86, culture: 84, art: 80, food: 76 } },
  { city: 'York', countryCode: 'GB', costTier: 2, blurb: 'Medieval walls, snickelways, and a great minster.', scores: { history: 90, architecture: 82, culture: 74 } },

  // Netherlands
  { city: 'Rotterdam', countryCode: 'NL', costTier: 2, blurb: 'Bold modern architecture and a buzzing harbour.', scores: { architecture: 88, art: 78, nightlife: 78, culture: 74 } },
  { city: 'Utrecht', countryCode: 'NL', costTier: 2, blurb: 'Canal-wharf cafés with a relaxed student soul.', scores: { culture: 80, romance: 74, food: 74, architecture: 76 } },

  // Switzerland
  { city: 'Zermatt', countryCode: 'CH', costTier: 3, blurb: 'Car-free skiing beneath the Matterhorn.', scores: { nature: 94, adventure: 92, wellness: 74, romance: 72 } },
  { city: 'Zurich', countryCode: 'CH', costTier: 3, blurb: 'Lakeside finance city with an arty, lively edge.', scores: { shopping: 86, food: 80, art: 78, nightlife: 74 } },

  // Czech Republic
  { city: 'Český Krumlov', countryCode: 'CZ', costTier: 1, blurb: 'A river-looped medieval town under a grand castle.', scores: { romance: 86, history: 86, architecture: 88, culture: 74 } },
  { city: 'Brno', countryCode: 'CZ', costTier: 1, blurb: 'Functionalist design and a young bar culture.', scores: { nightlife: 82, culture: 78, architecture: 76, food: 72 } },

  // Croatia
  { city: 'Hvar', countryCode: 'HR', costTier: 2, blurb: 'Lavender islands, yacht harbours, and beach clubs.', scores: { beaches: 88, nightlife: 86, romance: 78, nature: 72 } },
  { city: 'Rovinj', countryCode: 'HR', costTier: 2, blurb: 'An Istrian fishing town of Venetian pastels.', scores: { romance: 86, beaches: 80, food: 80, architecture: 78 } },
  { city: 'Zagreb', countryCode: 'HR', costTier: 1, blurb: 'Café terraces, museums, and Austro-Hungarian streets.', scores: { culture: 82, food: 78, nightlife: 78, art: 74 } },

  // Iceland
  { city: 'Akureyri', countryCode: 'IS', costTier: 3, blurb: 'The north’s capital — whales, waterfalls, and ski slopes.', scores: { nature: 94, adventure: 86, wellness: 72 } },

  // Turkey
  { city: 'Antalya', countryCode: 'TR', costTier: 1, blurb: 'Turquoise-coast resorts beside ancient ruins.', scores: { beaches: 88, history: 80, nightlife: 74, nature: 74 } },
  { city: 'İzmir', countryCode: 'TR', costTier: 1, blurb: 'Aegean waterfront ease and gateway to Ephesus.', scores: { food: 84, culture: 80, beaches: 78, history: 78 } },

  // Morocco
  { city: 'Chefchaouen', countryCode: 'MA', costTier: 1, blurb: 'The blue-washed town in the Rif mountains.', scores: { culture: 86, nature: 80, romance: 78, shopping: 74 } },
  { city: 'Essaouira', countryCode: 'MA', costTier: 1, blurb: 'Windswept Atlantic ramparts and gnaoua rhythms.', scores: { beaches: 82, culture: 84, wellness: 74, food: 76 } },

  // Japan
  { city: 'Osaka', countryCode: 'JP', costTier: 2, blurb: 'Neon canals and Japan’s street-food heartland.', scores: { food: 94, nightlife: 88, shopping: 84, culture: 78 } },
  { city: 'Nara', countryCode: 'JP', costTier: 2, blurb: 'Bowing deer among ancient temples and parks.', scores: { history: 90, culture: 86, nature: 76, wellness: 72 } },
  { city: 'Kanazawa', countryCode: 'JP', costTier: 2, blurb: 'Geisha districts, gold leaf, and a famous garden.', scores: { culture: 90, art: 84, history: 84, food: 80 } },
  { city: 'Sapporo', countryCode: 'JP', costTier: 2, blurb: 'Powder snow, ramen, and a brewing heritage.', scores: { food: 86, nature: 82, adventure: 80, nightlife: 74 } },

  // Thailand
  { city: 'Krabi', countryCode: 'TH', costTier: 1, blurb: 'Limestone karsts over emerald Andaman waters.', scores: { beaches: 92, nature: 86, adventure: 82, wellness: 74 } },
  { city: 'Ayutthaya', countryCode: 'TH', costTier: 1, blurb: 'Ruined temple spires of a former Siamese capital.', scores: { history: 90, culture: 84, architecture: 78 } },

  // Vietnam
  { city: 'Ho Chi Minh City', countryCode: 'VN', costTier: 1, blurb: 'Frenetic markets, rooftop bars, and war history.', scores: { food: 88, nightlife: 84, culture: 80, history: 78, shopping: 76 } },
  { city: 'Da Nang', countryCode: 'VN', costTier: 1, blurb: 'Long beaches between Marble Mountains and bridges.', scores: { beaches: 86, food: 80, nature: 76, adventure: 70 } },
  { city: 'Sapa', countryCode: 'VN', costTier: 1, blurb: 'Terraced rice valleys and hill-tribe treks.', scores: { nature: 92, adventure: 86, culture: 82 } },

  // Indonesia
  { city: 'Yogyakarta', countryCode: 'ID', costTier: 1, blurb: 'Javanese arts beside Borobudur and Prambanan.', scores: { culture: 90, history: 86, art: 82, food: 76 } },
  { city: 'Lombok', countryCode: 'ID', costTier: 1, blurb: 'Quiet surf beaches and a volcano to climb.', scores: { beaches: 90, nature: 86, adventure: 84, wellness: 76 } },

  // India
  { city: 'Udaipur', countryCode: 'IN', costTier: 1, blurb: 'Lake palaces and the most romantic of Rajasthan.', scores: { romance: 90, history: 88, architecture: 90, culture: 84 } },
  { city: 'Varanasi', countryCode: 'IN', costTier: 1, blurb: 'Ghats and rituals on the sacred Ganges.', scores: { culture: 94, history: 88, wellness: 70 } },
  { city: 'Kochi', countryCode: 'IN', costTier: 1, blurb: 'Spice-trade harbours and Keralan backwaters.', scores: { nature: 84, culture: 82, food: 80, history: 78, wellness: 74 } },
  { city: 'Agra', countryCode: 'IN', costTier: 1, blurb: 'Home of the incomparable Taj Mahal.', scores: { history: 94, architecture: 94, romance: 80, culture: 78 } },

  // UAE
  { city: 'Abu Dhabi', countryCode: 'AE', costTier: 3, blurb: 'The Grand Mosque, the Louvre, and desert calm.', scores: { architecture: 88, culture: 80, beaches: 76, wellness: 76 } },

  // USA
  { city: 'Chicago', countryCode: 'US', costTier: 2, blurb: 'Lakefront skyscrapers, blues clubs, and deep-dish.', scores: { architecture: 92, art: 84, food: 84, nightlife: 82, culture: 82 } },
  { city: 'Austin', countryCode: 'US', costTier: 2, blurb: 'Live music, tacos, and Hill Country swimming holes.', scores: { nightlife: 88, food: 86, culture: 82, adventure: 70 } },
  { city: 'Charleston', countryCode: 'US', costTier: 2, blurb: 'Antebellum porches, cobbles, and Lowcountry cooking.', scores: { history: 86, romance: 82, food: 84, culture: 78 } },
  { city: 'Seattle', countryCode: 'US', costTier: 3, blurb: 'Coffee, sound-side markets, and mountain horizons.', scores: { food: 82, nature: 82, culture: 80, art: 76 } },

  // Mexico
  { city: 'San Miguel de Allende', countryCode: 'MX', costTier: 2, blurb: 'Cobbled colonial lanes and an arts-colony glow.', scores: { art: 88, romance: 86, culture: 88, architecture: 84 } },
  { city: 'Guanajuato', countryCode: 'MX', costTier: 1, blurb: 'A jewel-box of tunnels, plazas, and student song.', scores: { culture: 88, history: 84, romance: 82, architecture: 84 } },
  { city: 'Guadalajara', countryCode: 'MX', costTier: 1, blurb: 'Birthplace of mariachi, tequila, and bright murals.', scores: { culture: 86, food: 84, nightlife: 82, art: 78 } },

  // Peru
  { city: 'Arequipa', countryCode: 'PE', costTier: 1, blurb: 'White-stone baroque under three volcanoes.', scores: { architecture: 86, history: 82, nature: 80, food: 80 } },
  { city: 'Puno', countryCode: 'PE', costTier: 1, blurb: 'Reed islands and folklore on Lake Titicaca.', scores: { nature: 84, culture: 86, history: 76 } },

  // Brazil
  { city: 'Salvador', countryCode: 'BR', costTier: 1, blurb: 'Afro-Brazilian rhythm in a pastel colonial core.', scores: { culture: 92, history: 84, beaches: 80, nightlife: 84 } },
  { city: 'São Paulo', countryCode: 'BR', costTier: 2, blurb: 'A megacity of galleries, chefs, and all-night bars.', scores: { food: 88, art: 86, nightlife: 88, shopping: 82, culture: 82 } },
  { city: 'Paraty', countryCode: 'BR', costTier: 2, blurb: 'Colonial cobbles between rainforest and sea.', scores: { romance: 84, history: 82, nature: 84, beaches: 78 } },

  // Australia
  { city: 'Melbourne', countryCode: 'AU', costTier: 3, blurb: 'Laneway coffee, street art, and a food obsession.', scores: { food: 90, art: 86, culture: 86, nightlife: 84 } },
  { city: 'Byron Bay', countryCode: 'AU', costTier: 2, blurb: 'Surf breaks, hinterland yoga, and easy sunsets.', scores: { beaches: 90, wellness: 88, nature: 80, adventure: 72 } },
  { city: 'Hobart', countryCode: 'AU', costTier: 2, blurb: 'Tasmania’s harbour town and the edgy MONA museum.', scores: { art: 86, nature: 84, food: 82, culture: 78 } },
]

// The baseline a city scores on an interest it has no rating for. Kept as a
// named constant so the "why" breakdown can explain it to the user.
export const MISSING_INTEREST_SCORE = 25

export interface InterestContribution {
  id: string // interest id
  score: number // this city's 0–100 score for that interest
  assumed: boolean // true when we fell back to the baseline
}

export interface CityMatch extends City {
  matchScore: number // 0–100
  matchedInterests: string[] // interest ids this city is strong in
  breakdown: InterestContribution[] // per-chosen-interest contribution to the score
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
      const breakdown: InterestContribution[] = picks.map((i) => ({
        id: i,
        score: c.scores[i] ?? MISSING_INTEREST_SCORE,
        assumed: c.scores[i] === undefined,
      }))
      const avg = breakdown.reduce((a, b) => a + b.score, 0) / picks.length
      const matched = picks.filter((i) => (c.scores[i] ?? 0) >= 70)
      return { ...c, matchScore: Math.round(avg), matchedInterests: matched, breakdown }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function hasCitiesFor(countryCode: string): boolean {
  return CITIES.some((c) => c.countryCode === countryCode)
}

// Exposed for the place-verification fallback (services/geocode.ts).
export const CITIES_INDEX = CITIES

// Build a flag emoji from any ISO 3166-1 alpha-2 code (works beyond the
// curated COUNTRIES list, e.g. for live geocoder results).
export function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '📍'
  const cc = code.toUpperCase()
  if (!/^[A-Z]{2}$/.test(cc)) return '📍'
  const A = 0x1f1e6
  return String.fromCodePoint(A + cc.charCodeAt(0) - 65, A + cc.charCodeAt(1) - 65)
}
