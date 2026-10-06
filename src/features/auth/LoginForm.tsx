import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useLogin } from '@/api/session'
import { Button } from '@/components/ui/button'
import { NotAvailableLink } from '@/components/common/NotAvailable'
import { announce } from '@/lib/announce'
import { safeRedirect } from '@/features/session/guard'
import { LoginInput, type LoginInput as LoginValues } from '@/api/contracts'
import { AuthField, AuthFormError } from './AuthField'
import { applyApiFieldErrors } from './field-errors'

export function LoginForm({ redirect }: { redirect?: string }) {
  const navigate = useNavigate()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginInput),
    defaultValues: { email: '', password: '' },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((values) => {
        setFormError(null)
        login.mutate(values, {
          onSuccess: () => {
            announce('Você entrou na Kurio.')
            void navigate({ href: safeRedirect(redirect) })
          },
          onError: (error) => applyApiFieldErrors(error, form.setError, setFormError),
        })
      })}
    >
      <AuthField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        registration={form.register('email')}
        error={form.formState.errors.email}
      />
      <AuthField
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="Senha"
        registration={form.register('password')}
        error={form.formState.errors.password}
      />
      <div className="flex justify-end">
        <NotAvailableLink feature="Recuperar senha" className="cursor-pointer text-sm text-amber hover:underline">
          Esqueceu a senha?
        </NotAvailableLink>
      </div>
      <AuthFormError>{formError}</AuthFormError>
      <Button
        type="submit"
        data-testid="auth-submit"
        disabled={login.isPending}
        className="mt-3 h-[60px] w-full rounded-[10px] text-base lg:mt-3 lg:h-[45px] lg:rounded-sm"
      >
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
