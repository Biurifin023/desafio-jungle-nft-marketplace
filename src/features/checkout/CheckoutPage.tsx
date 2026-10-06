import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { CollectorDetails, NETWORK_LABEL, WALLET_PROVIDER_LABEL, type Network, type Wallet } from '@/api/contracts'
import { accountApi, useProfile, useWallets } from '@/api/account'
import { useCart, useQuote } from '@/api/cart'
import { ordersApi } from '@/api/orders'
import { formatDiscount } from '@/features/cart/CartSummary'
import { useSessionSnapshot } from '@/features/session/session-store'
import { EmptyState, ErrorState, errorMessage } from '@/components/common/QueryState'
import { FormError, FormField, selectClassName } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { announce } from '@/lib/announce'
import { isApiError } from '@/lib/http'
import { formatEth } from '@/lib/money'
import { STORAGE_KEYS, session } from '@/lib/storage'
import { useDesktop } from '@/lib/use-desktop'
import { MobileCheckout } from './MobileCheckout'

const CheckoutSchema = CollectorDetails.extend({
  walletId: z.string().min(1, 'Selecione uma carteira cadastrada'),
  network: z.enum(['ethereum', 'polygon', 'solana']),
})
type FormValues = z.infer<typeof CheckoutSchema>

type OrderPayload = Parameters<typeof ordersApi.create>[0]

/** Rascunho e tentativa ficam no sessionStorage marcados com o dono; os de outro usuário são ignorados. */
interface StoredDraft {
  userId: string
  values: Partial<FormValues>
}

/** `body`: primeiro corpo enviado com esta chave cujo resultado ainda é desconhecido (timeout/rede). */
interface StoredAttempt {
  userId: string
  key: string
  body?: OrderPayload
}

function loadDraft(userId: string): Partial<FormValues> {
  const draft = session.get<StoredDraft>(STORAGE_KEYS.checkoutDraft)
  return draft?.userId === userId ? (draft.values ?? {}) : {}
}

function currentAttempt(userId: string): StoredAttempt {
  const stored = session.get<StoredAttempt>(STORAGE_KEYS.checkoutAttempt)
  if (stored?.userId === userId && stored.key) return stored
  const attempt = { userId, key: crypto.randomUUID() }
  session.set(STORAGE_KEYS.checkoutAttempt, attempt)
  return attempt
}

/**
 * O servidor só registra a chave de idempotência quando cria o pedido. Um 409 `idempotency_conflict`
 * significa que uma tentativa anterior sem resposta criou o pedido com outro corpo (ex.: cotação renovada);
 * reenviar o corpo original com a mesma chave devolve esse pedido em vez de duplicar a compra.
 */
