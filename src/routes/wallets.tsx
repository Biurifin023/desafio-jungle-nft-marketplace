import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/wallets')({
  beforeLoad: requireAuth,
  staticData: { title: 'Carteiras', mobileChrome: 'tabbar' },
  component: WalletsStub,
})

function WalletsStub() {
  return (
    <section className="page-container py-16" aria-labelledby="wallets-title">
      <h1 id="wallets-title" className="text-3xl font-bold text-cream">
        Carteiras
      </h1>
      <p className="mt-3 text-sand">Cadastro e edição das carteiras entram na Etapa 6.</p>
    </section>
  )
}
