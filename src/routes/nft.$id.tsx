import { createFileRoute } from '@tanstack/react-router'
import { nftDetailQuery, nftRelatedQuery } from '@/api/nfts'
import { NftDetailPage } from '@/features/nft/NftDetailPage'

export const Route = createFileRoute('/nft/$id')({
  // Sem await: as requisições começam em paralelo com o chunk do componente.
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(nftDetailQuery(params.id))
    void queryClient.prefetchQuery(nftRelatedQuery(params.id))
  },
  staticData: { nav: 'inicio', title: 'Detalhe do NFT', mobileChrome: 'none' },
  component: NftRoute,
})

function NftRoute() {
  const { id } = Route.useParams()
  return <NftDetailPage key={id} id={id} />
}
