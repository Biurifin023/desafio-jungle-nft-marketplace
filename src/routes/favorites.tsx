import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/favorites')({
  beforeLoad: requireAuth,
  staticData: { title: 'Favoritos', mobileChrome: 'tabbar' },
  component: FavoritesStub,
})

function FavoritesStub() {
  return (
    <section className="page-container py-16" aria-labelledby="fav-title">
      <h1 id="fav-title" className="text-3xl font-bold text-cream">
        Favoritos
      </h1>
      <p className="mt-3 text-sand">A lista de favoritos usa o mesmo contrato da Etapa 2.</p>
    </section>
  )
}
