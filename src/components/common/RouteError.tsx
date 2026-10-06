import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ErrorState } from './QueryState'

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const { reset } = useQueryErrorResetBoundary()
  useEffect(() => reset(), [reset])
  return (
    <div className="page-container py-16">
      <ErrorState error={error} onRetry={() => router.invalidate()} />
    </div>
  )
}
