import { useState } from 'react'
import { BedDouble, Loader2, Search, Check, Plus, Star, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMoney } from '@/lib/format'
import { searchHotels, hotelsApiConfigured, type HotelOffer } from '@/services/hotels'
import type { SavedHotel } from '@/lib/types'

interface HotelSearchProps {
  defaultDestination?: string
  defaultCheckIn?: string
  defaultCheckOut?: string
  savedIds: string[]
  onSave: (hotel: SavedHotel) => void
}

export function HotelSearch({
  defaultDestination = '',
  defaultCheckIn = '',
  defaultCheckOut = '',
  savedIds,
  onSave,
}: HotelSearchProps) {
  const [destination, setDestination] = useState(defaultDestination)
  const [checkIn, setCheckIn] = useState(defaultCheckIn)
  const [checkOut, setCheckOut] = useState(defaultCheckOut)
  const [loading, setLoading] = useState(false)
  const [offers, setOffers] = useState<HotelOffer[] | null>(null)
  const [live, setLive] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!destination) return
    setLoading(true)
    try {
      const res = await searchHotels({ destination, checkIn, checkOut, guests: 2, rooms: 1 })
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
            <Label htmlFor="ht-dest">Destination</Label>
            <Input id="ht-dest" placeholder="City" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ht-in">Check-in</Label>
            <Input id="ht-in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ht-out">Check-out</Label>
            <Input id="ht-out" type="date" min={checkIn || undefined} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={loading || !destination} className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Searching stays…' : 'Search stays'}
        </Button>
      </form>

      {offers && !live && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          {hotelsApiConfigured()
            ? 'Showing sample results.'
            : 'Showing sample results — add a RapidAPI key to see live availability.'}
        </p>
      )}

      {offers && (
        <div className="space-y-2">
          {offers.length === 0 && <p className="text-sm text-muted-foreground">No stays found.</p>}
          {offers.map((o, i) => {
            const saved = savedIds.includes(o.id)
            return (
              <div
                key={o.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 animate-rise"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary">
                  <BedDouble className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{o.name}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-honey text-honey" />
                    {o.rating} · {o.reviewCount.toLocaleString()} reviews
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-lg font-semibold">{formatMoney(o.pricePerNight, o.currency)}</p>
                  <p className="text-[11px] text-muted-foreground -mt-0.5">per night</p>
                  <Button
                    type="button"
                    size="sm"
                    variant={saved ? 'secondary' : 'outline'}
                    disabled={saved}
                    onClick={() =>
                      onSave({
                        id: o.id,
                        name: o.name,
                        city: destination,
                        pricePerNight: o.pricePerNight,
                        currency: o.currency,
                        rating: o.rating,
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
