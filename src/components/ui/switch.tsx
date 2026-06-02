import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  'aria-label'?: string
  className?: string
}

// Accessible toggle built on a native button — no extra dependency.
export function Switch({ checked, onCheckedChange, id, className, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={rest['aria-label']}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-secondary',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-card shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
