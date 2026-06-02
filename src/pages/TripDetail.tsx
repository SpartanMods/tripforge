import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPin, CalendarDays, Wallet, Users, Plane, BedDouble, Compass,
  Loader2, Trash2, ArrowLeft, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FlightSearch } from '@/components/trip/FlightSearch'
import { HotelSearch } from '@/components/trip/HotelSearch'
import { supabase } from '@/lib/supabase'
import { formatMoney, formatDateRange, nightsBetween } from '@/lib/format'
import { countryFlag } from '@/lib/interests'
import { BUDGET_CATEGORIES, type Trip, type SavedFlight, type SavedHotel, type TripMetadata } from '@/lib/types'

export function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('trips').select('*').eq('id', id).single()
      if (error) setError(error.message)
      else setTrip(data as Trip)
      setLoading(false)
    }
    load()
  }, [id])

  const meta: TripMetadata = trip?.metadata ?? {}
  const dests = Array.isArray(trip?.destinations) ? trip!.destinations : []

  // Persist a metadata patch, resilient to an un-migrated database.
  async function patchMeta(next: TripMetadata) {
    if (!trip) return
    setTrip({ ...trip, metadata: next })
    const res = await supabase.from('trips').update({ metadata: next }).eq('id', trip.id)
    if (res.error && !/metadata/i.test(res.error.message)) setError(res.error.message)
  }

  function saveFlight(f: SavedFlight) {
    patchMeta({ ...meta, savedFlights: [...(meta.savedFlights ?? []), f] })
  }
  function saveHotel(h: SavedHotel) {
    patchMeta({ ...meta, savedHotels: [...(meta.savedHotels ?? []), h] })
  }
  function removeFlight(idToRemove: string) {
    patchMeta({ ...meta, savedFlights: (meta.savedFlights ?? []).filter((f) => f.id !== idToRemove) })
  }
  function removeHotel(idToRemove: string) {
    patchMeta({ ...meta, savedHotels: (meta.savedHotels ?? []).filter((h) => h.id !== idToRemove) })
  }

  async function deleteTrip() {
    if (!trip || !confirm('Delete this trip permanently?')) return
    setDeleting(true)
    const { error } = await supabase.from('trips').delete().eq('id', trip.id)
    if (error) { setError(error.message); setDeleting(false); return }
    navigate('/')
  }

  if (loading) {
    return <div className="flex justify-center py-24 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }
  if (error || !trip) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <p className="text-muted-foreground">{error ?? 'Trip not found.'}</p>
        <Button asChild variant="outline"><Link to="/"><ArrowLeft className="h-4 w-4" /> Back to My Trips</Link></Button>
      </div>
    )
  }

  const firstStop = dests.find((d) => d.city)
  const savedFlights = meta.savedFlights ?? []
  const savedHotels = meta.savedHotels ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> My Trips
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-ocean/15 via-card to-primary/10 p-6 grain animate-rise">
        <div className="relative">
          <div className="flex items-center gap-1.5 text-3xl">
            {dests.slice(0, 6).map((d, j) => <span key={j}>{countryFlag(d.countryCode || '')}</span>)}
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight mt-2">{trip.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{dests.map((d) => d.city).filter(Boolean).join(' · ') || 'No stops'}</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDateRange(trip.start_date, trip.end_date)}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {trip.budget != null && (
              <Badge className="gap-1 bg-primary/90"><Wallet className="h-3 w-3" /> {formatMoney(trip.budget, trip.currency)}</Badge>
            )}
            {meta.travellers?.length ? (
              <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> {meta.travellers.length} travellers</Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* Stops */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Itinerary</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {dests.map((d, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{countryFlag(d.countryCode || '')} {d.city}{d.country ? `, ${d.country}` : ''}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(d.from, d.to)}
                  {d.from && d.to ? ` · ${nightsBetween(d.from, d.to)} nights` : ''}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Travellers & budget */}
      {(meta.travellers?.length || meta.budgetBreakdown) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Budget</CardTitle>
            <CardDescription>Total {formatMoney(trip.budget ?? 0, trip.currency)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {meta.travellers?.length ? (
              <div className="space-y-2">
                {meta.travellers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-ocean/10 text-xs font-semibold text-ocean">
                        {(t.name.trim()[0] || '?').toUpperCase()}
                      </span>
                      {t.name || 'Traveller'}
                    </span>
                    <span className="font-medium">{formatMoney(t.budget, trip.currency)}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {meta.budgetBreakdown && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                  {BUDGET_CATEGORIES.map((c) => {
                    const v = meta.budgetBreakdown![c.key] || 0
                    if (!v) return null
                    return (
                      <div key={c.key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{c.icon} {c.label}</span>
                        <span className="font-medium">{formatMoney(v, trip.currency)}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Saved flights & hotels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Compass className="h-4 w-4 text-primary" /> Flights & stays</CardTitle>
          <CardDescription>Search and save options to this trip.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(savedFlights.length > 0 || savedHotels.length > 0) && (
            <div className="space-y-2">
              {savedFlights.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{f.airline}</p>
                    <p className="text-xs text-muted-foreground">{f.from || '—'} → {f.to || '—'}{f.date ? ` · ${f.date}` : ''}</p>
                  </div>
                  <span className="font-semibold text-sm">{formatMoney(f.price, f.currency)}</span>
                  <button onClick={() => removeFlight(f.id)} aria-label="Remove flight" className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {savedHotels.map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{h.name}</p>
                    <p className="text-xs text-muted-foreground">★ {h.rating} · {h.city}</p>
                  </div>
                  <span className="font-semibold text-sm">{formatMoney(h.pricePerNight, h.currency)}/night</span>
                  <button onClick={() => removeHotel(h.id)} aria-label="Remove hotel" className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                </div>
              ))}
              <Separator />
            </div>
          )}

          <Tabs defaultValue="flights">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flights" className="gap-1.5"><Plane className="h-4 w-4" /> Flights</TabsTrigger>
              <TabsTrigger value="hotels" className="gap-1.5"><BedDouble className="h-4 w-4" /> Stays</TabsTrigger>
            </TabsList>
            <TabsContent value="flights" className="pt-4">
              <FlightSearch defaultTo={firstStop?.city ?? ''} defaultDate={firstStop?.from ?? ''} savedIds={savedFlights.map((f) => f.id)} onSave={saveFlight} />
            </TabsContent>
            <TabsContent value="hotels" className="pt-4">
              <HotelSearch defaultDestination={firstStop?.city ?? ''} defaultCheckIn={firstStop?.from ?? ''} defaultCheckOut={firstStop?.to ?? ''} savedIds={savedHotels.map((h) => h.id)} onSave={saveHotel} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-2">
        <Button variant="outline" asChild><Link to="/plan">Plan another trip</Link></Button>
        <Button variant="ghost" onClick={deleteTrip} disabled={deleting} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
          <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete trip'}
        </Button>
      </div>
    </div>
  )
}
