// Shared domain types for Voya trip planning.

export interface Destination {
  city: string
  country: string
  countryCode?: string
  from: string
  to: string
}

export interface Traveller {
  id: string
  name: string
  budget: number
}

// Optional fine-grained split of the total budget across spend categories.
export interface BudgetBreakdown {
  flights: number
  hotels: number
  food: number
  activities: number
  shopping: number
  transport: number
  other: number
}

export const BUDGET_CATEGORIES: { key: keyof BudgetBreakdown; label: string; icon: string }[] = [
  { key: 'flights', label: 'Flights', icon: '✈️' },
  { key: 'hotels', label: 'Hotels & stays', icon: '🏨' },
  { key: 'food', label: 'Food & drink', icon: '🍽️' },
  { key: 'activities', label: 'Activities', icon: '🎟️' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️' },
  { key: 'transport', label: 'Local transport', icon: '🚆' },
  { key: 'other', label: 'Other', icon: '✨' },
]

export function emptyBreakdown(): BudgetBreakdown {
  return { flights: 0, hotels: 0, food: 0, activities: 0, shopping: 0, transport: 0, other: 0 }
}

// Everything we tuck into trips.metadata (a single jsonb column) so the
// schema stays additive and resilient.
export interface TripMetadata {
  travellers?: Traveller[]
  budgetBreakdown?: BudgetBreakdown | null
  interests?: string[]
  preferredAirlines?: string[]
  savedFlights?: SavedFlight[]
  savedHotels?: SavedHotel[]
}

export interface SavedFlight {
  id: string
  airline: string
  from: string
  to: string
  date: string
  price: number
  currency: string
}

export interface SavedHotel {
  id: string
  name: string
  city: string
  pricePerNight: number
  currency: string
  rating: number
}

export interface Trip {
  id: string
  title: string
  destinations: Destination[]
  start_date: string | null
  end_date: string | null
  budget: number | null
  currency: string
  owner_id: string
  created_at: string
  metadata: TripMetadata | null
}

// ---- Social / collaboration ------------------------------------------------

export interface Profile {
  id: string
  username: string
  phone?: string | null
  avatar_url?: string | null
}

export type FriendshipStatus = 'pending' | 'accepted'

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
}

// A friendship paired with the *other* person's profile and which side
// initiated it — everything the UI needs to render a row.
export interface FriendEdge {
  friendship: Friendship
  profile: Profile
  direction: 'incoming' | 'outgoing' // who needs to act, for pending rows
}

export interface TripMember {
  trip_id: string
  user_id: string
  role: 'owner' | 'collaborator'
  joined_at: string
  profile?: Profile
}
