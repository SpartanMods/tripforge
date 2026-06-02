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

export async function searchFlights(_params: FlightSearchParams): Promise<FlightOffer[]> {
  // TODO: implement Amadeus OAuth2 token fetch + flight-offers search
  // POST https://test.api.amadeus.com/v1/security/oauth2/token
  // GET  https://test.api.amadeus.com/v2/shopping/flight-offers
  throw new Error('Flight search not yet implemented')
}
