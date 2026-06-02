// Rome2rio API — https://www.rome2rio.com/documentation/
// Covers trains, buses, ferries, and driving routes between destinations

export interface TrainSearchParams {
  origin: string
  destination: string
  date: string  // ISO date
  passengers: number
}

export interface TrainOffer {
  id: string
  operator: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  currency: string
  bookingUrl: string
  stops: number
}

export async function searchTrains(_params: TrainSearchParams): Promise<TrainOffer[]> {
  // TODO: implement Rome2rio search API
  // GET https://free.rome2rio.com/api/1.4/json/Search
  throw new Error('Train search not yet implemented')
}
