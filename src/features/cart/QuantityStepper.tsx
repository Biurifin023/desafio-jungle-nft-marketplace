import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function QuantityStepper({
  value,
  min = 1,
  max,
  name,
  disabled,
  onDecrease,
  onIncrease,
  variant = 'desktop',
}: {
  value: number
  min?: number
  max: number
  name: string
  disabled?: boolean
  onDecrease: () => void
  onIncrease: () => void
  variant?: 'desktop' | 'mobile'
}) {
  const canDecrease = !disabled && value > min
  const canIncrease = !disabled && max > 0 && value < max

  return (
    <div className={cn('flex items-center', variant === 'desktop' ? 'justify-center gap-3' : 'gap-2')}>
      <StepperButton
        variant={variant}
        label={`Diminuir quantidade de ${name}`}
        disabled={!canDecrease}
        onClick={onDecrease}
      >
        <span aria-hidden className={cn('block h-px w-2', variant === 'desktop' ? 'bg-ink' : 'bg-current')} />
      </StepperButton>
      <span data-testid="cart-item-qty" className={cn('tabular-nums text-cream', variant === 'desktop' ? 'text-[17px] leading-6' : 'min-w-4 text-center text-base')}>
        {value}
      </span>
      <StepperButton
        variant={variant}
        label={`Aumentar quantidade de ${name}`}
        disabled={!canIncrease}
        onClick={onIncrease}
      >
        <span aria-hidden className={cn('relative block size-2.5', variant === 'desktop' ? 'text-ink' : 'text-current')}>
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
          <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current" />
        </span>
      </StepperButton>
    </div>
  )
}

function StepperButton({
  variant,
  label,
  disabled,
  onClick,
  children,
}: {
  variant: 'desktop' | 'mobile'
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid place-items-center transition-opacity disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'desktop'
          ? 'h-[30px] w-5 rounded-full bg-copper text-ink shadow-card'
          : 'size-6 rounded-full border border-border bg-surface-2 text-cream',
      )}
    >
      {children}
    </button>
  )
}
