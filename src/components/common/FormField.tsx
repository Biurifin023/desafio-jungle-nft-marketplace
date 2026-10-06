import { cloneElement, useId, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'

export function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: ReactElement<Record<string, unknown>>
}) {
  const uid = useId()
  const inputId = `${uid}-input`
  const errorId = `${uid}-error`
  const field = cloneElement(children, {
    id: inputId,
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': error ? errorId : undefined,
    'aria-required': required || undefined,
  })

  return (
    <div>
      <Label htmlFor={inputId} className="mb-2 block text-[15px] font-medium text-cream">
        {label}
      </Label>
      {field}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-coral">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="text-sm text-coral">
      {children}
    </p>
  )
}

export const selectClassName =
  'select-native h-10 w-full rounded-xs border border-input bg-transparent pl-3 text-sm text-cream outline-none focus-visible:border-copper focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_option]:bg-surface [&_option]:text-cream [&_option:checked]:bg-copper [&_option:checked]:text-ink'
