import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/orders/$id')({
  beforeLoad: requireAuth,
  staticData: { title: 'Pedido', mobileChrome: 'none' },
  component: OrderStub,
})

function OrderStub() {
  const { id } = Route.useParams()
  return (
    <section className="page-container py-16" aria-labelledby="order-title">
      <h1 id="order-title" className="text-3xl font-bold text-cream">
        Pedido {id}
      </h1>
      <p className="mt-3 text-sand">Recibo e estados do pedido entram na Etapa 5.</p>
    </section>
  )
}
