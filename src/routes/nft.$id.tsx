import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '@/features/nft/NftDetailPage'

export const Route = createFileRoute('/nft/$id')({
  staticData: { nav: 'inicio', title: 'Detalhe do NFT', mobileChrome: 'none' },
  component: NftRoute,
})

function NftRoute() {
  const { id } = Route.useParams()
  return <NftDetailPage key={id} id={id} />
}
