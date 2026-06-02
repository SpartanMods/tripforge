// Google Places API — key: VITE_GOOGLE_PLACES_API_KEY
// Used for "Things to Do" — attractions, restaurants, experiences

export interface PlacesSearchParams {
  location: string
  type?: 'tourist_attraction' | 'restaurant' | 'museum' | 'park' | 'shopping_mall'
  radius?: number  // metres
}

export interface Place {
  id: string
  name: string
  rating: number
  reviewCount: number
  address: string
  photoUrl: string
  mapsUrl: string
  priceLevel?: 1 | 2 | 3 | 4  // $ $$ $$$ $$$$
  openNow?: boolean
}

export async function searchPlaces(_params: PlacesSearchParams): Promise<Place[]> {
  // TODO: implement Google Places Nearby Search
  // GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
  throw new Error('Places search not yet implemented')
}
