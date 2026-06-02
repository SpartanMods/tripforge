import { cn } from '@/lib/utils'

interface SliderProps {
  value: number
  min?: number
  max: number
  step?: number
  onValueChange: (value: number) => void
  className?: string
  'aria-label'?: string
}

// Native range input styled via the .range-clay rules in index.css.
// A gradient fill tracks the current value for a polished feel.
export function Slider({
  value,
  min = 0,
  max,
  step = 1,
  onValueChange,
  className,
  ...rest
}: SliderProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={rest['aria-label']}
      onChange={(e) => onValueChange(Number(e.target.value))}
      className={cn('range-clay w-full', className)}
      style={{
        background: `linear-gradient(to right, hsl(var(--primary)) ${pct}%, hsl(var(--secondary)) ${pct}%)`,
      }}
    />
  )
}
