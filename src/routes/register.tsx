import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const RegisterSearch = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/register')({
  validateSearch: (raw) => RegisterSearch.parse(raw),
  staticData: { title: 'Cadastro', mobileChrome: 'none' },
  component: RegisterStub,
})

function RegisterStub() {
  return (
    <section className="page-container py-16" aria-labelledby="register-title">
      <h1 id="register-title" className="text-3xl font-bold text-cream">
        Criar perfil de colecionador
      </h1>
      <p className="mt-3 text-sand">Formulário de cadastro entra na Etapa 3.</p>
    </section>
  )
}
