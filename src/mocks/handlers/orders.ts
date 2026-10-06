import { delay, HttpResponse } from 'msw'
import { IDEMPOTENCY_HEADER } from '@/api/contracts'
import { readJson, route } from '../network'
import { requireUser } from '../domain/auth'
import { createOrder, getOrder, listOrders } from '../domain/orders'

export const orderHandlers = [
  route('post', '/orders', async ({ request }) => {
    const user = requireUser(request)
    const body = await readJson(request)
    const result = await createOrder(user, body, request.headers.get(IDEMPOTENCY_HEADER))
    // Cenário order-timeout: o pedido já existe, mas a resposta excede o timeout do cliente.
    if (result.delayResponseMs) await delay(result.delayResponseMs)
    return HttpResponse.json(
      { order: result.order },
      { status: result.replayed ? 200 : 201, headers: result.replayed ? { 'Idempotent-Replayed': 'true' } : {} },
    )
  }),

  route('get', '/orders', ({ request }) => {
    const user = requireUser(request)
    const status = new URL(request.url).searchParams.get('status') ?? undefined
    return HttpResponse.json({ items: listOrders(user, status) })
  }),

  route<{ id: string }>('get', '/orders/:id', ({ request, params }) => {
    const user = requireUser(request)
    return HttpResponse.json({ order: getOrder(user, params.id) })
  }),
]
