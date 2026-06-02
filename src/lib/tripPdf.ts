// ============================================================
// Trip → PDF export
//
// Builds a branded, single-or-multi-page itinerary PDF entirely in the
// browser with jsPDF (no server, no network). Exposes helpers to either
// download the file or hand it to the native share sheet on mobile.
//
// Note: jsPDF's built-in fonts don't render emoji, so we deliberately use
// plain text labels here (no flag / category emoji).
// ============================================================
import { jsPDF } from 'jspdf'
import { formatMoney, formatDateRange, nightsBetween } from './format'
import { BUDGET_CATEGORIES, type Trip, type TripMetadata } from './types'

// Warm editorial palette (RGB)
const INK: [number, number, number] = [38, 33, 28]
const TERRACOTTA: [number, number, number] = [188, 92, 56]
const MUTED: [number, number, number] = [122, 112, 102]
const OCEAN: [number, number, number] = [44, 104, 110]
const CREAM: [number, number, number] = [249, 243, 235]
const LINE: [number, number, number] = [223, 214, 203]

const PAGE_W = 595.28 // A4 width in pt
const PAGE_H = 841.89 // A4 height in pt
const MARGIN = 48
const CONTENT_W = PAGE_W - MARGIN * 2

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'trip'
}

export function tripPdfFilename(trip: Trip): string {
  return `${slugify(trip.title)}-tripforge.pdf`
}

