// Lightweight currency + date formatting shared across the app.

const SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', JPY: '¥', CHF: 'CHF ',
}

export function currencySymbol(code: string): string {
  return SYMBOLS[code] ?? `${code} `
}

export function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount)
  } catch {
    // Fall back for non-ISO currency codes
    return `${currencySymbol(currency)}${amount.toLocaleString()}`
  }
}

export function formatDateRange(from: string | null, to: string | null): string {
  if (!from && !to) return 'Dates flexible'
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  if (from && to) return `${fmt(from)} → ${fmt(to)}`
  return fmt((from || to) as string)
}

export function nightsBetween(from: string, to: string): number {
  if (!from || !to) return 0
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}
