import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/checkout')({
  beforeLoad: requireAuth,
  staticData: { title: 'Pagamento', mobileChrome: 'none' },
  component: CheckoutStub,
})

function CheckoutStub() {
  return (
    <section className="page-container py-16" aria-labelledby="checkout-title">
      <h1 id="checkout-title" className="text-3xl font-bold text-cream">
        Pagamento
      </h1>
      <p className="mt-3 text-sand">Colecionador, carteira e revisão entram na Etapa 5.</p>
    </section>
  )
}
