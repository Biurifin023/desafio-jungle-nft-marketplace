import { Link } from '@tanstack/react-router'
import { useCart, useQuote } from '@/api/cart'
import { ErrorState } from '@/components/common/QueryState'
import { ArrowLeftIcon } from '@/components/icons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { CartItems, CartItemsSkeleton } from './CartItems'
import { CartRelated } from './CartRelated'
import { CartEmpty, CartSummary, CartSummarySkeleton } from './CartSummary'

export function CartPage() {
  const cart = useCart()
  const quote = useQuote('ethereum')
  const items = cart.data?.items ?? []
  const hasItems = items.length > 0
  const quotePending = hasItems && (quote.isPending || quote.isFetching)

  return (
    <section className="page-container pt-6 pb-10 lg:pt-8 lg:pb-16" aria-labelledby="cart-title" data-testid="cart-page">
      <MobileHeader />
      <CartBreadcrumb />
      <h1 id="cart-title" className="sr-only">
        Carrinho
      </h1>

      {cart.isError && !cart.data ? (
        <ErrorState error={cart.error} onRetry={() => void cart.refetch()} title="Não foi possível carregar o carrinho" className="mt-10" />
      ) : null}

      {cart.isPending && !cart.data ? (
        <div className="mt-6 flex flex-col lg:mt-8 lg:flex-row lg:justify-between lg:gap-16">
          <CartItemsSkeleton />
          <CartSummarySkeleton />
        </div>
      ) : null}

      {cart.data && !hasItems && !cart.isError ? <CartEmpty /> : null}

      {cart.data && hasItems ? (
        <>
          <div className="mt-4 flex flex-col lg:mt-3 lg:flex-row lg:justify-between lg:gap-16">
            <CartItems items={items} lines={quote.data?.lines} quotePending={quotePending} />
            <CartSummary cart={cart.data} quote={quote.data} quotePending={quotePending} />
          </div>
          <CartRelated excludeIds={items.map((item) => item.nftId)} />
        </>
      ) : null}
    </section>
  )
}

function MobileHeader() {
  return (
    <header className="relative mb-4 flex h-11 items-center justify-center lg:hidden">
      <Link
        to="/"
        aria-label="Voltar"
        className="absolute left-0 grid size-[35px] place-items-center rounded-full border border-border bg-surface-2 text-khaki"
      >
        <ArrowLeftIcon aria-hidden className="size-5" />
      </Link>
      <p className="text-xl font-bold text-cream" aria-hidden>
        Carrinho de NFTs
      </p>
    </header>
  )
}

function CartBreadcrumb() {
  return (
    <Breadcrumb className="mb-3 hidden lg:block">
      <BreadcrumbList className="text-[15px] font-bold text-cream">
        <BreadcrumbItem>
          <BreadcrumbLink asChild className="text-cream hover:text-amber">
            <Link to="/">Início</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-cream [&>svg]:hidden">/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild className="text-amber hover:text-amber">
            <Link to="/" hash="catalogo" resetScroll={false}>
              Mercado
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-cream [&>svg]:hidden">/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage className="font-bold text-amber">Carrinho</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
