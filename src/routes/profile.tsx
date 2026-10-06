import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireAuth,
  staticData: { title: 'Perfil', mobileChrome: 'tabbar' },
  component: ProfileStub,
})

function ProfileStub() {
  return (
    <section className="page-container py-16" aria-labelledby="profile-title">
      <h1 id="profile-title" className="text-3xl font-bold text-cream">
        Perfil do colecionador
      </h1>
      <p className="mt-3 text-sand">Edição de dados, avatar e senha entram na Etapa 6.</p>
    </section>
  )
}
