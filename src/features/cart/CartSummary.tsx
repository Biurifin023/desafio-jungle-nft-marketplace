import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { Cart, Quote } from '@/api/contracts'
import { useAcknowledgePrices, useApplyCoupon, useRemoveCoupon } from '@/api/cart'
import { EmptyState, errorMessage } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { announce } from '@/lib/announce'
import { isApiError } from '@/lib/http'
import { compareEth, formatEth } from '@/lib/money'

export function formatDiscount(discountEth: string) {
  if (compareEth(discountEth, '0') === 0) return '(-) 00.00'
  return `(-) ${formatEth(discountEth)}`
}

export function CartSummary({ cart, quote, quotePending }: { cart: Cart; quote: Quote | undefined; quotePending: boolean }) {
  return (
    <aside
      aria-labelledby="cart-summary-title"
      className="-mx-[var(--page-gutter)] mt-8 rounded-t-[40px] bg-surface px-[var(--page-gutter)] pt-6 pb-10 lg:mx-0 lg:mt-0 lg:w-[332px] lg:shrink-0 lg:rounded-none lg:bg-transparent lg:p-0"
    >
      <h2 id="cart-summary-title" className="hidden text-lg font-bold text-cream lg:block">
        Resumo da carteira
      </h2>
      <div className="mt-3 hidden border-b border-copper/30 lg:block" />

      <CouponForm cart={cart} />
      <QuoteBreakdown quote={quote} pending={quotePending} />
      <QuoteIssues quote={quote} />
      <CheckoutActions quote={quote} canCheckout={Boolean(quote?.valid)} />
    </aside>
  )
}

function CouponForm({ cart }: { cart: Cart }) {
  const [code, setCode] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      setFieldError('Informe um código')
      return
    }
    apply.mutate(trimmed, {
      onSuccess: () => {
        setCode('')
        setFieldError(null)
        announce('Cupom aplicado')
        toast.success('Cupom aplicado')
      },
      onError: (error) => {
        const message = isApiError(error) ? (error.fields.code ?? error.message) : errorMessage(error, 'Não foi possível aplicar o cupom')
        setFieldError(message)
        announce(message, 'assertive')
      },
    })
  }

  function onRemove() {
    remove.mutate(undefined, {
      onSuccess: () => {
        setFieldError(null)
        announce('Cupom removido')
      },
      onError: (error) => toast.error(errorMessage(error, 'Não foi possível remover o cupom')),
    })
  }

  return (
    <form onSubmit={onSubmit} className="lg:mt-6" noValidate>
      <Label htmlFor="cart-coupon" className="mb-2 hidden text-sm font-bold text-cream lg:block">
        Código promocional
      </Label>
      <div className="flex overflow-hidden rounded-[40px] border border-border bg-surface shadow-[0_6px_20px_0_#0a060473] lg:rounded-xs lg:border-copper lg:shadow-none">
        <Input
          id="cart-coupon"
          data-testid="cart-coupon-input"
          name="code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            if (fieldError) setFieldError(null)
          }}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? 'cart-coupon-error' : cart.couponCode ? 'cart-coupon-applied' : undefined}
          className="h-[50px] border-0 bg-transparent text-[13px] placeholder:text-khaki focus-visible:ring-0 lg:h-10 lg:rounded-none lg:text-xs"
        />
        <Button
          type="submit"
          data-testid="cart-coupon-apply"
          disabled={apply.isPending}
          className="h-[50px] rounded-[40px] bg-[linear-gradient(180deg,#d28a4c8a_0%,#d28a4c_100%)] px-5 text-[15px] font-bold text-cream lg:h-10 lg:rounded-none lg:rounded-r-xs lg:bg-primary lg:px-4 lg:text-ink"
        >
          Aplicar
        </Button>
      </div>
      {fieldError ? (
        <p id="cart-coupon-error" data-testid="cart-coupon-error" role="alert" className="mt-2 text-sm text-coral">
          {fieldError}
        </p>
      ) : null}
      {cart.couponCode ? (
        <div id="cart-coupon-applied" className="mt-2 flex items-center justify-between gap-2 text-sm text-sand">
          <p>
            Cupom <span className="font-bold text-cream">{cart.couponCode}</span> aplicado
          </p>
          <button
            type="button"
            data-testid="cart-coupon-remove"
            onClick={onRemove}
            disabled={remove.isPending}
            className="text-amber hover:underline disabled:opacity-50"
          >
            Remover
          </button>
        </div>
      ) : null}
    </form>
  )
}

