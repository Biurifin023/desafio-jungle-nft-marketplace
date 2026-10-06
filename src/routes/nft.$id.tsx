import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nft/$id')({
  staticData: { nav: 'mercado', title: 'Detalhe do NFT' },
  component: NftStub,
})

function NftStub() {
  const { id } = Route.useParams()
  return (
    <section className="page-container py-16" aria-labelledby="nft-title">
      <h1 id="nft-title" className="text-3xl font-bold text-cream">
        NFT {id}
      </h1>
      <p className="mt-3 text-sand">Galeria, edições e favoritos entram na Etapa 2.</p>
    </section>
  )
}
