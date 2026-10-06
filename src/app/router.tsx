import { createRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { routeTree } from '@/routeTree.gen'
import { RouteError } from '@/components/common/RouteError'
import { NotFound } from '@/components/common/NotFound'

export interface RouterContext {
  queryClient: QueryClient
}

export function createAppRouter(queryClient: QueryClient) {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultHashScrollIntoView: reduceMotion ? true : { behavior: 'smooth', block: 'start' },
    defaultNotFoundComponent: () => <NotFound />,
    defaultErrorComponent: RouteError,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
  interface StaticDataRouteOption {
    /** Moldura mobile (< lg): barra de abas inferior ou nenhuma (a página tem barra própria, como no Figma). */
    mobileChrome?: 'tabbar' | 'none'
    /** Item ativo da navegação principal do header desktop. */
    nav?: 'inicio' | 'mercado'
    /** Título usado no <title> do documento. */
    title?: string
    /** Páginas de conta no Figma não têm rodapé. */
    hideFooter?: boolean
  }
}
