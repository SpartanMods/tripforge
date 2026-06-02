import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, MapPin, CalendarDays, Wallet, Users, Compass, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { formatMoney, formatDateRange } from '@/lib/format'
import { countryFlag } from '@/lib/interests'
import type { Trip } from '@/lib/types'

export function MyTrips() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/auth', { replace: true }); return }

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setTrips((data ?? []) as Trip[])
      setLoading(false)
    }
    load()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-end justify-between gap-4 animate-rise">
        <div>
          <span className="eyebrow">Your journeys</span>
          <h1 className="font-display text-4xl font-semibold tracking-tight mt-1">My Trips</h1>
        </div>
        <Button asChild className="gap-1.5">
          <Link to="/plan"><Plus className="h-4 w-4" /> New trip</Link>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {trips.length === 0 ? (
        <Card className="border-dashed shadow-none animate-rise">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary">
              <Compass className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">No trips yet</h2>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Start planning your next adventure — pick a country and we’ll help you find the perfect city.
              </p>
            </div>
            <Button asChild size="lg" className="gap-1.5">
              <Link to="/plan"><Plus className="h-4 w-4" /> Plan your first trip</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trips.map((trip, i) => {
            const dests = Array.isArray(trip.destinations) ? trip.destinations : []
            const travellerCount = trip.metadata?.travellers?.length
            return (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}`}
                className="group block animate-rise"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-lift">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-1 text-2xl">
                      {dests.slice(0, 4).map((d, j) => (
                        <span key={j}>{countryFlag(d.countryCode || '')}</span>
                      ))}
                    </div>
                    <h3 className="font-display text-xl font-semibold leading-tight group-hover:text-primary transition-colors">
                      {trip.title}
                    </h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {dests.length ? dests.map((d) => d.city).filter(Boolean).join(' · ') : 'No stops yet'}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      {formatDateRange(trip.start_date, trip.end_date)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {trip.budget != null && (
                        <Badge variant="secondary" className="gap-1">
                          <Wallet className="h-3 w-3" /> {formatMoney(trip.budget, trip.currency)}
                        </Badge>
                      )}
                      {travellerCount ? (
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" /> {travellerCount}
                        </Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
