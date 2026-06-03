import { useEffect, useRef, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { CalendarDays, X } from 'lucide-react'
import { formatDateRange, nightsBetween } from '@/lib/format'

interface DateRangePickerProps {
  from: string // ISO yyyy-mm-dd
  to: string
  onChange: (range: { from: string; to: string }) => void
  /** Disable days before this ISO date. */
  minDate?: string
}

function toDate(iso?: string): Date | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// A single trigger that opens a calendar popover for choosing a start and end
// date in one clean pass — replacing the pair of native date inputs.
export function DateRangePicker({ from, to, onChange, minDate }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected: DateRange | undefined = toDate(from)
    ? { from: toDate(from), to: toDate(to) }
    : undefined

  function handleSelect(range: DateRange | undefined) {
    onChange({
      from: range?.from ? toIso(range.from) : '',
      to: range?.to ? toIso(range.to) : '',
    })
    if (range?.from && range?.to) setOpen(false)
  }

  const hasDates = !!(from || to)
  const nights = from && to ? nightsBetween(from, to) : 0

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm transition-colors hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className={hasDates ? '' : 'text-muted-foreground'}>
          {hasDates ? formatDateRange(from || null, to || null) : 'Add dates'}
        </span>
        {nights > 0 && (
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </span>
        )}
        {hasDates && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear dates"
            onClick={(e) => { e.stopPropagation(); onChange({ from: '', to: '' }) }}
            className={`${nights > 0 ? '' : 'ml-auto'} text-muted-foreground hover:text-destructive`}
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 rounded-xl border bg-popover p-2 shadow-lift">
          <DayPicker
            mode="range"
            numberOfMonths={1}
            defaultMonth={toDate(from) ?? toDate(minDate) ?? new Date()}
            selected={selected}
            onSelect={handleSelect}
            disabled={minDate ? { before: toDate(minDate)! } : undefined}
            weekStartsOn={1}
          />
        </div>
      )}
    </div>
  )
}
