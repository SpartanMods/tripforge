import { useState } from 'react'
import { Sparkles, Loader2, MapPin, Check, ArrowLeft } from 'lucide-react'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  COUNTRIES,
  INTERESTS,
  interestIcon,
  interestLabel,
  countryFlag,
  hasCitiesFor,
  type CityMatch,
} from '@/lib/interests'
import { findCityForInterests } from '@/services/discovery'

interface PickCityDialogProps {
  open: boolean
  onClose: () => void
  onPick: (pick: { city: string; country: string; countryCode: string }) => void
  /** Pre-select a country if the stop already has one */
  initialCountryCode?: string
}

const COST_LABEL = { 1: '$ · budget-friendly', 2: '$$ · mid-range', 3: '$$$ · premium' } as const

export function PickCityDialog({ open, onClose, onPick, initialCountryCode }: PickCityDialogProps) {
  const [country, setCountry] = useState(initialCountryCode ?? '')
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CityMatch[] | null>(null)

  const canSearch = country && interests.length === 3 && hasCitiesFor(country)

  function toggleInterest(id: string) {
    setInterests((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id)
      if (prev.length >= 3) return prev // cap at three
      return [...prev, id]
    })
  }

  async function handleSearch() {
    if (!canSearch) return
    setLoading(true)
    try {
      const { matches } = await findCityForInterests(country, interests)
      setResults(matches)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResults(null)
  }

  function choose(m: CityMatch) {
    onPick({
      city: m.city,
      country: COUNTRIES.find((c) => c.code === m.countryCode)?.name ?? '',
      countryCode: m.countryCode,
    })
    // Leave selections so the dialog reopens in a sensible state
    setResults(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} label="Find a city" className="sm:max-w-xl">
      <DialogHeader>
        <span className="eyebrow flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Pick a city for me
        </span>
        <h2 className="text-2xl font-semibold mt-1">
          {results ? 'Your best-fit cities' : 'Tell us the country & your vibe'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {results
            ? 'Ranked by how well each city matches your three interests.'
            : 'Choose a country and exactly three interests — we’ll find the city that fits best.'}
        </p>
      </DialogHeader>

      <DialogBody className="space-y-6">
        {!results && (
          <>
            {/* Country picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Pick 3 interests</label>
                <span
                  className={`text-xs font-semibold ${
                    interests.length === 3 ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {interests.length}/3 selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((it) => {
                  const active = interests.includes(it.id)
                  const disabled = !active && interests.length >= 3
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => toggleInterest(it.id)}
                      disabled={disabled}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : disabled
                            ? 'border-border bg-muted/40 text-muted-foreground/50 cursor-not-allowed'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-accent'
                      }`}
                    >
                      <span>{it.icon}</span>
                      {it.label}
                      {active && <Check className="h-3.5 w-3.5" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-3">
            {results.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No cities in our atlas for that country yet — try another, or enter a city manually.
              </p>
            )}
            {results.map((m, i) => (
              <button
                key={m.city}
                type="button"
                onClick={() => choose(m)}
                className="group w-full text-left rounded-xl border bg-card p-4 transition-all hover:border-primary/60 hover:shadow-soft animate-rise"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {i === 0 && (
                        <Badge className="bg-honey text-foreground border-transparent">Top match</Badge>
                      )}
                      <h3 className="text-lg font-semibold truncate">
                        {countryFlag(m.countryCode)} {m.city}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{m.blurb}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {m.matchedInterests.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                        >
                          {interestIcon(id)} {interestLabel(id)}
                        </span>
                      ))}
                      <span className="text-xs text-muted-foreground">{COST_LABEL[m.costTier]}</span>
                    </div>
                  </div>
                  {/* Match ring */}
                  <div className="shrink-0 text-center">
                    <div
                      className="grid h-14 w-14 place-items-center rounded-full text-sm font-bold text-primary"
                      style={{
                        background: `conic-gradient(hsl(var(--primary)) ${m.matchScore * 3.6}deg, hsl(var(--secondary)) 0deg)`,
                      }}
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-card">
                        {m.matchScore}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      match
                    </span>
                  </div>
                </div>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <MapPin className="h-3 w-3" /> Use this city
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogBody>

      <DialogFooter>
        {results ? (
          <Button variant="ghost" onClick={reset} className="mr-auto gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Adjust interests
          </Button>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
        {!results && (
          <Button onClick={handleSearch} disabled={!canSearch || loading} className="gap-1.5">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Finding your city…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Find my city
              </>
            )}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  )
}
