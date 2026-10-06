import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthChrome } from '@/features/auth/AuthChrome'
import { LoginForm } from '@/features/auth/LoginForm'
import { safeRedirect } from '@/features/session/guard'
import { sessionStore } from '@/features/session/session-store'

const LoginSearch = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: (raw) => LoginSearch.parse(raw),
  staticData: { title: 'Entrar', mobileChrome: 'none' },
  beforeLoad: ({ search }) => {
    if (sessionStore.get().status === 'authenticated') {
      throw redirect({ href: safeRedirect(search.redirect) })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect: next } = Route.useSearch()
  return (
    <AuthChrome mode="login" redirect={next}>
      <LoginForm redirect={next} />
    </AuthChrome>
  )
}
