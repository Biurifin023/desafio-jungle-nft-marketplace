import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useRegister } from '@/api/session'
import { Button } from '@/components/ui/button'
import { announce } from '@/lib/announce'
import { safeRedirect } from '@/features/session/guard'
import { useDesktopAuth } from './use-desktop'
import { AuthField, AuthFormError } from './AuthField'
import { applyApiFieldErrors } from './field-errors'
import { RegisterFormInput, toRegisterPayload } from './schema'

export function RegisterForm({ redirect }: { redirect?: string }) {
  const navigate = useNavigate()
  const register = useRegister()
  const desktop = useDesktopAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(RegisterFormInput),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((values) => {
        setFormError(null)
        register.mutate(toRegisterPayload(values), {
          onSuccess: () => {
            announce('Conta criada. Você já está autenticado.')
            void navigate({ href: safeRedirect(redirect) })
          },
          onError: (error) => applyApiFieldErrors(error, form.setError, setFormError),
        })
      })}
    >
      <AuthField
        label="Nome de usuário"
        autoComplete="username"
        placeholder="Nome de usuário"
        registration={form.register('username')}
        error={form.formState.errors.username}
      />
      <AuthField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        registration={form.register('email')}
        error={form.formState.errors.email}
      />
      <AuthField
        label="Senha"
        type="password"
        autoComplete="new-password"
        placeholder="Senha"
        registration={form.register('password')}
        error={form.formState.errors.password}
      />
      <AuthField
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        placeholder="Confirmar senha"
        registration={form.register('confirmPassword')}
        error={form.formState.errors.confirmPassword}
      />
      <AuthFormError>{formError}</AuthFormError>
      <Button
        type="submit"
        data-testid="auth-submit"
        disabled={register.isPending}
        className="mt-3 h-[60px] w-full rounded-[10px] text-base lg:h-[45px] lg:rounded-sm"
      >
        {register.isPending ? 'Criando…' : desktop ? 'Criar conta' : 'Criar perfil'}
      </Button>
    </form>
  )
}
