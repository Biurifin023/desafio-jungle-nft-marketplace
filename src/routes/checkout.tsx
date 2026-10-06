import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '@/features/checkout/CheckoutPage'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/checkout')({
  beforeLoad: requireAuth,
  staticData: { title: 'Pagamento', mobileChrome: 'none' },
  component: CheckoutPage,
})
