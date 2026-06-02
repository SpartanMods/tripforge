import { Plus, Trash2, Users, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { currencySymbol, formatMoney } from '@/lib/format'
import type { Traveller } from '@/lib/types'

interface TravellerBudgetsProps {
  travellers: Traveller[]
  currency: string
  onChange: (travellers: Traveller[]) => void
}

let idCounter = 0
export function newTraveller(name = ''): Traveller {
  idCounter += 1
  return { id: `t-${Date.now()}-${idCounter}`, name, budget: 0 }
}

export function TravellerBudgets({ travellers, currency, onChange }: TravellerBudgetsProps) {
  const total = travellers.reduce((sum, t) => sum + (t.budget || 0), 0)

  function update(id: string, field: keyof Traveller, value: string | number) {
    onChange(travellers.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  function add() {
    onChange([...travellers, newTraveller()])
  }

  function remove(id: string) {
    onChange(travellers.filter((t) => t.id !== id))
  }

  // Split the current total evenly across everyone.
  function splitEvenly() {
    if (travellers.length === 0) return
    const each = Math.round((total / travellers.length) * 100) / 100
    onChange(travellers.map((t) => ({ ...t, budget: each })))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Travellers & budgets
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add traveller
        </Button>
      </div>

      <div className="space-y-2.5">
        {travellers.map((t, i) => (
          <div
            key={t.id}
            className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ocean/10 text-sm font-semibold text-ocean">
              {(t.name.trim()[0] || (i + 1)).toString().toUpperCase()}
            </div>
            <Input
              aria-label={`Traveller ${i + 1} name`}
              placeholder={`Traveller ${i + 1}`}
              value={t.name}
              onChange={(e) => update(t.id, 'name', e.target.value)}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-1"
            />
            <div className="flex items-center rounded-md border border-input bg-background px-2">
              <span className="text-sm text-muted-foreground">{currencySymbol(currency)}</span>
              <Input
                aria-label={`Traveller ${i + 1} budget`}
                type="number"
                min="0"
                step="50"
                placeholder="0"
                value={t.budget || ''}
                onChange={(e) => update(t.id, 'budget', parseFloat(e.target.value) || 0)}
                className="w-24 border-0 bg-transparent shadow-none focus-visible:ring-0 px-1 text-right"
              />
            </div>
            {travellers.length > 1 && (
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Remove traveller"
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {travellers.length > 1 && (
        <button
          type="button"
          onClick={splitEvenly}
          className="text-xs font-medium text-primary hover:underline"
        >
          Split total evenly across {travellers.length} travellers
        </button>
      )}

      {/* Live total */}
      <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Wallet className="h-4 w-4 text-primary" />
          Total trip budget
        </span>
        <span className="font-display text-2xl font-semibold text-primary">
          {formatMoney(total, currency)}
        </span>
      </div>
    </div>
  )
}
