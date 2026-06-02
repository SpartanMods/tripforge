import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, CalendarDays, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'

interface Destination {
  city: string
  country: string
  from: string
  to: string
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF']

function emptyDestination(): Destination {
  return { city: '', country: '', from: '', to: '' }
}

export function Home() {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  // Trip form state
  const [title, setTitle] = useState('')
  const [destinations, setDestinations] = useState<Destination[]>([emptyDestination()])
  const [budget, setBudget] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [travellers, setTravellers] = useState(1)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/auth', { replace: true }); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      if (profile) setUsername(profile.username)
    }
    loadUser()
  }, [navigate])

  function updateDestination(index: number, field: keyof Destination, value: string) {
    setDestinations((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    )
  }

  function addDestination() {
    setDestinations((prev) => [...prev, emptyDestination()])
  }

  function removeDestination(index: number) {
    setDestinations((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const filled = destinations.filter((d) => d.city.trim())
    if (filled.length === 0) {
      setError('Add at least one destination.')
      return
    }

    const invalidDates = filled.some((d) => d.from && d.to && d.from > d.to)
    if (invalidDates) {
      setError('Check-out dates must be after check-in dates.')
      return
    }

    setSubmitting(true)
    try {
      const startDate = filled[0].from || null
      const endDate = filled[filled.length - 1].to || null

      const { data, error: insertError } = await supabase
        .from('trips')
        .insert({
          title: title.trim(),
          destinations: filled,
          start_date: startDate,
          end_date: endDate,
          budget: budget ? parseFloat(budget) : null,
          currency,
          owner_id: userId,
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      navigate(`/trip/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {username ? `Hey, ${username} 👋` : 'Welcome back!'}
        </h1>
        <p className="text-muted-foreground mt-1">Where are you off to next?</p>
      </div>

      {/* Trip creation form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Plan a new trip
          </CardTitle>
          <CardDescription>
            Add one or more destinations — perfect for multi-city adventures.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trip title */}
            <div className="space-y-1.5">
              <Label htmlFor="trip-title">Trip name</Label>
              <Input
                id="trip-title"
                placeholder="e.g. Summer Europe Tour"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <Separator />

            {/* Destinations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Destinations</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDestination}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add stop
                </Button>
              </div>

              {destinations.map((dest, index) => (
                <div
                  key={index}
                  className="relative rounded-lg border p-4 space-y-3 bg-muted/30"
                >
                  {/* Remove button */}
                  {destinations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDestination(index)}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove destination"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Stop {index + 1}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`city-${index}`}>City</Label>
                      <Input
                        id={`city-${index}`}
                        placeholder="Paris"
                        value={dest.city}
                        onChange={(e) => updateDestination(index, 'city', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`country-${index}`}>Country</Label>
                      <Input
                        id={`country-${index}`}
                        placeholder="France"
                        value={dest.country}
                        onChange={(e) => updateDestination(index, 'country', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`from-${index}`} className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Arrival
                      </Label>
                      <Input
                        id={`from-${index}`}
                        type="date"
                        value={dest.from}
                        onChange={(e) => updateDestination(index, 'from', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`to-${index}`} className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Departure
                      </Label>
                      <Input
                        id={`to-${index}`}
                        type="date"
                        value={dest.to}
                        min={dest.from || undefined}
                        onChange={(e) => updateDestination(index, 'to', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Budget + travellers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="trip-budget">Total budget</Label>
                <div className="flex gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    aria-label="Currency"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Input
                    id="trip-budget"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="5000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="trip-travellers">Travellers</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setTravellers((n) => Math.max(1, n - 1))}
                    disabled={travellers <= 1}
                    aria-label="Decrease travellers"
                  >
                    −
                  </Button>
                  <Input
                    id="trip-travellers"
                    type="number"
                    min="1"
                    value={travellers}
                    onChange={(e) => setTravellers(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setTravellers((n) => n + 1)}
                    aria-label="Increase travellers"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? 'Creating trip…' : 'Start planning →'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
