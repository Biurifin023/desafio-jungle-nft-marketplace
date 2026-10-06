import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cart')({
  staticData: { title: 'Carrinho', mobileChrome: 'tabbar' },
  component: CartStub,
})

function CartStub() {
  return (
    <section className="page-container py-16" aria-labelledby="cart-title">
      <h1 id="cart-title" className="text-3xl font-bold text-cream">
        Carrinho
      </h1>
      <p className="mt-3 text-sand">Itens, cupom e resumo entram na Etapa 4.</p>
    </section>
  )
}
