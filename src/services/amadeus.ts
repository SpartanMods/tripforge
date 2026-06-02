// Amadeus Flight Search — https://developers.amadeus.com
// Sandbox key: VITE_AMADEUS_API_KEY + VITE_AMADEUS_API_SECRET

export interface FlightSearchParams {
  origin: string        // IATA code, e.g. "LHR"
  destination: string   // IATA code, e.g. "CDG"
  departureDate: string // ISO date, e.g. "2026-09-01"
  returnDate?: string
  adults: number
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
}

export interface FlightOffer {
  id: string
  price: number
  currency: string
  airline: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  bookingUrl: string
}

// Airlines a traveller can filter by. In a live integration these would come
// from the Amadeus airline-lookup endpoint for the searched route.
export const AIRLINES = [
  { code: 'BA', name: 'British Airways' },
  { code: 'AF', name: 'Air France' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'KL', name: 'KLM' },
  { code: 'IB', name: 'Iberia' },
  { code: 'EK', name: 'Emirates' },
  { code: 'QR', name: 'Qatar Airways' },
  { code: 'UA', name: 'United' },
  { code: 'DL', name: 'Delta' },
  { code: 'AA', name: 'American' },
]

const API_CONFIGURED = !!(
  import.meta.env.VITE_AMADEUS_API_KEY && import.meta.env.VITE_AMADEUS_API_SECRET
)

export function flightsApiConfigured(): boolean {
  return API_CONFIGURED
}

// Deterministic mock offers so the flight UX is fully usable without API keys.
// `preferredAirlines` (IATA codes) filters/surfaces matching carriers first.
function mockOffers(params: FlightSearchParams, preferredAirlines: string[] = []): FlightOffer[] {
  const pool = preferredAirlines.length
    ? AIRLINES.filter((a) => preferredAirlines.includes(a.code))
    : AIRLINES
  const carriers = (pool.length ? pool : AIRLINES).slice(0, 5)
  const seed = (params.origin + params.destination).length

  return carriers.map((c, i) => {
    const base = 180 + ((seed * (i + 3)) % 520)
    const stops = i % 3 === 0 ? 0 : i % 3
    const depHour = 6 + ((seed + i * 5) % 14)
    const durH = 2 + ((seed + i) % 9)
    return {
      id: `${c.code}-${i}`,
      price: base + stops * 40,
      currency: 'USD',
      airline: c.name,
      departureTime: `${String(depHour).padStart(2, '0')}:${i % 2 ? '40' : '05'}`,
      arrivalTime: `${String((depHour + durH) % 24).padStart(2, '0')}:${i % 2 ? '55' : '20'}`,
      duration: `${durH}h ${(i * 13) % 60}m`,
      stops,
      bookingUrl: '#',
    }
  })
}

export async function searchFlights(
  params: FlightSearchParams,
  preferredAirlines: string[] = [],
): Promise<{ offers: FlightOffer[]; live: boolean }> {
  // TODO: when configured, implement Amadeus OAuth2 token fetch + flight-offers
  // search. POST https://test.api.amadeus.com/v1/security/oauth2/token then
  // GET https://test.api.amadeus.com/v2/shopping/flight-offers
  await new Promise((r) => setTimeout(r, 600))
  const offers = mockOffers(params, preferredAirlines).sort((a, b) => a.price - b.price)
  return { offers, live: false }
}
