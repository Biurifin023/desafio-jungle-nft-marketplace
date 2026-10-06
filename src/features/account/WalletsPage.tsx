import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { NETWORK_LABEL, WALLET_PROVIDER_LABEL, WalletInput, type Wallet, type WalletSlot } from '@/api/contracts'
import { useSaveWallet, useWallets } from '@/api/account'
import { applyApiFieldErrors } from '@/features/auth/field-errors'
import { ErrorState } from '@/components/common/QueryState'
import { FormError, FormField, selectClassName } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { announce } from '@/lib/announce'

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

export function WalletsPage() {
  const wallets = useWallets()

  if (wallets.isError && !wallets.data) {
    return <ErrorState className="page-container py-16" error={wallets.error} onRetry={() => void wallets.refetch()} />
  }

  return (
    <section className="page-container py-10" aria-labelledby="wallets-title">
      <nav aria-label="Trilha" className="text-sm font-bold text-cream">
        <Link to="/profile">Perfil</Link>
        <span> / </span>
        <span>Carteiras</span>
      </nav>
      <h1 id="wallets-title" className="mt-4 text-3xl font-bold text-cream">
        Carteiras
      </h1>
      <p className="mt-2 max-w-xl text-sand">Cadastre a carteira principal e uma reserva. Os endereços precisam ser únicos entre as duas.</p>

      {wallets.isPending ? <p className="mt-8 text-sand">Carregando carteiras…</p> : null}
      {wallets.data ? (
        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <WalletForm slot="primary" title="Carteira principal" wallet={wallets.data.primary} />
          <WalletForm slot="secondary" title="Carteira secundária" wallet={wallets.data.secondary} />
        </div>
      ) : null}
    </section>
  )
}

function WalletForm({ slot, title, wallet }: { slot: WalletSlot; title: string; wallet: Wallet | null }) {
  const save = useSaveWallet()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<WalletInput>({
    resolver: zodResolver(WalletInput),
    defaultValues: wallet ?? emptyWallet(''),
  })

  return (
    <form
      className="grid gap-5 rounded-md bg-surface p-6"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        setFormError(null)
        save.mutate(
          { slot, input: values },
          {
            onSuccess: () => {
              announce(`${title} salva`)
              toast.success(`${title} salva`)
            },
            onError: (error) => applyApiFieldErrors(error, form.setError, setFormError),
          },
        )
      })}
    >
      <h2 className="text-lg font-bold text-cream">{title}</h2>
      <FormField label="Nome de exibição" error={form.formState.errors.displayName?.message} required>
        <Input {...form.register('displayName')} />
      </FormField>
      <FormField label="Apelido da carteira" error={form.formState.errors.nickname?.message} required>
        <Input {...form.register('nickname')} />
      </FormField>
      <FormField label="Nome do perfil" error={form.formState.errors.profileName?.message} required>
        <Input {...form.register('profileName')} />
      </FormField>
      <FormField label="Endereço" error={form.formState.errors.address?.message} required>
        <Input {...form.register('address')} />
      </FormField>
      <FormField label="Endereço secundário" error={form.formState.errors.secondaryAddress?.message}>
        <Input {...form.register('secondaryAddress')} />
      </FormField>
      <FormField label="Rede" error={form.formState.errors.network?.message} required>
        <select className={selectClassName} {...form.register('network')}>
          {Object.entries(NETWORK_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Provedor" error={form.formState.errors.provider?.message} required>
        <select className={selectClassName} {...form.register('provider')}>
          {Object.entries(WALLET_PROVIDER_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
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
      <FormError>{formError}</FormError>
      <Button type="submit" disabled={save.isPending} data-testid={`wallet-${slot}-save`}>
        {save.isPending ? 'Salvando…' : `Salvar ${slot === 'primary' ? 'principal' : 'secundária'}`}
      </Button>
    </form>
  )
}
