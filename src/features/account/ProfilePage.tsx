import { cloneElement, useId, useRef, useState, type ReactElement } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useChangePassword, useProfile, useRemoveAvatar, useUpdateAvatar, useUpdateProfile } from '@/api/account'
import { ChangePasswordInput, UpdateProfileInput } from '@/api/contracts'
import { applyApiFieldErrors } from '@/features/auth/field-errors'
import { ErrorState } from '@/components/common/QueryState'
import { FormError } from '@/components/common/FormField'
import { ArrowDownIcon, HideIcon, ImageIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { announce } from '@/lib/announce'
import { useSessionSnapshot } from '@/features/session/session-store'
import { AccountSidebar } from './AccountSidebar'

const AVATAR_MAX_BYTES = 1024 * 1024

/** Perfil e troca de senha num só formulário (um botão "Salvar", como no Figma); a senha é opcional. */
const ProfileFormSchema = UpdateProfileInput.extend({
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
}).superRefine((values, ctx) => {
  if (!values.currentPassword && !values.newPassword && !values.confirmPassword) return
  const password = ChangePasswordInput.safeParse({ currentPassword: values.currentPassword, newPassword: values.newPassword })
  if (!password.success) {
    for (const issue of password.error.issues) ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message })
  }
  if (values.confirmPassword !== values.newPassword) {
    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas não coincidem' })
  }
})
type ProfileFormValues = z.infer<typeof ProfileFormSchema>

export function ProfilePage() {
  const snapshot = useSessionSnapshot()
  const user = snapshot.status === 'authenticated' ? snapshot.user : null
  const profile = useProfile()

  if (profile.isError && !profile.data) {
    return <ErrorState className="page-container py-16" error={profile.error} onRetry={() => void profile.refetch()} />
  }

  return (
    <div className="page-container flex flex-col gap-7 pt-8 pb-16 lg:flex-row">
      <AccountSidebar active="profile" />
      <section className="min-w-0 flex-1" aria-labelledby="profile-title">
        <h1 id="profile-title" className="text-base leading-4 font-bold text-cream">
          Perfil do colecionador
        </h1>
        {user ? (
          <p className="sr-only">
            Conectado como <span data-testid="session-name">{user.displayName}</span> (
            <span data-testid="session-email">{user.email}</span>)
          </p>
        ) : null}
        {profile.data ? (
          <ProfileForm initial={profile.data} avatarUrl={profile.data.avatarUrl} />
        ) : (
          <p className="mt-8 text-sand">Carregando perfil…</p>
        )}
      </section>
    </div>
  )
}

