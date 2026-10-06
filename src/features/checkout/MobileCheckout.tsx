import type { FormEvent, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { NETWORK_LABEL, WALLET_PROVIDER_LABEL, type Network, type Wallet, type WalletProvider } from '@/api/contracts'
import { useNotAvailable } from '@/components/common/NotAvailable'
import { ArrowLeftIcon, WalletIcon } from '@/components/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const PROVIDERS: WalletProvider[] = ['walletconnect', 'metamask', 'coinbase']

function networkLabel(network: Network) {
  return network === 'ethereum' ? 'Rede principal Ethereum' : `Rede ${NETWORK_LABEL[network]}`
}

/** A carteira principal é identificada pelo endereço; a reserva, pelo ENS quando houver. */
function walletIdentifier(wallet: Wallet) {
  if (wallet.slot === 'secondary' && wallet.secondaryAddress) return wallet.secondaryAddress
  return `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
}

export function MobileCheckout({
  wallets,
  walletsPending,
  walletId,
  walletError,
  onSelectWallet,
  total,
  totalPending,
  status,
  canSubmit,
  busy,
  onSubmit,
}: {
  wallets: Wallet[]
  walletsPending: boolean
  walletId: string
  walletError?: string
  onSelectWallet: (wallet: Wallet) => void
  total?: string
  totalPending: boolean
  /** Erros de carregamento, mudanças de preço e cotação vencida. */
  status: ReactNode
  canSubmit: boolean
  busy: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const unavailable = useNotAvailable()
  const selected = wallets.find((wallet) => wallet.id === walletId)

  function selectProvider(provider: WalletProvider) {
    const wallet = wallets.find((w) => w.provider === provider)
    if (wallet) onSelectWallet(wallet)
    else unavailable(`Conectar com ${WALLET_PROVIDER_LABEL[provider]}`)
  }

  return (
    <section className="flex min-h-dvh flex-col justify-between gap-4 px-7 py-8" aria-labelledby="checkout-title" data-testid="checkout-page" data-wallet={walletId}>
      <form id="checkout-mobile" className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <div className="flex h-11 items-start gap-6">
          <Link
            to="/cart"
            aria-label="Voltar ao carrinho"
            className="grid size-[35px] shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-khaki"
          >
            <ArrowLeftIcon aria-hidden className="size-5" />
          </Link>
          <h1 id="checkout-title" className="mt-[9px] text-xl leading-4 font-bold text-cream">
            Pagamento com carteira
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="checkout-wallets-title" className="text-base leading-4 font-bold text-cream">
              Carteira conectada
            </h2>
            <Link to="/wallets" className="text-sm leading-4 font-bold text-amber">
              Trocar carteira
            </Link>
          </div>
          {walletsPending ? (
            <>
              <Skeleton className="h-[93px] rounded-[14px]" />
              <Skeleton className="h-[93px] rounded-[14px]" />
            </>
          ) : wallets.length === 0 ? (
            <p className="rounded-[14px] bg-surface p-4 text-sm text-sand">
              Nenhuma carteira cadastrada.{' '}
              <Link to="/wallets" className="font-bold text-amber underline">
                Cadastrar carteira
              </Link>
            </p>
          ) : (
            <div className="flex flex-col gap-5" role="radiogroup" aria-labelledby="checkout-wallets-title">
              {wallets.map((wallet) => {
                const checked = wallet.id === walletId
                return (
                  <div
                    key={wallet.id}
                    className={cn(
                      'relative flex h-[93px] items-center rounded-[14px] bg-surface px-[19px] has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-amber',
                      checked && 'shadow-[0_20px_20px_0_#0a060473]',
                    )}
                  >
                    <label className="flex flex-1 cursor-pointer items-center self-stretch">
                      <input
                        type="radio"
                        name="checkout-wallet"
                        value={wallet.id}
                        checked={checked}
                        onChange={() => onSelectWallet(wallet)}
                        className="sr-only"
                      />
                      <RadioMark checked={checked} />
                      <span className="ml-[19px] flex min-w-0 flex-col self-start pt-[15px]">
                        <span className="text-base leading-4 font-bold text-cream">{wallet.nickname}</span>
                        <span className="mt-[7px] truncate text-sm leading-[22px] text-sand">{walletIdentifier(wallet)}</span>
                        <span className="truncate text-sm leading-[22px] text-sand">{networkLabel(wallet.network)}</span>
                      </span>
                    </label>
                    <Link
                      to="/wallets"
                      aria-label={`Editar carteira ${wallet.nickname}`}
                      className="-mr-2 flex h-8 w-5 flex-col items-center justify-center gap-[3px]"
                    >
                      <span aria-hidden className="size-[3px] rounded-full bg-khaki" />
                      <span aria-hidden className="size-[3px] rounded-full bg-khaki" />
                      <span aria-hidden className="size-[3px] rounded-full bg-khaki" />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
          {walletError ? (
            <p role="alert" className="text-xs text-coral">
              {walletError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <h2 id="checkout-providers-title" className="text-base leading-4 font-bold text-cream">
            Carteira e rede
          </h2>
          <div className="flex flex-col gap-4" role="radiogroup" aria-labelledby="checkout-providers-title">
            {PROVIDERS.map((provider) => {
              const checked = selected?.provider === provider
              return (
                <label
                  key={provider}
                  className="flex h-[65px] cursor-pointer items-center rounded-[15px] bg-surface pr-[17px] pl-3.5 shadow-glow has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-amber"
                >
                  <input
                    type="radio"
                    name="checkout-provider"
                    value={provider}
                    checked={checked}
                    onChange={() => selectProvider(provider)}
                    className="sr-only"
                  />
                  <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-surface-2">
                    {provider === 'coinbase' ? (
                      <WalletIcon className="size-6 text-copper" />
                    ) : (
                      <span className="text-sm font-bold text-amber">{provider === 'walletconnect' ? 'W' : 'M'}</span>
                    )}
                  </span>
                  <span className="ml-[11px] flex-1 text-sm leading-4 text-cream">{WALLET_PROVIDER_LABEL[provider]}</span>
                  <RadioMark checked={checked} />
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-7">
          <span className="text-base leading-4 font-bold text-cream">Total:</span>
          {totalPending ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span className="text-lg leading-4 font-bold text-amber" data-testid="checkout-total">
              {total ?? '—'}
            </span>
          )}
        </div>
        {status}
      </form>

      <button
        type="submit"
        form="checkout-mobile"
        disabled={!canSubmit || busy}
        data-testid="confirm-order"
        className="h-[60px] w-full cursor-pointer rounded-[40px] bg-[linear-gradient(90deg,#d28a4c_0%,#d28a4ccc_100%)] text-[15px] leading-4 font-bold text-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Enviando…' : 'Confirmar compra'}
      </button>
    </section>
  )
}

function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded-full border-[1.2px]',
        checked ? 'border-copper' : 'border-border-strong',
      )}
    >
      {checked ? <span className="size-2 rounded-full bg-copper" /> : null}
    </span>
  )
}
