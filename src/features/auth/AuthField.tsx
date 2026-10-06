import { useId, useState, type ReactNode } from 'react'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { HideIcon } from '@/components/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function AuthField({
  label,
  registration,
  error,
  type = 'text',
  autoComplete,
  placeholder,
}: {
  label: string
  registration: UseFormRegisterReturn
  error?: FieldError
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
  placeholder?: string
}) {
  const uid = useId()
  const inputId = `${uid}-input`
  const errorId = `${uid}-error`
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const invalid = Boolean(error)

  return (
    <div className="w-full">
      <Label htmlFor={inputId} className="sr-only">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          autoComplete={autoComplete}
          placeholder={placeholder ?? label}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className={cn(
            'h-[50px] rounded-[10px] px-4 text-sm placeholder:text-khaki lg:h-10 lg:rounded-sm lg:px-4',
            isPassword && 'pr-12',
          )}
          {...registration}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-khaki hover:text-sand"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
          >
            <HideIcon aria-hidden className="size-5" />
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-coral">
          {error.message}
        </p>
      ) : null}
    </div>
  )
}

export function AuthFormError({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="text-center text-sm text-coral">
      {children}
    </p>
  )
}
