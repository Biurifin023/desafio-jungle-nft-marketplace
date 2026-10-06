import type { ReactNode } from 'react'
import { AlertTriangle, RefreshCw, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/http'
import { cn } from '@/lib/utils'

export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.') {
  if (isApiError(error)) return error.message
  return fallback
}

/** Estado de erro com nova tentativa (role=alert para leitores de tela). */
export function ErrorState({
  error,
  onRetry,
  title = 'Não foi possível carregar',
  className,
}: {
  error: unknown
  onRetry?: () => void
  title?: string
  className?: string
}) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 rounded-md bg-surface px-6 py-10 text-center', className)}>
      <AlertTriangle aria-hidden className="size-8 text-coral" />
      <p className="text-lg font-bold text-cream">{title}</p>
      <p className="max-w-md text-sm text-sand">{errorMessage(error)}</p>
      {onRetry ? (
        <Button onClick={onRetry} className="mt-2">
          <RefreshCw aria-hidden /> Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyState({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div role="status" className={cn('flex flex-col items-center gap-3 rounded-md bg-surface px-6 py-10 text-center', className)}>
      <SearchX aria-hidden className="size-8 text-khaki" />
      <p className="text-lg font-bold text-cream">{title}</p>
      {description ? <p className="max-w-md text-sm text-sand">{description}</p> : null}
      {action}
    </div>
  )
}

/** Indicador discreto de atualização em segundo plano (dados já exibidos + refetch). */
export function BackgroundRefresh({ active, label = 'Atualizando…' }: { active: boolean; label?: string }) {
  if (!active) return null
  return (
    <span role="status" className="inline-flex items-center gap-1.5 text-xs text-khaki">
      <RefreshCw aria-hidden className="size-3 animate-spin" />
      {label}
    </span>
  )
}
