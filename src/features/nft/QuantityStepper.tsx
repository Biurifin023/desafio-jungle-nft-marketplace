import type { ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
  size = 'desktop',
  label = 'Quantidade',
}: {
  value: number
  min?: number
  max: number
  onChange: (next: number) => void
  disabled?: boolean
  size?: 'desktop' | 'mobile'
  label?: string
}) {
  const atMin = value <= min || disabled || max <= 0
  const atMax = value >= max || disabled || max <= 0
  const compact = size === 'mobile'

  return (
    <div className={cn('flex items-center', compact ? 'gap-3' : 'gap-3')} role="group" aria-label={label}>
      <StepperButton
        label="Diminuir quantidade"
        disabled={atMin}
        compact={compact}
        onClick={() => onChange(value - 1)}
      >
        <Minus aria-hidden className={compact ? 'size-2.5' : 'size-3.5'} strokeWidth={3} />
      </StepperButton>
      <span aria-live="polite" className={cn('min-w-[1.25ch] text-center text-cream', compact ? 'text-lg font-medium' : 'text-xl')}>
        {value}
      </span>
      <StepperButton
        label="Aumentar quantidade"
        disabled={atMax}
        compact={compact}
        onClick={() => onChange(value + 1)}
      >
        <Plus aria-hidden className={compact ? 'size-2.5' : 'size-3.5'} strokeWidth={3} />
      </StepperButton>
    </div>
  )
}

function StepperButton({
  label,
  disabled,
  compact,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  compact: boolean
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
        'grid place-items-center border border-ink bg-copper text-ink shadow-card disabled:cursor-not-allowed disabled:opacity-40',
        compact ? 'h-[30px] w-5 rounded-full' : 'h-[50px] w-[33px] rounded-[33px]',
      )}
    >
      {children}
    </button>
  )
}
