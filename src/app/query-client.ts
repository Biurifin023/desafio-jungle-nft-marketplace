import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/lib/http'

/**
 * Política de cache, retries e sincronização (documentada em docs/etapas/00-fundacao/RELATORIO.md):
 * - Consultas: até 2 novas tentativas só para erros `retryable` (rede, timeout, 5xx, 429), com backoff exponencial.
 *   Erros 4xx nunca são repetidos automaticamente.
 * - Mutations: nunca repetidas automaticamente (pedido usa idempotência explícita).
 * - Catálogo: staleTime 30–60 s; carrinho/cotação: staleTime 0 (sempre revalida).
 * - refetchOnWindowFocus e refetchOnReconnect ativos: retomada após perda de foco/conexão.
 * - Eventos Socket.IO atualizam o cache de forma pontual; após reconexão, as queries ativas são invalidadas.
 */
export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => isApiError(error) && error.retryable && error.kind !== 'canceled' && failureCount < 2,
        retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 4000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: { retry: false },
    },
  })
}

/** Raízes de chaves com dados privados ou do dono do carrinho — removidas no logout/troca de usuário. */
export const PRIVATE_ROOTS = ['private', 'cart', 'quote', 'session'] as const

export function clearPrivateCache(queryClient: QueryClient) {
  queryClient.cancelQueries({ predicate: (q) => PRIVATE_ROOTS.includes(q.queryKey[0] as (typeof PRIVATE_ROOTS)[number]) })
  queryClient.removeQueries({ predicate: (q) => PRIVATE_ROOTS.includes(q.queryKey[0] as (typeof PRIVATE_ROOTS)[number]) })
}
