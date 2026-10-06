import { useQueries } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/contracts'
import { useFavorites } from '@/api/favorites'
import { nftDetailQuery } from '@/api/nfts'
import { EmptyState, ErrorState } from '@/components/common/QueryState'
import { Skeleton } from '@/components/ui/skeleton'
import { FavoriteButton } from './FavoriteButton'
import { NftCard } from './NftCard'

function FavoriteItem({ nft }: { nft: Nft }) {
  return (
    <div className="relative">
      <NftCard nft={nft} />
      <div className="absolute top-3 right-3">
        <FavoriteButton nftId={nft.id} variant="icon" />
      </div>
    </div>
  )
}

export function FavoritesPage() {
  const favorites = useFavorites()
  const ids = favorites.data?.nftIds ?? []
  const details = useQueries({
    queries: ids.map((id) => ({ ...nftDetailQuery(id) })),
  })

  const isPending = favorites.isPending || details.some((query) => query.isPending)
  const firstError = favorites.error ?? details.find((query) => query.error)?.error
  const nfts = details.map((query) => query.data).filter((nft): nft is Nft => Boolean(nft))

  return (
    <section className="page-container py-10 lg:py-16" aria-labelledby="fav-title">
      <h1 id="fav-title" className="text-3xl font-bold text-cream">
        Favoritos
      </h1>
      <p className="mt-2 text-sand">Colecionáveis que você marcou para acompanhar.</p>

      {favorites.isError ? (
        <ErrorState className="mt-10" error={favorites.error} onRetry={() => void favorites.refetch()} title="Não foi possível carregar os favoritos" />
      ) : isPending ? (
        <ul className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Carregando favoritos">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i}>
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </li>
          ))}
        </ul>
      ) : firstError ? (
        <ErrorState className="mt-10" error={firstError} onRetry={() => void favorites.refetch()} />
      ) : nfts.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Nenhum favorito ainda"
          description="Toque em Favoritar na página de um NFT para guardá-lo aqui."
          action={
            <Link to="/" hash="catalogo" resetScroll={false} className="text-amber underline-offset-4 hover:underline">
              Explorar o catálogo
            </Link>
          }
        />
      ) : (
        <ul data-testid="favorites-list" className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {nfts.map((nft) => (
            <li key={nft.id} data-testid="favorite-id" data-nft-id={nft.id}>
              <FavoriteItem nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
