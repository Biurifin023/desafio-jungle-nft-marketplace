import { createFileRoute } from '@tanstack/react-router'
import { useFavorites } from '@/api/favorites'
import { EmptyState, ErrorState } from '@/components/common/QueryState'
import { requireAuth } from '@/features/session/guard'

export const Route = createFileRoute('/favorites')({
  beforeLoad: requireAuth,
  staticData: { title: 'Favoritos', mobileChrome: 'tabbar' },
  component: FavoritesStub,
})

function FavoritesStub() {
  const favorites = useFavorites()

  return (
    <section className="page-container py-16" aria-labelledby="fav-title">
      <h1 id="fav-title" className="text-3xl font-bold text-cream">
        Favoritos
      </h1>
      <p className="mt-3 text-sand">A lista de favoritos usa o mesmo contrato da Etapa 2.</p>
      {favorites.isPending ? (
        <p className="mt-6 text-sand" role="status">
          Carregando favoritos…
        </p>
      ) : null}
      {favorites.isError ? <ErrorState className="mt-6" error={favorites.error} onRetry={() => void favorites.refetch()} /> : null}
      {favorites.isSuccess && !favorites.data.nftIds.length ? (
        <EmptyState className="mt-6" title="Nenhum NFT favorito neste perfil." />
      ) : null}
      {favorites.isSuccess && favorites.data.nftIds.length > 0 ? (
        <ul data-testid="favorites-list" className="mt-6 space-y-2 text-cream">
          {favorites.data.nftIds.map((id) => (
            <li key={id} data-testid="favorite-id">
              {id}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
