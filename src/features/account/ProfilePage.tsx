import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useLogout } from '@/api/session'
import { useChangePassword, useProfile, useRemoveAvatar, useUpdateAvatar, useUpdateProfile } from '@/api/account'
import { ChangePasswordInput, UpdateProfileInput } from '@/api/contracts'
import { applyApiFieldErrors } from '@/features/auth/field-errors'
import { ErrorState } from '@/components/common/QueryState'
import { FormError, FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { announce } from '@/lib/announce'
import { useSessionSnapshot } from '@/features/session/session-store'

export function ProfilePage() {
  const snapshot = useSessionSnapshot()
  const user = snapshot.status === 'authenticated' ? snapshot.user : null
  const profile = useProfile()
  const logout = useLogout()
  const navigate = useNavigate()

  if (profile.isError && !profile.data) {
    return <ErrorState className="page-container py-16" error={profile.error} onRetry={() => void profile.refetch()} />
  }

  return (
    <section className="page-container py-10" aria-labelledby="profile-title">
      <h1 id="profile-title" className="text-3xl font-bold text-cream">
        Perfil do colecionador
      </h1>
      {user ? (
        <dl className="mt-6 space-y-2 text-cream">
          <div>
            <dt className="text-sm text-sand">Nome</dt>
            <dd data-testid="session-name">{user.displayName}</dd>
          </div>
          <div>
            <dt className="text-sm text-sand">E-mail</dt>
            <dd data-testid="session-email">{user.email}</dd>
          </div>
        </dl>
      ) : null}

      {profile.data ? <ProfileForm key={profile.data.version} initial={profile.data} /> : <p className="mt-8 text-sand">Carregando perfil…</p>}
      {profile.data ? <AvatarForm avatarUrl={profile.data.avatarUrl} /> : null}
      <PasswordForm />

      <div className="mt-10 flex flex-wrap gap-4">
        <Button asChild variant="outline">
          <Link to="/wallets">Gerenciar carteiras</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          data-testid="logout"
          disabled={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })}
        >
          Sair
        </Button>
      </div>
    </section>
  )
}

function ProfileForm({ initial }: { initial: UpdateProfileInput }) {
  const update = useUpdateProfile()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileInput),
    defaultValues: initial,
  })

  return (
    <form
      className="mt-10 grid gap-5 md:max-w-xl"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        setFormError(null)
        update.mutate(values, {
          onSuccess: () => {
            announce('Perfil atualizado')
            toast.success('Perfil atualizado')
          },
          onError: (error) => applyApiFieldErrors(error, form.setError, setFormError),
        })
      })}
    >
      <h2 className="text-lg font-bold text-cream">Dados do perfil</h2>
      <FormField label="Nome de exibição" error={form.formState.errors.displayName?.message} required>
        <Input {...form.register('displayName')} />
      </FormField>
      <FormField label="Nome de usuário" error={form.formState.errors.username?.message} required>
        <Input {...form.register('username')} />
      </FormField>
      <FormField label="E-mail" error={form.formState.errors.email?.message} required>
        <Input type="email" {...form.register('email')} />
      </FormField>
      <FormField label="ENS" error={form.formState.errors.ensName?.message} required>
        <Input {...form.register('ensName')} />
      </FormField>
      <FormField label="Apelido da carteira" error={form.formState.errors.walletNickname?.message} required>
        <Input {...form.register('walletNickname')} />
      </FormField>
      <FormError>{formError}</FormError>
      <Button type="submit" disabled={update.isPending} data-testid="profile-save">
        {update.isPending ? 'Salvando…' : 'Salvar perfil'}
      </Button>
    </form>
  )
}

function AvatarForm({ avatarUrl }: { avatarUrl: string | null }) {
  const update = useUpdateAvatar()
  const remove = useRemoveAvatar()
  const [error, setError] = useState<string | null>(null)

  function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '')
      update.mutate(
        { dataUrl },
        {
          onSuccess: () => {
            announce('Avatar atualizado')
            toast.success('Avatar atualizado')
          },
          onError: (err) => setError(err instanceof Error ? err.message : 'Não foi possível enviar o avatar'),
        },
      )
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="mt-10 md:max-w-xl">
      <h2 className="text-lg font-bold text-cream">Avatar</h2>
      {avatarUrl ? <img src={avatarUrl} alt="Avatar atual" className="mt-4 size-20 rounded-full object-cover" data-testid="avatar-preview" /> : null}
      <label className="mt-4 block text-sm text-cream">
        Enviar imagem
        <Input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="mt-2"
          data-testid="avatar-input"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      {avatarUrl ? (
        <Button type="button" variant="outline" className="mt-3" disabled={remove.isPending} onClick={() => remove.mutate()}>
          Remover avatar
        </Button>
      ) : null}
      <FormError>{error}</FormError>
    </div>
  )
}

function PasswordForm() {
  const change = useChangePassword()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordInput),
    defaultValues: { currentPassword: '', newPassword: '' },
  })

  useEffect(() => {
    if (change.isSuccess) form.reset()
  }, [change.isSuccess, form])

  return (
    <form
      className="mt-10 grid gap-5 md:max-w-xl"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        setFormError(null)
        change.mutate(values, {
          onSuccess: () => {
            announce('Senha alterada')
            toast.success('Senha alterada')
          },
          onError: (error) => applyApiFieldErrors(error, form.setError, setFormError),
        })
      })}
    >
      <h2 className="text-lg font-bold text-cream">Alterar senha</h2>
      <FormField label="Senha atual" error={form.formState.errors.currentPassword?.message} required>
        <Input type="password" autoComplete="current-password" {...form.register('currentPassword')} />
      </FormField>
      <FormField label="Nova senha" error={form.formState.errors.newPassword?.message} required>
        <Input type="password" autoComplete="new-password" {...form.register('newPassword')} />
      </FormField>
      <FormError>{formError}</FormError>
      <Button type="submit" disabled={change.isPending} data-testid="password-save">
        {change.isPending ? 'Alterando…' : 'Alterar senha'}
      </Button>
    </form>
  )
}