export function buildTripPdf(trip: Trip): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const meta: TripMetadata = trip.metadata ?? {}
  const dests = Array.isArray(trip.destinations) ? trip.destinations : []

  let y = 0

  // --- helpers -------------------------------------------------
  const setFont = (style: 'normal' | 'bold' | 'italic', size: number, color = INK) => {
    const family = style === 'italic' ? 'times' : 'helvetica'
    doc.setFont(family, style)
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
  }
  const ensure = (space: number) => {
    if (y + space > PAGE_H - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }
  const sectionHeading = (label: string) => {
    ensure(46)
    y += 10
    setFont('bold', 8, TERRACOTTA)
    doc.text(label.toUpperCase(), MARGIN, y, { charSpace: 1.5 })
    y += 8
    doc.setDrawColor(LINE[0], LINE[1], LINE[2])
    doc.setLineWidth(0.75)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 16
  }
  const row = (left: string, right: string, opts: { strong?: boolean; muted?: boolean } = {}) => {
    ensure(20)
    setFont(opts.strong ? 'bold' : 'normal', 10.5, opts.muted ? MUTED : INK)
    doc.text(left, MARGIN, y)
    if (right) {
      setFont(opts.strong ? 'bold' : 'normal', 10.5, INK)
      doc.text(right, PAGE_W - MARGIN, y, { align: 'right' })
    }
    y += 18
  }

  // --- header band ---------------------------------------------
  doc.setFillColor(CREAM[0], CREAM[1], CREAM[2])
  doc.rect(0, 0, PAGE_W, 132, 'F')
  doc.setFillColor(TERRACOTTA[0], TERRACOTTA[1], TERRACOTTA[2])
  doc.rect(0, 0, PAGE_W, 6, 'F')

  setFont('bold', 9, TERRACOTTA)
  doc.text('TRIPFORGE', MARGIN, 40, { charSpace: 2 })

  setFont('italic', 28, INK)
  const titleLines = doc.splitTextToSize(trip.title, CONTENT_W)
  doc.text(titleLines.slice(0, 2), MARGIN, 72)

  setFont('normal', 10.5, MUTED)
  const stops = dests.map((d) => d.city).filter(Boolean).join('  ·  ') || 'No stops yet'
  const dateStr = formatDateRange(trip.start_date, trip.end_date)
  doc.text(`${dateStr}    |    ${stops}`, MARGIN, 112, { maxWidth: CONTENT_W })

  y = 160

  // --- itinerary -----------------------------------------------
  if (dests.length) {
    sectionHeading('Itinerary')
    dests.forEach((d, i) => {
      ensure(34)
      setFont('bold', 11.5, INK)
      const place = `${i + 1}.  ${d.city}${d.country ? `, ${d.country}` : ''}`
      doc.text(place, MARGIN, y)
      const nights = d.from && d.to ? nightsBetween(d.from, d.to) : 0
      setFont('normal', 10, MUTED)
      const when = formatDateRange(d.from, d.to) + (nights ? `  ·  ${nights} night${nights === 1 ? '' : 's'}` : '')
      doc.text(when, PAGE_W - MARGIN, y, { align: 'right' })
      y += 22
    })
  }

  // --- budget --------------------------------------------------
  const travellers = meta.travellers ?? []
  const breakdown = meta.budgetBreakdown
  if (trip.budget != null || travellers.length || breakdown) {
    sectionHeading('Budget')
    if (trip.budget != null) {
      row('Total budget', formatMoney(trip.budget, trip.currency), { strong: true })
    }
    if (travellers.length) {
      y += 2
      setFont('bold', 8.5, OCEAN)
      doc.text('PER TRAVELLER', MARGIN, y, { charSpace: 1 })
      y += 16
      travellers.forEach((t) =>
        row(t.name || 'Traveller', formatMoney(t.budget, trip.currency)),
      )
    }
    if (breakdown) {
      y += 2
      setFont('bold', 8.5, OCEAN)
      doc.text('BY CATEGORY', MARGIN, y, { charSpace: 1 })
      y += 16
      BUDGET_CATEGORIES.forEach((c) => {
        const v = breakdown[c.key] || 0
        if (v) row(c.label, formatMoney(v, trip.currency), { muted: true })
      })
    }
  }

  // --- flights -------------------------------------------------
  const flights = meta.savedFlights ?? []
  if (flights.length) {
    sectionHeading('Flights')
    flights.forEach((f) => {
      const route = `${f.airline}  —  ${f.from || '?'} to ${f.to || '?'}${f.date ? `  (${f.date})` : ''}`
      row(route, formatMoney(f.price, f.currency))
    })
  }

  // --- stays ---------------------------------------------------
  const hotels = meta.savedHotels ?? []
  if (hotels.length) {
    sectionHeading('Stays')
    hotels.forEach((h) => {
      const desc = `${h.name}  —  ${h.city}  ·  ${h.rating}★`
      row(desc, `${formatMoney(h.pricePerNight, h.currency)}/night`)
    })
  }

  // --- footer on every page ------------------------------------
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    setFont('normal', 8, MUTED)
    doc.text('Forged with TripForge · forge your next journey', MARGIN, PAGE_H - 24)
    doc.text(`${p} / ${pages}`, PAGE_W - MARGIN, PAGE_H - 24, { align: 'right' })
  }

  return doc
}

export function downloadTripPdf(trip: Trip) {
  buildTripPdf(trip).save(tripPdfFilename(trip))
}

// True when the browser can share actual files (mobile Safari/Chrome).
export function canShareTripPdf(): boolean {
  try {
    const probe = new File([new Blob()], 'probe.pdf', { type: 'application/pdf' })
    return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

// Share via the native sheet when possible; otherwise fall back to download.
// Returns 'shared' | 'downloaded' | 'cancelled'.
export async function shareTripPdf(trip: Trip): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const doc = buildTripPdf(trip)
  const filename = tripPdfFilename(trip)
  const blob = doc.output('blob')
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (canShareTripPdf()) {
    try {
      await navigator.share({
        files: [file],
        title: trip.title,
        text: `${trip.title} — my TripForge itinerary`,
      })
      return 'shared'
    } catch (err) {
      // User dismissed the share sheet
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      // Anything else: fall through to a download so the user still gets the file
    }
  }

  doc.save(filename)
  return 'downloaded'
}
