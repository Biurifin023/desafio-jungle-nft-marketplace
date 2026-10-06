import { cloneElement, useEffect, useId, useState, type ReactElement } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { NETWORK_LABEL, WALLET_PROVIDER_LABEL, WalletInput, type Wallet, type WalletSlot } from '@/api/contracts'
import { useSaveWallet, useWallets } from '@/api/account'
import { applyApiFieldErrors } from '@/features/auth/field-errors'
import { useSessionSnapshot } from '@/features/session/session-store'
import { ErrorState } from '@/components/common/QueryState'
import { FormError } from '@/components/common/FormField'
import { ArrowDownIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { announce } from '@/lib/announce'
import { cn } from '@/lib/utils'
import { AccountSidebar } from './AccountSidebar'

const emptyWallet = (email: string): WalletInput => ({
  displayName: '',
  nickname: '',
  network: 'ethereum',
  profileName: '',
  address: '',
  secondaryAddress: '',
  provider: 'metamask',
  referralCode: 'KURIO1',
  email,
  ensName: 'ana',
})

function toInput(wallet: Wallet): WalletInput {
  return {
    displayName: wallet.displayName,
    nickname: wallet.nickname,
    network: wallet.network,
    profileName: wallet.profileName,
    address: wallet.address,
    secondaryAddress: wallet.secondaryAddress ?? '',
    provider: wallet.provider,
    referralCode: wallet.referralCode,
    email: wallet.email,
    ensName: wallet.ensName,
  }
}

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

const headingClass = 'text-[17px] leading-4 font-bold text-cream'
const actionClass = 'cursor-pointer text-base leading-4 font-medium text-amber transition-colors hover:text-copper'

export function WalletsPage() {
  const wallets = useWallets()
  const snapshot = useSessionSnapshot()
  const email = snapshot.status === 'authenticated' ? snapshot.user.email : ''

  if (wallets.isError && !wallets.data) {
    return <ErrorState className="page-container py-16" error={wallets.error} onRetry={() => void wallets.refetch()} />
  }

  return (
    <div className="page-container flex flex-col gap-7 pt-8 pb-16 lg:flex-row">
      <AccountSidebar active="wallets" />
      <section className="min-w-0 flex-1" aria-labelledby="wallets-title">
        <h1 id="wallets-title" className="sr-only">
          Carteiras
        </h1>
        {wallets.data ? (
          <>
            <PrimaryWallet wallet={wallets.data.primary} email={email} />
            <SecondaryWallet wallet={wallets.data.secondary} primary={wallets.data.primary} email={email} />
          </>
        ) : (
          <p className="text-sand">Carregando carteiras…</p>
        )}
      </section>
    </div>
  )
}

function PrimaryWallet({ wallet, email }: { wallet: Wallet | null; email: string }) {
  const [draft, setDraft] = useState(() => ({ key: 0, values: wallet ? toInput(wallet) : emptyWallet(email) }))

  return (
    <section aria-labelledby="primary-wallet-title">
      <div className="flex items-center justify-between gap-4">
        <h2 id="primary-wallet-title" className={headingClass}>
          Carteira principal
        </h2>
        <button
          type="button"
          className={actionClass}
          aria-label="Adicionar nova carteira principal (substitui a atual ao salvar)"
          onClick={() => {
            setDraft((current) => ({ key: current.key + 1, values: emptyWallet(email) }))
            announce('Formulário limpo para uma nova carteira principal')
          }}
        >
          Adicionar
        </button>
      </div>
      <p className="mt-2 text-sm leading-[15px] text-sand">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
      <WalletForm key={draft.key} slot="primary" title="Carteira principal" defaultValues={draft.values} focusOnMount={draft.key > 0} />
    </section>
  )
}

function SecondaryWallet({ wallet, primary, email }: { wallet: Wallet | null; primary: Wallet | null; email: string }) {
  const [draft, setDraft] = useState<{ key: number; values: WalletInput; copied: boolean } | null>(null)

  function open(values: WalletInput, copied: boolean) {
    setDraft((current) => ({ key: (current?.key ?? 0) + 1, values, copied }))
  }

  return (
    <section aria-labelledby="secondary-wallet-title" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id="secondary-wallet-title" className={headingClass}>
          Carteira secundária
        </h2>
        <div className="flex items-center gap-2">
          {primary ? (
            <button
              type="button"
              aria-pressed={Boolean(draft?.copied)}
              className="flex cursor-pointer items-center gap-2 text-sm leading-4 text-cream transition-colors hover:text-amber"
              onClick={() =>
                open({ ...toInput(primary), nickname: wallet?.nickname ?? '', address: '', secondaryAddress: '' }, true)
              }
            >
              <span aria-hidden className="grid size-4 place-items-center rounded-full border-[1.5px] border-copper">
                {draft?.copied ? <span className="size-2 rounded-full bg-copper" /> : null}
              </span>
              Igual à carteira principal
            </button>
          ) : null}
          <button
            type="button"
            className={actionClass}
            aria-expanded={Boolean(draft)}
            onClick={() => (draft ? setDraft(null) : open(wallet ? toInput(wallet) : emptyWallet(email), false))}
          >
            {draft ? 'Cancelar' : wallet ? 'Editar' : 'Adicionar'}
          </button>
        </div>
      </div>
      {draft ? (
        <WalletForm
          key={draft.key}
          slot="secondary"
          title="Carteira secundária"
          defaultValues={draft.values}
          focusOnMount
          onSaved={() => setDraft(null)}
        />
      ) : (
        <p className="mt-3 text-sm leading-[15px] text-sand" data-testid="secondary-wallet-summary">
          {wallet
            ? `${wallet.nickname} · ${shortAddress(wallet.address)} · ${NETWORK_LABEL[wallet.network]}`
            : 'Você ainda não adicionou uma carteira secundária.'}
        </p>
      )}
    </section>
  )
}

function WalletForm({
  slot,
  title,
  defaultValues,
  focusOnMount = false,
  onSaved,
}: {
  slot: WalletSlot
  title: string
  defaultValues: WalletInput
  focusOnMount?: boolean
  onSaved?: () => void
}) {
  const save = useSaveWallet()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<WalletInput>({ resolver: zodResolver(WalletInput), defaultValues })
  const errors = form.formState.errors

  useEffect(() => {
    if (focusOnMount) form.setFocus('displayName')
  }, [focusOnMount, form])

  return (
    <form
      className="mt-8"
      noValidate
      aria-label={title}
      onSubmit={form.handleSubmit((values) => {
        setFormError(null)
        save.mutate(
          { slot, input: values },
          {
            onSuccess: () => {
              announce(`${title} salva`)
              toast.success(`${title} salva`)
              onSaved?.()
            },
            onError: (error) => applyApiFieldErrors(error, form.setError, setFormError),
          },
        )
      })}
    >
      <div className="grid gap-6 md:grid-cols-2 md:gap-x-7">
        <WalletField label="Nome de exibição" error={errors.displayName?.message}>
          <Input {...form.register('displayName')} />
        </WalletField>
        <WalletField label="Apelido da carteira" error={errors.nickname?.message}>
          <Input {...form.register('nickname')} />
        </WalletField>
        <WalletField label="Rede" error={errors.network?.message} select>
          <select {...form.register('network')}>
            {Object.entries(NETWORK_LABEL).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </WalletField>
        <WalletField label="Nome do perfil" error={errors.profileName?.message}>
          <Input {...form.register('profileName')} />
        </WalletField>
        <WalletField label="Endereço da carteira" error={errors.address?.message}>
          <Input placeholder="Endereço 0x da carteira" {...form.register('address')} />
        </WalletField>
        <WalletField label="Endereço secundário" error={errors.secondaryAddress?.message} hiddenLabel optional>
          <Input placeholder="ENS ou carteira secundária (opcional)" {...form.register('secondaryAddress')} />
        </WalletField>
        <WalletField label="Tipo de carteira" error={errors.provider?.message} select>
          <select {...form.register('provider')}>
            {Object.entries(WALLET_PROVIDER_LABEL).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </WalletField>
        <WalletField label="Código de indicação" error={errors.referralCode?.message}>
          <Input {...form.register('referralCode')} />
        </WalletField>
        <WalletField label="E-mail" error={errors.email?.message}>
          <Input type="email" {...form.register('email')} />
        </WalletField>
        <WalletField label="Nome ENS" error={errors.ensName?.message} ens>
          <Input {...form.register('ensName')} />
        </WalletField>
      </div>
      <div className="mt-4">
        <FormError>{formError}</FormError>
      </div>
      <Button
        type="submit"
        disabled={save.isPending}
        data-testid={`wallet-${slot}-save`}
        className="mt-4 h-10 w-[131px] rounded-xs px-0 text-sm font-bold"
      >
        {save.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}

const selectFieldClass =
  'h-10 w-full cursor-pointer appearance-none rounded-xs border border-input bg-transparent pr-12 pl-[13px] text-sm leading-[15px] text-cream outline-none focus-visible:border-copper focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-coral [&_option]:bg-surface'

/** Campo no padrão do frame "Desktop / Carteiras": rótulo 15px numa linha de 29px, input 4px acima do fim dela. */
function WalletField({
  label,
  error,
  select = false,
  ens = false,
  hiddenLabel = false,
  optional = false,
  children,
}: {
  label: string
  error?: string
  select?: boolean
  /** Campo ENS: seletor ".eth" à esquerda do input. */
  ens?: boolean
  /** O frame mostra só o placeholder; o rótulo fica para leitores de tela. */
  hiddenLabel?: boolean
  optional?: boolean
  children: ReactElement<Record<string, unknown>>
}) {
  const uid = useId()
  const inputId = `${uid}-input`
  const errorId = `${uid}-error`
  const field = cloneElement(children, {
    id: inputId,
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': error ? errorId : undefined,
    'aria-required': optional ? undefined : true,
    className: select ? selectFieldClass : 'h-10 text-sm placeholder:text-khaki',
  })

  return (
    <div className={cn('min-w-0', hiddenLabel && 'md:self-end')}>
      <label
        htmlFor={inputId}
        className={cn('flex h-[29px] items-center text-[15px] leading-[15px] text-cream', hiddenLabel && 'sr-only')}
      >
        {label}
      </label>
      <div className={cn('flex gap-2.5', !hiddenLabel && '-mt-1')}>
        {ens ? (
          <div className="relative w-[78px] shrink-0">
            <select
              aria-label="Domínio ENS"
              className="h-10 w-full cursor-pointer appearance-none rounded-xs border border-input bg-transparent pl-[9px] text-[15px] leading-[15px] text-cream outline-none focus-visible:border-copper focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_option]:bg-surface"
              defaultValue=".eth"
            >
              <option value=".eth">.eth</option>
            </select>
            <ArrowDownIcon aria-hidden className="pointer-events-none absolute top-2.5 left-[53px] size-5 text-cream" />
          </div>
        ) : null}
        {select ? (
          <div className="relative w-full">
            {field}
            <ArrowDownIcon aria-hidden className="pointer-events-none absolute top-2.5 right-[33px] size-5 text-khaki" />
          </div>
        ) : (
          field
        )}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-coral">
          {error}
        </p>
      ) : null}
    </div>
  )
}
