import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Trash2, CalendarDays, MapPin, Sparkles, Plane, BedDouble, Compass, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { PickCityDialog } from '@/components/trip/PickCityDialog'
import { TravellerBudgets, newTraveller } from '@/components/trip/TravellerBudgets'
import { AdvancedBudget } from '@/components/trip/AdvancedBudget'
import { FlightSearch } from '@/components/trip/FlightSearch'
import { HotelSearch } from '@/components/trip/HotelSearch'
import { supabase } from '@/lib/supabase'
import { formatMoney } from '@/lib/format'
import { countryFlag } from '@/lib/interests'
import {
  emptyBreakdown,
  type Destination,
  type Traveller,
  type BudgetBreakdown,
  type SavedFlight,
  type SavedHotel,
} from '@/lib/types'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF']

function emptyDestination(): Destination {
  return { city: '', country: '', countryCode: '', from: '', to: '' }
}

export function PlanTrip() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState('')

  const [title, setTitle] = useState('')
  const [destinations, setDestinations] = useState<Destination[]>([emptyDestination()])
  const [currency, setCurrency] = useState('USD')
  const [travellers, setTravellers] = useState<Traveller[]>([newTraveller()])
  const [advancedOn, setAdvancedOn] = useState(false)
  const [breakdown, setBreakdown] = useState<BudgetBreakdown>(emptyBreakdown())
  const [savedFlights, setSavedFlights] = useState<SavedFlight[]>([])
  const [savedHotels, setSavedHotels] = useState<SavedHotel[]>([])

  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalBudget = travellers.reduce((s, t) => s + (t.budget || 0), 0)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/auth', { replace: true }); return }
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
      if (profile) {
        setUsername(profile.username)
        setTravellers((prev) => (prev.length === 1 && !prev[0].name ? [{ ...prev[0], name: profile.username }] : prev))
      }
    }
    loadUser()
  }, [navigate])

  function updateDestination(index: number, patch: Partial<Destination>) {
    setDestinations((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function handleCityPick(pick: { city: string; country: string; countryCode: string }) {
    if (pickerIndex === null) return
    updateDestination(pickerIndex, { city: pick.city, country: pick.country, countryCode: pick.countryCode })
  }

  const firstStop = destinations.find((d) => d.city.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const filled = destinations.filter((d) => d.city.trim())
    if (filled.length === 0) { setError('Add at least one destination — or use “Pick a city”.'); return }
    if (filled.some((d) => d.from && d.to && d.from > d.to)) {
      setError('Each stop’s departure must be after its arrival.'); return
    }

    setSubmitting(true)
    try {
      const startDate = filled[0].from || null
      const endDate = filled[filled.length - 1].to || null

      const metadata = {
        travellers,
        budgetBreakdown: advancedOn ? breakdown : null,
        preferredAirlines: [],
        savedFlights,
        savedHotels,
      }

      const base = {
        title: title.trim() || 'Untitled trip',
        destinations: filled,
        start_date: startDate,
        end_date: endDate,
        budget: totalBudget || null,
        currency,
        owner_id: userId,
      }

      let insertedId: string | null = null
      // Try with the rich metadata column; fall back gracefully if the
      // database hasn't had the additive migration applied yet.
      let res = await supabase.from('trips').insert({ ...base, metadata }).select('id').single()
      if (res.error && /metadata/i.test(res.error.message)) {
        res = await supabase.from('trips').insert(base).select('id').single()
      }
      if (res.error) throw res.error
      insertedId = res.data.id

      navigate(`/trip/${insertedId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trip.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Hero */}
      <div className="animate-rise">
        <span className="eyebrow">Plan a new trip</span>
        <h1 className="font-display text-4xl font-semibold tracking-tight mt-1">
          {username ? `Where to, ${username}?` : 'Where to next?'}
        </h1>
        <p className="text-muted-foreground mt-2">
          Know the country but not the city? Let us find your perfect match.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trip basics */}
        <Card className="shadow-soft animate-rise" style={{ animationDelay: '60ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" />
              Destinations
            </CardTitle>
            <CardDescription>Add one or more stops for a multi-city adventure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="trip-title">Trip name</Label>
              <Input
                id="trip-title"
                placeholder="e.g. Summer in the Mediterranean"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label className="text-base">Stops</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setDestinations((p) => [...p, emptyDestination()])} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add stop
              </Button>
            </div>

            {destinations.map((dest, index) => (
              <div key={index} className="relative rounded-xl border p-4 space-y-3 bg-muted/30">
                {destinations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDestinations((p) => p.filter((_, i) => i !== index))}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove stop"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <div className="flex items-center justify-between pr-6">
                  <p className="eyebrow">Stop {index + 1}</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setPickerIndex(index)}
                    className="h-7 gap-1.5 bg-ocean text-ocean-foreground hover:bg-ocean/90"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Pick a city
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`city-${index}`}>City</Label>
                    <div className="relative">
                      <Input
                        id={`city-${index}`}
                        placeholder="Paris"
                        value={dest.city}
                        onChange={(e) => updateDestination(index, { city: e.target.value })}
                      />
                      {dest.countryCode && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-base">
                          {countryFlag(dest.countryCode)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`country-${index}`}>Country</Label>
                    <Input
                      id={`country-${index}`}
                      placeholder="France"
                      value={dest.country}
                      onChange={(e) => updateDestination(index, { country: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`from-${index}`} className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> Arrival
                    </Label>
                    <Input id={`from-${index}`} type="date" value={dest.from} onChange={(e) => updateDestination(index, { from: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`to-${index}`} className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> Departure
                    </Label>
                    <Input id={`to-${index}`} type="date" min={dest.from || undefined} value={dest.to} onChange={(e) => updateDestination(index, { to: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="shadow-soft animate-rise" style={{ animationDelay: '120ms' }}>
          <CardHeader>
            <CardTitle className="text-xl">Budget</CardTitle>
            <CardDescription>Set a budget per traveller — we’ll total it for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <TravellerBudgets travellers={travellers} currency={currency} onChange={setTravellers} />

            <AdvancedBudget
              enabled={advancedOn}
              onEnabledChange={setAdvancedOn}
              total={totalBudget}
              currency={currency}
              breakdown={breakdown}
              onChange={setBreakdown}
            />
          </CardContent>
        </Card>

        {/* Flights & stays */}
        <Card className="shadow-soft animate-rise" style={{ animationDelay: '180ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Compass className="h-5 w-5 text-primary" /> Flights & stays
            </CardTitle>
            <CardDescription>Search options and save your favourites to the trip.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="flights">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="flights" className="gap-1.5"><Plane className="h-4 w-4" /> Flights</TabsTrigger>
                <TabsTrigger value="hotels" className="gap-1.5"><BedDouble className="h-4 w-4" /> Stays</TabsTrigger>
              </TabsList>
              <TabsContent value="flights" className="pt-4">
                <FlightSearch
                  defaultTo={firstStop?.city ?? ''}
                  defaultDate={firstStop?.from ?? ''}
                  savedIds={savedFlights.map((f) => f.id)}
                  onSave={(f) => setSavedFlights((prev) => [...prev, f])}
                />
              </TabsContent>
              <TabsContent value="hotels" className="pt-4">
                <HotelSearch
                  defaultDestination={firstStop?.city ?? ''}
                  defaultCheckIn={firstStop?.from ?? ''}
                  defaultCheckOut={firstStop?.to ?? ''}
                  savedIds={savedHotels.map((h) => h.id)}
                  onSave={(h) => setSavedHotels((prev) => [...prev, h])}
                />
              </TabsContent>
            </Tabs>

            {(savedFlights.length > 0 || savedHotels.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {savedFlights.map((f) => (
                  <Badge key={f.id} variant="secondary" className="gap-1"><Plane className="h-3 w-3" /> {f.airline}</Badge>
                ))}
                {savedHotels.map((h) => (
                  <Badge key={h.id} variant="secondary" className="gap-1 max-w-[180px] truncate"><BedDouble className="h-3 w-3" /> {h.name}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Sticky save bar */}
        <div className="sticky bottom-4 z-30">
          <div className="flex items-center justify-between gap-4 rounded-2xl border bg-card/95 backdrop-blur px-4 py-3 shadow-lift">
            <div>
              <p className="text-xs text-muted-foreground">Total budget</p>
              <p className="font-display text-xl font-semibold">{formatMoney(totalBudget, currency)}</p>
            </div>
            <Button type="submit" size="lg" disabled={submitting} className="gap-1.5">
              {submitting ? 'Saving…' : <>Save to My Trips <Check className="h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      </form>

      <PickCityDialog
        open={pickerIndex !== null}
        onClose={() => setPickerIndex(null)}
        onPick={handleCityPick}
        initialCountryCode={pickerIndex !== null ? destinations[pickerIndex]?.countryCode : undefined}
      />
    </div>
  )
}
