import { queryOptions, useQuery } from '@tanstack/react-query'
import { IDEMPOTENCY_HEADER, OrderListResponse, OrderResponse, TERMINAL_ORDER_STATUSES, type CreateOrderInput } from './contracts'
import { qk } from './query-keys'
import { request } from '@/lib/http'
import { useSessionSnapshot } from '@/features/session/session-store'

export const ordersApi = {
  /** Criação idempotente: a mesma chave devolve o mesmo pedido; chave reutilizada com outro corpo → 409. */
  create: (input: CreateOrderInput, idempotencyKey: string) =>
    request(OrderResponse, {
      url: '/orders',
      method: 'POST',
      data: input,
      headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
    }).then((r) => r.order),
  get: (id: string, signal?: AbortSignal) => request(OrderResponse, { url: `/orders/${encodeURIComponent(id)}`, signal }).then((r) => r.order),
  pending: (signal?: AbortSignal) =>
    request(OrderListResponse, { url: '/orders', params: { status: 'pending' }, signal }).then((r) => r.items),
}

export const orderQuery = (userId: string, orderId: string) =>
  queryOptions({
    queryKey: qk.orders.detail(userId, orderId),
    queryFn: ({ signal }) => ordersApi.get(orderId, signal),
    /** Pedido pendente é reconsultado periodicamente como rede de segurança aos eventos. */
    refetchInterval: (q) => (q.state.data && !TERMINAL_ORDER_STATUSES.includes(q.state.data.status) ? 5_000 : false),
  })

export function useOrder(orderId: string) {
  const snapshot = useSessionSnapshot()
  const userId = snapshot.status === 'authenticated' ? snapshot.user.id : 'anonymous'
  return useQuery({ ...orderQuery(userId, orderId), enabled: snapshot.status === 'authenticated' })
}
