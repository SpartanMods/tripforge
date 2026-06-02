import { useState } from 'react'
import { Plane, Loader2, Search, Check, Plus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/format'
import { searchFlights, flightsApiConfigured, AIRLINES, type FlightOffer } from '@/services/amadeus'
import type { SavedFlight } from '@/lib/types'

interface FlightSearchProps {
  defaultFrom?: string
  defaultTo?: string
  defaultDate?: string
  savedIds: string[]
  onSave: (flight: SavedFlight) => void
}

export function FlightSearch({ defaultFrom = '', defaultTo = '', defaultDate = '', savedIds, onSave }: FlightSearchProps) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [date, setDate] = useState(defaultDate)
  const [preferred, setPreferred] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [offers, setOffers] = useState<FlightOffer[] | null>(null)
  const [live, setLive] = useState(false)

  function toggleAirline(code: string) {
    setPreferred((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!from || !to) return
    setLoading(true)
    try {
      const res = await searchFlights(
        { origin: from, destination: to, departureDate: date, adults: 1 },
        preferred,
      )
      setOffers(res.offers)
      setLive(res.live)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fl-from">From</Label>
            <Input id="fl-from" placeholder="City or airport (LHR)" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fl-to">To</Label>
            <Input id="fl-to" placeholder="Destination (CDG)" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fl-date">Departure</Label>
            <Input id="fl-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {/* Preferred airlines */}
        <div className="space-y-2">
          <Label className="text-sm">Preferred airlines <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <div className="flex flex-wrap gap-1.5">
            {AIRLINES.map((a) => {
              const active = preferred.includes(a.code)
              return (
                <button
                  key={a.code}
                  type="button"
                  onClick={() => toggleAirline(a.code)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-all ${
                    active
                      ? 'border-ocean bg-ocean text-ocean-foreground'
                      : 'border-border bg-card hover:border-ocean/50'
                  }`}
                >
                  {a.name}
                </button>
              )
            })}
          </div>
        </div>

        <Button type="submit" disabled={loading || !from || !to} className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Searching flights…' : 'Search flights'}
        </Button>
      </form>

      {/* API status hint */}
      {offers && !live && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          {flightsApiConfigured()
            ? 'Showing sample results.'
            : 'Showing sample results — add an Amadeus API key to see live fares.'}
        </p>
      )}

      {/* Results */}
      {offers && (
        <div className="space-y-2">
          {offers.length === 0 && <p className="text-sm text-muted-foreground">No flights found.</p>}
          {offers.map((o, i) => {
            const saved = savedIds.includes(o.id)
            return (
              <div
                key={o.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 animate-rise"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary">
                  <Plane className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{o.airline}</p>
                    {i === 0 && <Badge variant="secondary" className="text-[10px]">Cheapest</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {o.departureTime} → {o.arrivalTime} · {o.duration} ·{' '}
                    {o.stops === 0 ? 'Direct' : `${o.stops} stop${o.stops > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-lg font-semibold">{formatMoney(o.price, o.currency)}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant={saved ? 'secondary' : 'outline'}
                    disabled={saved}
                    onClick={() =>
                      onSave({
                        id: o.id,
                        airline: o.airline,
                        from,
                        to,
                        date,
                        price: o.price,
                        currency: o.currency,
                      })
                    }
                    className="mt-1 h-7 gap-1 text-xs"
                  >
                    {saved ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {saved ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
