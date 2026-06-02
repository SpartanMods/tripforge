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
