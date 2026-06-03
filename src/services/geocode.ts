// ============================================================
// Place lookup & verification
//
// Type-ahead search backed by Photon (https://photon.komoot.io), an
// OpenStreetMap-based geocoder that's free and needs no API key. It runs
// from the user's browser, so it works on the deployed app without any
// server. If Photon is unreachable we fall back to the built-in atlas so
// the field always functions.
//
// Two extras layered on top:
//  - Region expansion: typing a famous multi-town region (e.g. "Cinque
//    Terre") surfaces the real towns inside it rather than a vague area.
//  - Verification: callers only ever commit a place the user picked from
//    real results, which keeps typos out of saved trips.
// ============================================================
import { CITIES_INDEX, COUNTRIES, countryName } from '@/lib/interests'

export type PlaceKind = 'city' | 'town' | 'village' | 'locality' | 'region' | 'place'

export interface GeoPlace {
  id: string
  name: string
  country: string
  countryCode: string // ISO 3166-1 alpha-2, uppercase
  region?: string // state / county, for disambiguation
  lat?: number
  lon?: number
  kind: PlaceKind
  /** When set, this entry is a region; choosing it should reveal its towns. */
  partOf?: string
}

// ---- Curated regions → their real constituent towns -------------------------
// Generic geocoders return a region as a single fuzzy area; these expansions
// let us present the actual places a traveller would base themselves in.
interface RegionDef {
  region: string
  country: string
  countryCode: string
  towns: string[]
}

const REGIONS: Record<string, RegionDef> = {
  'cinque terre': { region: 'Cinque Terre', country: 'Italy', countryCode: 'IT', towns: ['Monterosso al Mare', 'Vernazza', 'Corniglia', 'Manarola', 'Riomaggiore'] },
  'amalfi coast': { region: 'Amalfi Coast', country: 'Italy', countryCode: 'IT', towns: ['Amalfi', 'Positano', 'Ravello', 'Sorrento', 'Praiano'] },
  'tuscany': { region: 'Tuscany', country: 'Italy', countryCode: 'IT', towns: ['Florence', 'Siena', 'Pisa', 'Lucca', 'San Gimignano', 'Montepulciano'] },
  'lake como': { region: 'Lake Como', country: 'Italy', countryCode: 'IT', towns: ['Como', 'Bellagio', 'Varenna', 'Menaggio', 'Lecco'] },
  'dolomites': { region: 'Dolomites', country: 'Italy', countryCode: 'IT', towns: ['Cortina d’Ampezzo', 'Ortisei', 'Bolzano', 'Canazei'] },
  'french riviera': { region: 'French Riviera', country: 'France', countryCode: 'FR', towns: ['Nice', 'Cannes', 'Antibes', 'Menton', 'Saint-Tropez'] },
  'cote d azur': { region: 'Côte d’Azur', country: 'France', countryCode: 'FR', towns: ['Nice', 'Cannes', 'Antibes', 'Menton', 'Saint-Tropez'] },
  'provence': { region: 'Provence', country: 'France', countryCode: 'FR', towns: ['Aix-en-Provence', 'Avignon', 'Arles', 'Marseille', 'Gordes'] },
  'andalusia': { region: 'Andalusia', country: 'Spain', countryCode: 'ES', towns: ['Seville', 'Granada', 'Córdoba', 'Málaga', 'Ronda'] },
  'costa brava': { region: 'Costa Brava', country: 'Spain', countryCode: 'ES', towns: ['Girona', 'Tossa de Mar', 'Cadaqués', 'Begur'] },
  'algarve': { region: 'Algarve', country: 'Portugal', countryCode: 'PT', towns: ['Lagos', 'Faro', 'Albufeira', 'Tavira', 'Sagres'] },
  'scottish highlands': { region: 'Scottish Highlands', country: 'United Kingdom', countryCode: 'GB', towns: ['Inverness', 'Fort William', 'Aviemore', 'Portree'] },
  'bavaria': { region: 'Bavaria', country: 'Germany', countryCode: 'DE', towns: ['Munich', 'Nuremberg', 'Füssen', 'Garmisch-Partenkirchen'] },
  'bali': { region: 'Bali', country: 'Indonesia', countryCode: 'ID', towns: ['Ubud', 'Seminyak', 'Canggu', 'Uluwatu', 'Sanur'] },
  'greek islands': { region: 'Greek Islands', country: 'Greece', countryCode: 'GR', towns: ['Santorini', 'Mykonos', 'Naxos', 'Paros', 'Crete'] },
}