async function submitOrder(userId: string, payload: OrderPayload) {
  const attempt = currentAttempt(userId)
  if (!attempt.body) session.set(STORAGE_KEYS.checkoutAttempt, { ...attempt, body: payload })
  try {
    return await ordersApi.create(payload, attempt.key)
  } catch (error) {
    if (!isApiError(error) || error.kind !== 'http') throw error
    if (error.code === 'idempotency_conflict') {
      if (attempt.body) return ordersApi.create(attempt.body, attempt.key)
    } else {
      session.set(STORAGE_KEYS.checkoutAttempt, { userId, key: attempt.key })
    }
    throw error
  }
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const snapshot = useSessionSnapshot()
  const userId = snapshot.status === 'authenticated' ? snapshot.user.id : null
  const cart = useCart()
  const wallets = useWallets()
  const profile = useProfile()
  const [network, setNetwork] = useState<Network>('ethereum')
  const quote = useQuote(network)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [stale, setStale] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const hydrated = useRef(false)
  const desktop = useDesktop()

  const walletList = useMemo(
    () => [wallets.data?.primary, wallets.data?.secondary].filter((w): w is NonNullable<typeof w> => Boolean(w)),
    [wallets.data],
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      displayName: '',
      username: '',
      profileName: '',
      email: '',
      referralCode: 'KURIO1',
      ensName: 'ana',
      note: '',
      walletId: '',
      network: 'ethereum',
    },
  })
  const selectedWalletId = useWatch({ control: form.control, name: 'walletId' })

  useEffect(() => {
    if (hydrated.current || !userId || !profile.data || wallets.isPending) return
    const draft = loadDraft(userId)
    form.reset({
      displayName: draft.displayName ?? profile.data.displayName,
      username: draft.username ?? profile.data.username,
      profileName: draft.profileName ?? profile.data.displayName,
      email: draft.email ?? profile.data.email,
      referralCode: draft.referralCode ?? 'KURIO1',
      ensName: draft.ensName ?? profile.data.ensName,
      note: draft.note ?? '',
      walletId: draft.walletId ?? walletList[0]?.id ?? '',
      network: draft.network ?? network,
    })
    hydrated.current = true
  }, [userId, profile.data, wallets.isPending, walletList, form, network])

  useEffect(() => {
    if (!userId) return
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => session.set(STORAGE_KEYS.checkoutDraft, { userId, values } satisfies StoredDraft),
    })
  }, [form, userId])

  async function connect() {
    const walletId = form.getValues('walletId')
    if (!walletId) {
      form.setError('walletId', { message: 'Selecione uma carteira cadastrada' })
      return false
    }
    setConnecting(true)
    try {
      await accountApi.connectWallet({ walletId, network })
      setConnected(true)
      announce('Carteira conectada')
      toast.success('Carteira conectada')
      return true
    } catch (error) {
      setConnected(false)
      toast.error(errorMessage(error, 'A carteira recusou a conexão'))
      return false
    } finally {
      setConnecting(false)
    }
  }

  function changeNetwork(next: Network) {
    setNetwork(next)
    form.setValue('network', next)
    setConnected(false)
  }

  function selectWallet(wallet: Wallet) {
    form.setValue('walletId', wallet.id, { shouldValidate: form.formState.isSubmitted })
    changeNetwork(wallet.network)
  }

  function applyFieldErrors(fields: Record<string, string>) {
    const names = Object.keys(form.getValues()) as (keyof FormValues)[]
    let applied = 0
    for (const [key, message] of Object.entries(fields)) {
      const name = key.replace(/^collector\./, '') as keyof FormValues
      if (!names.includes(name)) continue
      form.setError(name, { message }, { shouldFocus: applied === 0 })
      applied += 1
    }
    return applied > 0
  }

  /** `autoConnect`: o layout mobile não tem botão de conectar; confirmar conecta a carteira escolhida antes. */
  async function onSubmit(values: FormValues, autoConnect = false) {
    if (!quote.data || !userId || submitting) return
    if (!connected && !autoConnect) {
      toast.error('Conecte a carteira antes de confirmar')
      return
    }
    setSubmitting(true)
    if (!connected && !(await connect())) {
      setSubmitting(false)
      return
    }
    const payload = {
      quoteId: quote.data.id,
      walletId: values.walletId,
      network,
      collector: {
        displayName: values.displayName,
        username: values.username,
        profileName: values.profileName,
        email: values.email,
        referralCode: values.referralCode,
        ensName: values.ensName,
        note: values.note,
      },
    }
    try {
      const order = await submitOrder(userId, payload)
      session.remove(STORAGE_KEYS.checkoutAttempt)
      session.remove(STORAGE_KEYS.checkoutDraft)
      setStale(null)
      announce('Pedido enviado')
      await navigate({ to: '/orders/$id', params: { id: order.id } })
    } catch (error) {
      if (isApiError(error) && error.code === 'quote_stale') {
        setStale(error.message)
        announce(error.message, 'assertive')
        await quote.refetch()
      } else if (isApiError(error) && error.code === 'idempotency_conflict') {
        session.remove(STORAGE_KEYS.checkoutAttempt)
        setStale('Não foi possível recuperar a tentativa anterior. Revise os dados e confirme novamente.')
        announce('Não foi possível recuperar a tentativa anterior. Confirme novamente.', 'assertive')
        await quote.refetch()
      } else if (isApiError(error) && error.kind === 'timeout') {
        try {
          const recovered = await submitOrder(userId, payload)
          session.remove(STORAGE_KEYS.checkoutAttempt)
          session.remove(STORAGE_KEYS.checkoutDraft)
          announce('Pedido recuperado')
          await navigate({ to: '/orders/$id', params: { id: recovered.id } })
          return
        } catch {
          setStale('A confirmação demorou. Tente de novo — o pedido não será duplicado.')
          announce('A confirmação demorou. Tente de novo.', 'assertive')
        }
      } else if (isApiError(error) && applyFieldErrors(error.fields)) {
        announce(error.message, 'assertive')
      } else {
        toast.error(errorMessage(error, 'Não foi possível enviar o pedido'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (cart.isError) return <ErrorState className="page-container py-16" error={cart.error} onRetry={() => void cart.refetch()} />
  if (cart.isSuccess && cart.data.items.length === 0) {
    return (
      <EmptyState
        className="page-container py-16"
        title="Seu carrinho está vazio"
        action={
          <Link to="/" className="text-amber underline">
            Voltar ao catálogo
          </Link>
        }
      />
    )
  }

  const priceIssues = quote.data?.issues.filter((issue) => issue.type === 'price_changed') ?? []
  const loadError =
    profile.isError || wallets.isError ? (
      <ErrorState
        title="Não foi possível carregar seus dados"
        error={profile.error ?? wallets.error}
        onRetry={() => {
          void profile.refetch()
          void wallets.refetch()
        }}
      />
    ) : null
  const quoteError =
    quote.isError && !quote.data ? (
      <ErrorState className="px-0 py-4" title="Não foi possível calcular a cotação" error={quote.error} onRetry={() => void quote.refetch()} />
    ) : null
  const quoteNotices = (
    <>
      {priceIssues.map((issue) => (
        <p key={issue.itemId ?? issue.message} role="status" className="mt-3 text-sm text-sand" data-testid="realtime-change">
          {issue.message}
        </p>
      ))}
      {stale ? (
        <FormError>
          <span data-testid="checkout-stale">{stale}</span>
        </FormError>
      ) : null}
    </>
  )

  if (!desktop) {
    const collectorError = Object.entries(form.formState.errors).find(([name]) => name !== 'walletId')?.[1]?.message
    return (
      <MobileCheckout
        wallets={walletList}
        walletsPending={wallets.isPending}
        walletId={selectedWalletId}
        walletError={form.formState.errors.walletId?.message}
        onSelectWallet={selectWallet}
        total={quote.data ? formatEth(quote.data.totalEth) : undefined}
        totalPending={quote.isPending}
        status={
          <>
            {loadError}
            {quoteError}
            {quoteNotices}
            {collectorError ? (
              <FormError>
                {collectorError}{' '}
                <Link to="/profile" className="font-bold underline">
                  Revisar perfil
                </Link>
              </FormError>
            ) : null}
          </>
        }
        canSubmit={Boolean(quote.data?.valid)}
        busy={submitting || connecting}
        onSubmit={form.handleSubmit((values) => onSubmit(values, true))}
      />
    )
  }

  return (
    <section className="page-container py-8" aria-labelledby="checkout-title" data-testid="checkout-page" data-wallet={selectedWalletId}>
      <nav aria-label="Trilha" className="text-sm font-bold text-cream">
        <Link to="/" className="transition-colors hover:text-amber">
          Início
        </Link>
        <span> / </span>
        <Link to="/cart" className="text-amber">
          Mercado
        </Link>
        <span> / </span>
        <span aria-current="page" className="text-amber">
          Pagamento
        </span>
      </nav>
      <h1 id="checkout-title" className="mt-6 text-3xl font-bold text-cream">
        Pagamento
      </h1>
      {loadError ? <div className="mt-6">{loadError}</div> : null}

      <form className="mt-8 grid gap-10 lg:grid-cols-[1fr_332px]" onSubmit={form.handleSubmit((values) => onSubmit(values))} noValidate>
        <div>
          <h2 className="text-[17px] font-bold text-cream">Perfil do colecionador</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <FormField label="Nome de exibição" error={form.formState.errors.displayName?.message} required>
              <Input {...form.register('displayName')} />
            </FormField>
            <FormField label="Nome de usuário" error={form.formState.errors.username?.message} required>
              <Input {...form.register('username')} />
            </FormField>
            <FormField label="Rede" required>
              <select
                className={selectClassName}
                value={network}
                onChange={(e) => changeNetwork(e.target.value as Network)}
              >
                {Object.entries(NETWORK_LABEL).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Nome do perfil" error={form.formState.errors.profileName?.message} required>
              <Input {...form.register('profileName')} />
            </FormField>
            <FormField label="Carteira" error={form.formState.errors.walletId?.message} required>
              <select className={selectClassName} {...form.register('walletId', { onChange: () => setConnected(false) })}>
                <option value="">Selecione uma carteira</option>
                {walletList.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nickname} · {WALLET_PROVIDER_LABEL[w.provider]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Código de indicação" error={form.formState.errors.referralCode?.message} required>
              <Input {...form.register('referralCode')} />
            </FormField>
            <FormField label="E-mail" error={form.formState.errors.email?.message} required>
              <Input type="email" {...form.register('email')} />
            </FormField>
            <FormField label="ENS" error={form.formState.errors.ensName?.message} required>
              <Input {...form.register('ensName')} />
            </FormField>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => void connect()} disabled={connecting} data-testid="connect-wallet">
              {connected ? 'Carteira conectada' : connecting ? 'Conectando…' : 'Conectar carteira'}
            </Button>
            {connected ? (
              <p role="status" className="self-center text-sm text-success" data-testid="wallet-status">
                Conectada em {NETWORK_LABEL[network]}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="rounded-md bg-surface p-6">
          <h2 className="text-lg font-bold text-cream">Revisão</h2>
          {quote.isPending ? <p className="mt-4 text-sand">Calculando cotação…</p> : null}
          {quoteError ? <div className="mt-4">{quoteError}</div> : null}
          {quote.data ? (
            <dl className="mt-4 space-y-2 text-sm text-cream">
              <Row label="Subtotal" value={formatEth(quote.data.subtotalEth)} />
              <Row label="Desconto" value={formatDiscount(quote.data.discountEth)} />
              <Row label="Taxa de rede" value={formatEth(quote.data.networkFeeEth)} />
              <Row label="Total" value={formatEth(quote.data.totalEth)} strong testId="checkout-total" />
            </dl>
          ) : null}
          {quoteNotices}
          <Button type="submit" className="mt-6 w-full" disabled={submitting || !quote.data?.valid} data-testid="confirm-order">
            {submitting ? 'Enviando…' : 'Confirmar compra'}
          </Button>
        </aside>
      </form>
    </section>
  )
}

function Row({ label, value, strong, testId }: { label: string; value: string; strong?: boolean; testId?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sand">{label}</dt>
      <dd className={strong ? 'font-bold text-amber' : undefined} data-testid={testId}>
        {value}
      </dd>
    </div>
  )
}
