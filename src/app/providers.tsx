import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { createAppRouter } from './router'
import { createQueryClient } from './query-client'
import { useMemo } from 'react'

export function AppProviders() {
  const queryClient = useMemo(() => createQueryClient(), [])
  const router = useMemo(() => createAppRouter(queryClient), [queryClient])
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