function ProfileForm({ initial, avatarUrl }: { initial: UpdateProfileInput; avatarUrl: string | null }) {
  const update = useUpdateProfile()
  const change = useChangePassword()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      displayName: initial.displayName,
      username: initial.username,
      email: initial.email,
      ensName: initial.ensName,
      walletNickname: initial.walletNickname,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  const errors = form.formState.errors
  const saving = update.isPending || change.isPending

  async function onSubmit({ currentPassword, newPassword, confirmPassword, ...profileValues }: ProfileFormValues) {
    setFormError(null)
    const wantsPassword = Boolean(currentPassword || newPassword || confirmPassword)
    try {
      await update.mutateAsync(profileValues)
    } catch (error) {
      applyApiFieldErrors(error, form.setError, setFormError)
      return
    }
    if (wantsPassword) {
      try {
        await change.mutateAsync({ currentPassword, newPassword })
      } catch (error) {
        applyApiFieldErrors(error, form.setError, setFormError)
        announce('Perfil atualizado, mas a senha não foi alterada.', 'assertive')
        return
      }
    }
    form.reset({ ...profileValues, currentPassword: '', newPassword: '', confirmPassword: '' })
    const message = wantsPassword ? 'Perfil atualizado e senha alterada' : 'Perfil atualizado'
    announce(message)
    toast.success(message)
  }

  return (
    <form className="mt-8" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-6 md:grid-cols-2 md:gap-x-7">
        <ProfileField label="Nome de exibição" error={errors.displayName?.message}>
          <Input autoComplete="name" {...form.register('displayName')} />
        </ProfileField>
        <ProfileField label="Nome de usuário" error={errors.username?.message}>
          <Input autoComplete="username" {...form.register('username')} />
        </ProfileField>
        <ProfileField label="E-mail" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register('email')} />
        </ProfileField>
        <ProfileField label="Nome ENS" error={errors.ensName?.message} ens>
          <Input {...form.register('ensName')} />
        </ProfileField>
        <ProfileField label="Apelido da carteira" error={errors.walletNickname?.message}>
          <Input {...form.register('walletNickname')} />
        </ProfileField>
        <AvatarField avatarUrl={avatarUrl} />
      </div>

      <div role="group" aria-labelledby="password-title" className="mt-8 grid gap-6 md:max-w-[417px]">
        <h2 id="password-title" className="text-base leading-4 font-medium text-cream">
          Alterar senha
        </h2>
        <PasswordField label="Senha atual" autoComplete="current-password" error={errors.currentPassword?.message} registration={form.register('currentPassword')} />
        <PasswordField label="Nova senha" autoComplete="new-password" error={errors.newPassword?.message} registration={form.register('newPassword')} />
        <PasswordField
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={form.register('confirmPassword')}
        />
      </div>

      <div className="mt-4">
        <FormError>{formError}</FormError>
      </div>
      <Button type="submit" disabled={saving} data-testid="profile-save" className="mt-4 h-10 w-[131px] rounded-xs text-sm font-bold">
        {saving ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}

/** Campo obrigatório no padrão do Figma: rótulo 15px numa linha de 29px e 10px até o input. */
function ProfileField({
  label,
  error,
  ens = false,
  children,
}: {
  label: string
  error?: string
  /** Campo ENS: seletor ".eth" à esquerda do input. */
  ens?: boolean
  children: ReactElement<Record<string, unknown>>
}) {
  const uid = useId()
  const inputId = `${uid}-input`
  const errorId = `${uid}-error`
  const field = cloneElement(children, {
    id: inputId,
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': error ? errorId : undefined,
    'aria-required': true,
    className: 'h-10 text-[15px]',
  })

  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="flex h-[29px] items-center text-[15px] leading-[15px] text-cream">
        {label}
      </label>
      <div className="mt-2.5 flex gap-2.5">
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
        {field}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-coral">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function PasswordField({
  label,
  autoComplete,
  error,
  registration,
}: {
  label: string
  autoComplete: string
  error?: string
  registration: UseFormRegisterReturn
}) {
  const uid = useId()
  const inputId = `${uid}-input`
  const errorId = `${uid}-error`
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={inputId} className="block text-[15px] leading-[15px] text-cream">
        {label}
      </label>
      <div className="relative mt-3">
        <Input
          id={inputId}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-10 pr-12 text-[15px]"
          {...registration}
        />
        <button
          type="button"
          className="absolute top-1/2 right-4 grid -translate-y-1/2 cursor-pointer place-items-center text-khaki transition-colors hover:text-sand"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          <HideIcon aria-hidden className="h-5 w-5" />
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-coral">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function AvatarField({ avatarUrl }: { avatarUrl: string | null }) {
  const update = useUpdateAvatar()
  const remove = useRemoveAvatar()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (file.size > AVATAR_MAX_BYTES) {
      setError('A imagem precisa ter até 1 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      update.mutate(
        { dataUrl: String(reader.result ?? '') },
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
    <div role="group" aria-labelledby="avatar-label" className="min-w-0">
      <p id="avatar-label" className="text-[15px] leading-[15px] text-cream">
        Avatar
      </p>
      <div className="mt-2.5 flex items-center gap-6">
        <div className="grid size-[50px] shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar atual" className="size-full object-cover" data-testid="avatar-preview" />
          ) : (
            <ImageIcon aria-hidden className="size-6 text-copper" />
          )}
        </div>
        <div className="flex items-center gap-5">
          <Button
            type="button"
            className="h-10 w-[98px] justify-start rounded-xs pl-[25px] text-sm font-bold"
            disabled={update.isPending}
            onClick={() => fileRef.current?.click()}
          >
            Alterar
          </Button>
          <button
            type="button"
            className="cursor-pointer text-sm leading-4 text-cream transition-colors hover:text-amber disabled:cursor-not-allowed"
            disabled={!avatarUrl || remove.isPending}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () => announce('Avatar removido'),
              })
            }
          >
            Remover
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          tabIndex={-1}
          aria-label="Enviar avatar"
          data-testid="avatar-input"
          onChange={(event) => {
            onFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      <FormError>{error}</FormError>
    </div>
  )
}
