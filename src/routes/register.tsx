import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthChrome } from '@/features/auth/AuthChrome'
import { RegisterForm } from '@/features/auth/RegisterForm'
import { safeRedirect } from '@/features/session/guard'
import { sessionStore } from '@/features/session/session-store'

const RegisterSearch = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/register')({
  validateSearch: (raw) => RegisterSearch.parse(raw),
  staticData: { title: 'Cadastro', mobileChrome: 'none' },
  beforeLoad: ({ search }) => {
    if (sessionStore.get().status === 'authenticated') {
      throw redirect({ href: safeRedirect(search.redirect) })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect: next } = Route.useSearch()
  return (
    <AuthChrome mode="register" redirect={next}>
      <RegisterForm redirect={next} />
    </AuthChrome>
  )
}
