// Airbnb via RapidAPI — key: VITE_RAPIDAPI_KEY
// Host: airbnb13.p.rapidapi.com

export interface AirbnbSearchParams {
  location: string
  checkIn: string   // ISO date
  checkOut: string  // ISO date
  adults: number
  children?: number
}

export interface AirbnbListing {
  id: string
  name: string
  price: number
  currency: string
  pricePerNight: number
  rating: number
  reviewCount: number
  roomType: string
  imageUrl: string
  listingUrl: string
}

export async function searchAirbnb(_params: AirbnbSearchParams): Promise<AirbnbListing[]> {
  // TODO: implement Airbnb RapidAPI search
  // GET https://airbnb13.p.rapidapi.com/search-location
  throw new Error('Airbnb search not yet implemented')
}
