import { SlidersHorizontal, Wand2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { formatMoney } from '@/lib/format'
import { BUDGET_CATEGORIES, emptyBreakdown, type BudgetBreakdown } from '@/lib/types'

interface AdvancedBudgetProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  total: number
  currency: string
  breakdown: BudgetBreakdown
  onChange: (breakdown: BudgetBreakdown) => void
}

// A sensible default split of a total budget across categories (sums to 100%).
const SUGGESTED: Record<keyof BudgetBreakdown, number> = {
  flights: 0.3,
  hotels: 0.28,
  food: 0.16,
  activities: 0.12,
  transport: 0.06,
  shopping: 0.05,
  other: 0.03,
}

export function AdvancedBudget({
  enabled,
  onEnabledChange,
  total,
  currency,
  breakdown,
  onChange,
}: AdvancedBudgetProps) {
  const allocated = BUDGET_CATEGORIES.reduce((sum, c) => sum + (breakdown[c.key] || 0), 0)
  const remaining = total - allocated
  const overAllocated = remaining < -0.5

  function setCategory(key: keyof BudgetBreakdown, value: number) {
    onChange({ ...breakdown, [key]: Math.max(0, Math.round(value)) })
  }

  function autoSplit() {
    if (total <= 0) {
      onChange(emptyBreakdown())
      return
    }
    const next = { ...emptyBreakdown() }
    BUDGET_CATEGORIES.forEach((c) => {
      next[c.key] = Math.round(total * SUGGESTED[c.key])
    })
    onChange(next)
  }

  return (
    <div className="rounded-xl border bg-card">
      {/* Toggle row */}
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ocean/10 text-ocean">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium leading-tight">Advanced budget</p>
            <p className="text-sm text-muted-foreground">
              Optional — decide how much goes to flights, hotels, food and more.
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} aria-label="Toggle advanced budget" />
      </div>

      {enabled && (
        <div className="border-t p-4 space-y-5 animate-rise">
          {/* Allocation summary bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Allocated {formatMoney(allocated, currency)} of {formatMoney(total, currency)}
              </span>
              <button
                type="button"
                onClick={autoSplit}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <Wand2 className="h-3.5 w-3.5" /> Auto-split
              </button>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="flex h-full">
                {BUDGET_CATEGORIES.map((c, i) => {
                  const pct = total > 0 ? ((breakdown[c.key] || 0) / total) * 100 : 0
                  // Alternate clay / ocean tones across segments
                  const color = i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--ocean))'
                  return (
                    <div
                      key={c.key}
                      style={{ width: `${pct}%`, background: color }}
                      className="h-full transition-all"
                    />
                  )
                })}
              </div>
            </div>
            <p
              className={`text-sm font-medium ${
                overAllocated ? 'text-destructive' : remaining < 0.5 && remaining > -0.5 ? 'text-success' : 'text-muted-foreground'
              }`}
            >
              {overAllocated
                ? `Over budget by ${formatMoney(Math.abs(remaining), currency)}`
                : `${formatMoney(remaining, currency)} left to allocate`}
            </p>
          </div>

          {/* Category sliders */}
          <div className="space-y-4">
            {BUDGET_CATEGORIES.map((c) => {
              const value = breakdown[c.key] || 0
              const max = Math.max(total, value, 500)
              return (
                <div key={c.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span>{c.icon}</span>
                      {c.label}
                    </span>
                    <span className="font-semibold tabular-nums">{formatMoney(value, currency)}</span>
                  </div>
                  <Slider
                    value={value}
                    max={max}
                    step={25}
                    onValueChange={(v) => setCategory(c.key, v)}
                    aria-label={`${c.label} budget`}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