function norm(s: string): string {
  // NFD splits accented letters into base + combining mark; the [^a-z0-9 ]
  // pass then drops the marks, so accents are normalised away.
  return s.toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '').trim()
}

// Towns for any region whose name the query is clearly referring to.
function matchRegion(query: string): GeoPlace[] {
  const q = norm(query)
  if (q.length < 3) return []
  const hit = Object.entries(REGIONS).find(
    ([key, def]) => key.includes(q) || q.includes(key) || norm(def.region).includes(q),
  )
  if (!hit) return []
  const def = hit[1]
  return def.towns.map((town) => ({
    id: `region:${def.region}:${town}`,
    name: town,
    country: def.country,
    countryCode: def.countryCode,
    region: def.region,
    kind: 'town' as const,
    partOf: def.region,
  }))
}

// ---- Photon (OSM) -----------------------------------------------------------
const PLACE_LAYERS = new Set(['city', 'locality', 'district', 'county', 'state', 'other'])

interface PhotonFeature {
  properties: {
    osm_id?: number
    osm_key?: string
    osm_value?: string
    name?: string
    country?: string
    countrycode?: string
    state?: string
    county?: string
    type?: string
  }
  geometry?: { coordinates?: [number, number] }
}

function kindFromFeature(p: PhotonFeature['properties']): PlaceKind {
  const v = p.osm_value
  if (v === 'city') return 'city'
  if (v === 'town') return 'town'
  if (v === 'village' || v === 'hamlet') return 'village'
  if (v === 'region' || p.type === 'state' || p.type === 'county') return 'region'
  if (v === 'locality' || p.type === 'locality') return 'locality'
  return 'place'
}

function featureToPlace(f: PhotonFeature): GeoPlace | null {
  const p = f.properties || {}
  if (!p.name || !p.countrycode) return null
  // Drop streets, buildings, addresses — keep populated places & areas.
  if (p.osm_key === 'highway' || p.osm_key === 'building' || p.osm_key === 'waterway') return null
  if (p.type && !PLACE_LAYERS.has(p.type)) return null
  const [lon, lat] = f.geometry?.coordinates ?? [undefined, undefined]
  return {
    id: `osm:${p.osm_id ?? `${p.name}-${p.countrycode}`}`,
    name: p.name,
    country: p.country ?? countryName(p.countrycode.toUpperCase()),
    countryCode: p.countrycode.toUpperCase(),
    region: p.state || p.county || undefined,
    lat,
    lon,
    kind: kindFromFeature(p),
  }
}

// ---- Offline fallback (built-in atlas) --------------------------------------
function offlineSearch(query: string): GeoPlace[] {
  const q = norm(query)
  const fromCities: GeoPlace[] = CITIES_INDEX
    .filter((c) => norm(c.city).includes(q))
    .slice(0, 8)
    .map((c) => ({
      id: `atlas:${c.city}-${c.countryCode}`,
      name: c.city,
      country: countryName(c.countryCode),
      countryCode: c.countryCode,
      kind: 'city' as const,
    }))
  const fromCountries: GeoPlace[] = COUNTRIES
    .filter((c) => norm(c.name).includes(q))
    .slice(0, 3)
    .map((c) => ({
      id: `country:${c.code}`,
      name: c.name,
      country: c.name,
      countryCode: c.code,
      kind: 'region' as const,
    }))
  return [...fromCities, ...fromCountries]
}

function dedupe(places: GeoPlace[]): GeoPlace[] {
  const seen = new Set<string>()
  const out: GeoPlace[] = []
  for (const p of places) {
    const key = `${norm(p.name)}|${p.countryCode}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out
}

// Main entry: region towns first, then real geocoder hits, with an offline
// safety net. Pass an AbortSignal to cancel superseded keystrokes.
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const regionHits = matchRegion(q)

  let remote: GeoPlace[] = []
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`
    const res = await fetch(url, { signal })
    if (res.ok) {
      const data = (await res.json()) as { features?: PhotonFeature[] }
      remote = (data.features ?? []).map(featureToPlace).filter((p): p is GeoPlace => p !== null)
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    remote = offlineSearch(q)
  }

  if (remote.length === 0 && regionHits.length === 0) {
    remote = offlineSearch(q)
  }

  return dedupe([...regionHits, ...remote]).slice(0, 10)
}
