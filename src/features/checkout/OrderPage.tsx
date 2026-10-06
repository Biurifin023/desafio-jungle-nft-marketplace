import { Link } from '@tanstack/react-router'
import { ThankYouIcon } from '@/components/icons'
import { NftImage } from '@/components/common/NftImage'
import { EmptyState, ErrorState } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
import { useOrder } from '@/api/orders'
import { isApiError } from '@/lib/http'
import { formatEth } from '@/lib/money'
import { formatDiscount } from '@/features/cart/CartSummary'

function OrderNotFound() {
  return (
    <EmptyState
      className="page-container py-16"
      title="Pedido não encontrado"
      description="Este pedido não existe ou pertence a outra conta."
      action={
        <Link to="/" className="text-amber underline-offset-4 hover:underline">
          Voltar ao início
        </Link>
      }
    />
  )
}

export function OrderPage({ orderId }: { orderId: string }) {
  const query = useOrder(orderId)

  if (query.isPending) return <p className="page-container py-16 text-sand">Carregando pedido…</p>
  if (query.isError && !query.data) {
    if (isApiError(query.error) && query.error.status === 404) return <OrderNotFound />
    return <ErrorState className="page-container py-16" error={query.error} onRetry={() => void query.refetch()} />
  }
  const order = query.data
  if (!order) return <OrderNotFound />

  if (order.status === 'pending') {
    return (
      <section className="page-container py-16 text-center" aria-live="polite" data-testid="order-page">
        <h1 className="text-3xl font-bold text-cream">Pedido pendente</h1>
        <p className="mt-3 text-sand">Aguardando a confirmação da rede. Esta página atualiza sozinha.</p>
        <p className="mt-2 font-mono text-sm text-khaki" data-testid="order-id">
          {order.id}
        </p>
        <p className="sr-only" data-testid="order-status">
          pending
        </p>
      </section>
    )
  }

  if (order.status === 'declined') {
    return (
      <section className="page-container py-16 text-center" role="alert" data-testid="order-page">
        <h1 className="text-3xl font-bold text-cream">Pagamento recusado</h1>
        <p className="mt-3 text-sand">{order.failureReason ?? 'A simulação recusou esta compra.'}</p>
        <p className="mt-2 text-sm text-khaki">Os itens permanecem no carrinho.</p>
        <p className="mt-2 font-mono text-sm text-khaki" data-testid="order-id">
          {order.id}
        </p>
        <p className="sr-only" data-testid="order-status">
          declined
        </p>
        <Button asChild className="mt-6">
          <Link to="/cart">Voltar ao carrinho</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="page-container max-w-xl py-16 text-center" aria-labelledby="receipt-title" data-testid="order-page">
      <ThankYouIcon aria-hidden className="mx-auto size-16 text-copper" />
      <h1 id="receipt-title" className="mt-4 text-3xl font-bold text-cream">
        Pedido confirmado
      </h1>
      <p className="mt-2 text-sand">Obrigado. Este recibo é o snapshot do pedido e não muda se o catálogo alterar.</p>
      <p className="mt-4 font-mono text-sm text-khaki" data-testid="order-id">
        {order.id}
      </p>
      <p className="sr-only" data-testid="order-status">
        confirmed
      </p>
      {order.transaction ? (
        <p className="mt-2 text-sm">
          <a href={order.transaction.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-amber underline" data-testid="tx-hash">
            {order.transaction.hash.slice(0, 10)}… no explorador
          </a>
        </p>
      ) : null}
      <ul className="mt-8 space-y-4 text-left">
        {order.lines.map((line) => (
          <li key={line.itemId} className="flex gap-3">
            <NftImage image={line.image} sizes="64px" className="size-16 rounded-md" />
            <div>
              <p className="font-bold text-cream">{line.name}</p>
              <p className="text-sm text-sand">
                {line.quantity} × {formatEth(line.unitPriceEth)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-1 text-left text-sm text-cream">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatEth(order.subtotalEth)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Desconto</dt>
          <dd>{formatDiscount(order.discountEth)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Taxa</dt>
          <dd>{formatEth(order.networkFeeEth)}</dd>
        </div>
        <div className="flex justify-between font-bold text-amber">
          <dt>Total</dt>
          <dd data-testid="order-total">{formatEth(order.totalEth)}</dd>
        </div>
      </dl>
      <Button asChild className="mt-8">
        <Link to="/">Continuar explorando</Link>
      </Button>
    </section>
  )
}
