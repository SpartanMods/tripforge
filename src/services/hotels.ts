// Hotels.com via RapidAPI — key: VITE_RAPIDAPI_KEY
// Host: hotels-com-provider.p.rapidapi.com

export interface HotelSearchParams {
  destination: string
  checkIn: string   // ISO date
  checkOut: string  // ISO date
  guests: number
  rooms: number
}

export interface HotelOffer {
  id: string
  name: string
  price: number
  currency: string
  pricePerNight: number
  rating: number
  reviewCount: number
  imageUrl: string
  bookingUrl: string
}

const API_CONFIGURED = !!import.meta.env.VITE_RAPIDAPI_KEY

export function hotelsApiConfigured(): boolean {
  return API_CONFIGURED
}

const NAME_PARTS = [
  ['The', 'Grand', 'Hotel'],
  ['Casa', 'del', 'Sol'],
  ['Maison', 'Lumière', ''],
  ['Riverside', 'Boutique', 'Stay'],
  ['Old Town', 'Residences', ''],
  ['Harbour', 'View', 'Suites'],
]

// Deterministic mock results so accommodation search works without API keys.
function mockHotels(params: HotelSearchParams): HotelOffer[] {
  const seed = params.destination.length
  return NAME_PARTS.map((parts, i) => {
    const perNight = 70 + ((seed * (i + 2)) % 320)
    return {
      id: `htl-${i}`,
      name: `${parts.join(' ').trim()} ${params.destination}`.trim(),
      pricePerNight: perNight,
      price: perNight,
      currency: 'USD',
      rating: Math.round((3.6 + ((seed + i) % 14) / 10) * 10) / 10,
      reviewCount: 120 + ((seed * (i + 1) * 37) % 4000),
      imageUrl: '',
      bookingUrl: '#',
    }
  }).sort((a, b) => a.pricePerNight - b.pricePerNight)
}

export async function searchHotels(
  params: HotelSearchParams,
): Promise<{ offers: HotelOffer[]; live: boolean }> {
  // TODO: when configured, implement Hotels.com RapidAPI search:
  // GET https://hotels-com-provider.p.rapidapi.com/v2/hotels/search
  await new Promise((r) => setTimeout(r, 600))
  return { offers: mockHotels(params), live: false }
}
