// Destination discovery — powered by Claude API (server-side only)
// The ANTHROPIC_API_KEY must never be sent to the browser.
// In production this should be a Supabase Edge Function or Vercel API route.

export interface DiscoveryParams {
  budget: number
  currency: string
  departureCity: string
  travelDates: { from: string; to: string }
  vibe: ('beach' | 'city' | 'adventure' | 'culture' | 'nature')[]
  numberOfTravellers: number
}

export interface DestinationSuggestion {
  city: string
  country: string
  countryCode: string
  description: string
  estimatedFlightCost: number
  estimatedAccommodationCostPerNight: number
  estimatedDailySpend: number
  currency: string
  highlights: string[]
  bestFor: string[]
}

export async function discoverDestinations(_params: DiscoveryParams): Promise<DestinationSuggestion[]> {
  // TODO: call a Supabase Edge Function or Vercel API route that:
  //   1. Builds a prompt from params
  //   2. Calls Anthropic Claude with tool_use to return structured JSON
  //   3. Returns DestinationSuggestion[]
  // Never call the Anthropic API directly from the browser.
  throw new Error('Destination discovery not yet implemented')
}

// ----------------------------------------------------------------------------
// "Pick a city" — find the city in a country that best fits a traveller's
// three chosen interests. Backed by a curated offline dataset
// (lib/interests.ts) so the feature works with no API key. When an
// ANTHROPIC_API_KEY-backed edge function is available, this can defer to it.
// ----------------------------------------------------------------------------

import { findCities, type CityMatch } from '@/lib/interests'

export interface FindCityResult {
  matches: CityMatch[]
  source: 'curated' | 'ai'
}

export async function findCityForInterests(
  countryCode: string,
  interests: string[],
): Promise<FindCityResult> {
  // Simulate a short "thinking" delay so the UX reads as a real search.
  await new Promise((r) => setTimeout(r, 650))
  return { matches: findCities(countryCode, interests), source: 'curated' }
}
