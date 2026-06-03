import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, MapPin, CalendarDays, Wallet, Users, Compass, Loader2, Share2, Download, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { formatMoney, formatDateRange } from '@/lib/format'
import { countryFlag } from '@/lib/interests'
import { canShareFiles } from '@/lib/share'
import type { Trip } from '@/lib/types'

export function MyTrips() {
  const navigate = useNavigate()
  const [owned, setOwned] = useState<Trip[]>([])
  const [shared, setShared] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharingId, setSharingId] = useState<string | null>(null)

  // Export a trip without navigating into it (cards are links). jsPDF is
  // imported on demand so it stays out of the initial bundle.
  async function handleShare(e: React.MouseEvent, trip: Trip) {
    e.preventDefault()
    e.stopPropagation()
    setSharingId(trip.id)
    try {
      const { shareTripPdf } = await import('@/lib/tripPdf')
      await shareTripPdf(trip)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export this trip.')
    } finally {
      setSharingId(null)
    }
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/auth', { replace: true }); return }

      // RLS returns trips you own AND trips shared with you; split by owner.
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else {
        const all = (data ?? []) as Trip[]
        setOwned(all.filter((t) => t.owner_id === user.id))
        setShared(all.filter((t) => t.owner_id !== user.id))
      }
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

  function TripCard({ trip, i, isShared }: { trip: Trip; i: number; isShared?: boolean }) {
    const dests = Array.isArray(trip.destinations) ? trip.destinations : []
    const travellerCount = trip.metadata?.travellers?.length
    return (
      <Link
        to={`/trip/${trip.id}`}
        className="group block animate-rise"
        style={{ animationDelay: `${i * 60}ms` }}
      >
        <Card className="relative h-full transition-all hover:-translate-y-0.5 hover:shadow-lift">
          <button
            type="button"
            onClick={(e) => handleShare(e, trip)}
            disabled={sharingId === trip.id}
            aria-label={`Share ${trip.title}`}
            title={canShareFiles() ? 'Share itinerary' : 'Download PDF'}
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-primary hover:border-primary/40 disabled:opacity-60"
          >
            {sharingId === trip.id
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : canShareFiles()
                ? <Share2 className="h-4 w-4" />
                : <Download className="h-4 w-4" />}
          </button>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-1 text-2xl pr-10">
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
              {isShared && (
                <Badge className="gap-1 bg-ocean/90"><UserCircle2 className="h-3 w-3" /> Shared with you</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  const EmptyOwned = (
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
  )

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

      <Tabs defaultValue="mine">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="mine">My trips ({owned.length})</TabsTrigger>
          <TabsTrigger value="shared">Shared ({shared.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="pt-6">
          {owned.length === 0 ? EmptyOwned : (
            <div className="grid gap-4 sm:grid-cols-2">
              {owned.map((trip, i) => <TripCard key={trip.id} trip={trip} i={i} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="pt-6">
          {shared.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold">Nothing shared yet</h2>
                <p className="text-muted-foreground max-w-sm">
                  When a friend adds you to a trip, it shows up here. Add friends from the Friends tab.
                </p>
                <Button asChild variant="outline" className="gap-1.5">
                  <Link to="/friends"><Users className="h-4 w-4" /> Go to Friends</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {shared.map((trip, i) => <TripCard key={trip.id} trip={trip} i={i} isShared />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
