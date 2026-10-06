import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/checkout/OrderPage'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/orders/$id')({
  beforeLoad: requireAuth,
  staticData: { title: 'Pedido', mobileChrome: 'none' },
  component: OrderRoute,
})

function OrderRoute() {
  const { id } = Route.useParams()
  return <OrderPage orderId={id} />
}
