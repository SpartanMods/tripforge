import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2, Check, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { flagEmoji } from '@/lib/interests'
import { searchPlaces, type GeoPlace } from '@/services/geocode'

interface CityValue {
  city: string
  country: string
  countryCode: string
}

interface CityAutocompleteProps {
  value: CityValue
  onChange: (v: CityValue) => void
  id?: string
  placeholder?: string
}

// A verifying city field: results come from a real geocoder, and a value is
// only committed when the user picks a suggestion — so typos never make it
// into a saved trip. Famous regions (e.g. "Cinque Terre") expand to their
// actual towns via services/geocode.
export function CityAutocomplete({ value, onChange, id, placeholder }: CityAutocompleteProps) {
  const [query, setQuery] = useState(value.city)
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<GeoPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const confirmed = !!value.countryCode && query.trim().toLowerCase() === value.city.toLowerCase()

  // Keep the field in sync when the parent sets a city another way
  // (e.g. the "Pick a city" dialog).
  useEffect(() => { setQuery(value.city) }, [value.city])

  // Debounced, abortable search.
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length < 2 || (confirmed && q === value.city)) { setResults([]); return }
    const ctrl = new AbortController()
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const places = await searchPlaces(q, ctrl.signal)
        setResults(places)
        setActive(0)
      } catch {
        /* aborted or failed — keep prior results */
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [query, open, confirmed, value.city])

  function select(p: GeoPlace) {
    onChange({ city: p.name, country: p.country, countryCode: p.countryCode })
    setQuery(p.name)
    setResults([])
    setOpen(false)
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => {
      setOpen(false)
      // Snap unconfirmed free-text back to the last verified place.
      if (query.trim().toLowerCase() !== value.city.toLowerCase()) setQuery(value.city)
    }, 160)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); select(results[active]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const showHint = open && query.trim().length >= 2 && !loading && results.length === 0
  const unconfirmed = query.trim().length > 0 && !confirmed

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          placeholder={placeholder ?? 'Search a city…'}
          autoComplete="off"
          className="pl-8 pr-8"
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            : confirmed ? <span className="text-base" aria-label={value.country}>{flagEmoji(value.countryCode)}</span>
            : unconfirmed ? <span className="block h-2 w-2 rounded-full bg-honey" title="Pick a place to confirm" />
            : null}
        </span>
      </div>

      {open && (results.length > 0 || showHint) && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border bg-popover shadow-lift">
          {results.map((p, i) => (
            <button
              key={p.id}
              type="button"
              // onMouseDown beats the input's onBlur so the pick registers.
              onMouseDown={(e) => { e.preventDefault(); select(p) }}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                i === active ? 'bg-accent' : 'hover:bg-accent/60'
              }`}
            >
              <span className="text-base">{flagEmoji(p.countryCode)}</span>
              <span className="min-w-0 flex-1">
                <span className="font-medium">{p.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.partOf ? `${p.partOf} · ` : ''}{[p.region, p.country].filter(Boolean).join(', ')}
                </span>
              </span>
              {p.partOf
                ? <span className="rounded-full bg-ocean/10 px-1.5 py-0.5 text-[10px] font-medium text-ocean">in region</span>
                : <MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          ))}
          {showHint && (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">
              No matching places. Check the spelling, or try a nearby city.
            </p>
          )}
        </div>
      )}

      {unconfirmed && !open && (
        <p className="mt-1 flex items-center gap-1 text-xs text-honey">
          Pick a place from the list to confirm it.
        </p>
      )}
      {confirmed && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="h-3 w-3 text-success" /> {value.country}
        </p>
      )}
    </div>
  )
}