function QuoteBreakdown({ quote, pending }: { quote: Quote | undefined; pending: boolean }) {
  if (pending || !quote) {
    return (
      <div data-testid="quote-skeleton" className="mt-6 space-y-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">Carregando resumo da cotação</span>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-5 w-full" />
      </div>
    )
  }

  return (
    <dl className="mt-6 space-y-3 text-[15px] text-cream">
      <div className="flex items-center justify-between">
        <dt>Subtotal</dt>
        <dd data-testid="cart-subtotal" className="text-base lg:text-lg">
          {formatEth(quote.subtotalEth)}
        </dd>
      </div>
      <div className="flex items-center justify-between">
        <dt>Desconto do lançamento</dt>
        <dd data-testid="cart-discount">{formatDiscount(quote.discountEth)}</dd>
      </div>
      <div className="flex flex-col items-end gap-0">
        <div className="flex w-full items-center justify-between">
          <dt>Taxa de rede</dt>
          <dd data-testid="cart-fee" className="text-base lg:text-lg">
            {formatEth(quote.networkFeeEth)}
          </dd>
        </div>
        <p className="text-xs text-amber">Taxa estimada</p>
      </div>
      <div className="flex items-center justify-between font-bold">
        <dt className="text-base">Total</dt>
        <dd data-testid="cart-total" className="text-lg text-amber">
          {formatEth(quote.totalEth)}
        </dd>
      </div>
    </dl>
  )
}

function QuoteIssues({ quote }: { quote: Quote | undefined }) {
  const ack = useAcknowledgePrices()
  if (!quote?.issues.length) return null

  const priceChanges = quote.issues.filter((issue) => issue.type === 'price_changed')
  const others = quote.issues.filter((issue) => issue.type !== 'price_changed')

  return (
    <div className="mt-4 space-y-2">
      {others.map((issue) => (
        <p key={`${issue.type}-${issue.itemId ?? issue.message}`} role="alert" className="rounded-md bg-surface-2 px-3 py-2 text-sm text-coral">
          {issue.message}
        </p>
      ))}
      {priceChanges.length > 0 ? (
        <div role="status" className="rounded-md bg-surface-2 px-3 py-2 text-sm text-sand">
          <p>{priceChanges.map((issue) => issue.message).join(' ')}</p>
          <button
            type="button"
            className="mt-2 font-bold text-amber hover:underline"
            disabled={ack.isPending}
            onClick={() =>
              ack.mutate(undefined, {
                onSuccess: () => announce('Novos preços aceitos'),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            Aceitar novos preços
          </button>
        </div>
      ) : null}
    </div>
  )
}

function CheckoutActions({ quote, canCheckout }: { quote: Quote | undefined; canCheckout: boolean }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      {canCheckout && quote ? (
        <Button
          asChild
          className="h-[60px] w-full rounded-[40px] bg-[linear-gradient(90deg,#d28a4c_0%,#d28a4ccc_100%)] text-base font-bold text-ink lg:h-10 lg:rounded-xs lg:bg-primary lg:bg-none lg:text-[15px]"
        >
          <Link to="/checkout" data-testid="cart-checkout" aria-label="Ir para pagamento">
            Conectar e finalizar
          </Link>
        </Button>
      ) : (
        <Button
          data-testid="cart-checkout"
          aria-label="Ir para pagamento"
          disabled
          className="h-[60px] w-full rounded-[40px] text-base lg:h-10 lg:rounded-xs lg:text-[15px]"
        >
          Conectar e finalizar
        </Button>
      )}
      <Link to="/" hash="catalogo" resetScroll={false} className="hidden text-[15px] text-amber hover:underline lg:inline">
        Continuar explorando
      </Link>
    </div>
  )
}

export function CartSummarySkeleton() {
  return (
    <aside className="-mx-[var(--page-gutter)] mt-8 rounded-t-[40px] bg-surface px-[var(--page-gutter)] pt-6 pb-10 lg:mx-0 lg:mt-0 lg:w-[332px] lg:bg-transparent lg:p-0">
      <div data-testid="quote-skeleton" className="space-y-3" aria-busy="true">
        <span className="sr-only">Carregando resumo da cotação</span>
        <Skeleton className="hidden h-6 w-48 lg:block" />
        <Skeleton className="h-[50px] w-full rounded-[40px] lg:h-10 lg:rounded-xs" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[60px] w-full rounded-[40px] lg:h-10" />
      </div>
    </aside>
  )
}

export function CartEmpty() {
  return (
    <div data-testid="cart-empty">
      <EmptyState
        title="Seu carrinho está vazio"
        description="Explore o mercado e adicione edições para ver o resumo da cotação aqui."
        action={
          <Button asChild>
            <Link to="/" hash="catalogo" resetScroll={false}>
              Continuar explorando
            </Link>
          </Button>
        }
        className="mt-10"
      />
    </div>
  )
}
