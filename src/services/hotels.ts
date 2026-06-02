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

export async function searchHotels(_params: HotelSearchParams): Promise<HotelOffer[]> {
  // TODO: implement Hotels.com RapidAPI search
  // GET https://hotels-com-provider.p.rapidapi.com/v2/hotels/search
  throw new Error('Hotel search not yet implemented')
}
