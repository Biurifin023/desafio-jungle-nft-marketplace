import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLogout } from '@/api/session'
import { Button } from '@/components/ui/button'
import { requireAuth } from '@/features/session/guard'
import { useSessionSnapshot } from '@/features/session/session-store'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireAuth,
  staticData: { title: 'Perfil', mobileChrome: 'tabbar' },
  component: ProfileStub,
})

function ProfileStub() {
  const snapshot = useSessionSnapshot()
  const logout = useLogout()
  const navigate = useNavigate()
  const user = snapshot.status === 'authenticated' ? snapshot.user : null

  return (
    <section className="page-container py-16" aria-labelledby="profile-title">
      <h1 id="profile-title" className="text-3xl font-bold text-cream">
        Perfil do colecionador
      </h1>
      <p className="mt-3 text-sand">Edição de dados, avatar e senha entram na Etapa 6.</p>
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
      <Button
        type="button"
        variant="outline"
        className="mt-8"
        data-testid="logout"
        disabled={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })}
      >
        Sair
      </Button>
    </section>
  )
}
