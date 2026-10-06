import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const LoginSearch = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: (raw) => LoginSearch.parse(raw),
  staticData: { title: 'Entrar', mobileChrome: 'none' },
  component: LoginStub,
})

function LoginStub() {
  return (
    <section className="page-container py-16" aria-labelledby="login-title">
      <h1 id="login-title" className="text-3xl font-bold text-cream">
        Entrar
      </h1>
      <p className="mt-3 text-sand">Formulário de autenticação entra na Etapa 3.</p>
    </section>
  )
}
