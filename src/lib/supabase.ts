import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createDemoClient } from './demoClient'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const configured = !!(supabaseUrl && supabaseAnonKey)

// When Supabase isn't configured we fall back to a localStorage-backed demo
// backend so the whole app is explorable with zero setup. Add real keys to
// .env.local to switch to the live backend automatically.
export const isDemoMode = !configured

export const supabase: SupabaseClient = configured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (createDemoClient() as unknown as SupabaseClient)

if (isDemoMode) {
  console.info(
    '[TripForge] Running in DEMO mode (no Supabase keys found). ' +
      'Trips are stored in your browser. Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env.local for the live backend.',
  )
}
